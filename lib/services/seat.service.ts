import { prisma } from "@/lib/db";
import { SeatStatus } from "@prisma/client";
import { CreateSeatInput } from "@/lib/validations/seat.schema";

export class SeatService {
  static async getSeats(params: {
    page: number;
    limit: number;
    status?: string;
    floor?: number;
    zone?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status as SeatStatus;
    }
    if (params.floor) {
      where.floor = params.floor;
    }
    if (params.zone) {
      where.zone = params.zone;
    }

    const [seats, total] = await Promise.all([
      prisma.seat.findMany({
        where,
        skip,
        take,
        include: {
          employee: true,
        },
        orderBy: { seatCode: "asc" },
      }),
      prisma.seat.count({ where }),
    ]);

    return { seats, total };
  }

  static async getAvailableSeats(params: {
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const where = { status: SeatStatus.AVAILABLE };

    const [seats, total] = await Promise.all([
      prisma.seat.findMany({
        where,
        skip,
        take,
        orderBy: { seatCode: "asc" },
      }),
      prisma.seat.count({ where }),
    ]);

    return { seats, total };
  }

  static async getSeatById(id: string) {
    return prisma.seat.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });
  }

  static async createSeat(data: CreateSeatInput) {
    return prisma.seat.create({
      data: {
        seatCode: data.seatCode,
        floor: data.floor,
        zone: data.zone,
        bay: data.bay,
        seatNumber: data.seatNumber,
        status: data.status || SeatStatus.AVAILABLE,
      },
    });
  }

  static async allocateSeat(employeeId: string, seatId: string) {
    // 1. Fetch employee and check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { seat: true },
    });
    if (!employee) {
      const error: any = new Error("Employee not found");
      error.status = 404;
      throw error;
    }

    if (employee.seat) {
      const error: any = new Error("Employee already has an active seat allocation");
      error.status = 409;
      throw error;
    }

    // 2. Fetch target seat and check availability
    const targetSeat = await prisma.seat.findUnique({
      where: { id: seatId },
    });
    if (!targetSeat) {
      const error: any = new Error("Seat not found");
      error.status = 404;
      throw error;
    }

    // 3. Check seat status
    if (targetSeat.status === SeatStatus.OCCUPIED) {
      const error: any = new Error("Seat is already OCCUPIED");
      error.status = 409;
      throw error;
    }

    if (targetSeat.status === SeatStatus.RESERVED) {
      const error: any = new Error("Seat is RESERVED and cannot be allocated directly. Change status to AVAILABLE first.");
      error.status = 409;
      throw error;
    }

    if (targetSeat.status === SeatStatus.MAINTENANCE) {
      const error: any = new Error("Seat is under MAINTENANCE");
      error.status = 409;
      throw error;
    }

    // 4. Update target seat to OCCUPIED and assign employee
    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: {
        employeeId,
        status: SeatStatus.OCCUPIED,
      },
    });

    await prisma.seatAllocation.create({
      data: {
        employeeId,
        seatId,
        projectId: employee.projectId,
        allocationStatus: "ACTIVE",
        notes: "Assigned via SeatService",
      },
    });

    return updatedSeat;
  }

  static async releaseSeat(seatId: string) {
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      const error: any = new Error("Seat not found");
      error.status = 404;
      throw error;
    }

    // Find the seat's current active seat_allocations record
    const activeAllocation = await prisma.seatAllocation.findFirst({
      where: {
        seatId,
        allocationStatus: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeAllocation) {
      const error: any = new Error("Seat has no active allocation to release");
      error.status = 404;
      throw error;
    }

    // Update the seat_allocations record
    await prisma.seatAllocation.update({
      where: { id: activeAllocation.id },
      data: {
        allocationStatus: "RELEASED",
        releasedDate: new Date(),
      },
    });

    // Set seat.status = AVAILABLE, clear seat.employeeId
    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: {
        employeeId: null,
        status: SeatStatus.AVAILABLE,
      },
    });

    return updatedSeat;
  }

  static async suggestSeatForEmployee(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { project: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    let preferredZones: string[] = [];

    // Get employee's assigned project and query seat_allocations
    if (employee.projectId) {
      // Find active allocations for other employees in the same project
      const allocations = await prisma.seatAllocation.findMany({
        where: {
          projectId: employee.projectId,
          allocationStatus: "ACTIVE",
          employeeId: { not: employeeId },
        },
        include: {
          seat: true,
        },
      });

      if (allocations.length > 0) {
        const zoneCounts: Record<string, number> = {};
        allocations.forEach((alloc) => {
          if (alloc.seat) {
            zoneCounts[alloc.seat.zone] = (zoneCounts[alloc.seat.zone] || 0) + 1;
          }
        });

        // Sort zones by count descending
        preferredZones = Object.entries(zoneCounts)
          .sort((a, b) => b[1] - a[1])
          .map((entry) => entry[0]);
      }
    }

    let selectedSeat = null;
    let usedZone = null;
    let isPreferredZone = false;
    let fallbackMessage = "";

    // 1. Try to find an available seat in the preferred zones
    for (const zone of preferredZones) {
      selectedSeat = await prisma.seat.findFirst({
        where: {
          status: SeatStatus.AVAILABLE,
          zone,
          employeeId: null,
        },
        orderBy: { seatCode: "asc" },
      });

      if (selectedSeat) {
        usedZone = zone;
        isPreferredZone = true;
        break;
      }
    }

    // 2. Fallback to any available seat
    if (!selectedSeat) {
      selectedSeat = await prisma.seat.findFirst({
        where: {
          status: SeatStatus.AVAILABLE,
          employeeId: null,
        },
        orderBy: [{ floor: "asc" }, { zone: "asc" }, { seatCode: "asc" }],
      });

      if (selectedSeat) {
        usedZone = selectedSeat.zone;
        isPreferredZone = false;
        if (preferredZones.length > 0) {
          fallbackMessage = `No seats available in preferred zone(s) [${preferredZones.join(", ")}], allocated in Zone ${usedZone} instead.`;
        } else {
          fallbackMessage = "No preferred zone could be determined, allocated fallback seat.";
        }
      }
    }

    if (!selectedSeat) {
      const error: any = new Error("No available seats found in the entire building.");
      error.status = 404;
      throw error;
    }

    // Removed automatic allocation so this function only suggests a seat

    return {
      seat: selectedSeat,
      usedZone,
      isPreferredZone,
      message: isPreferredZone ? `Allocated in preferred Zone ${usedZone}` : fallbackMessage,
    };
  }

  static async changeSeatStatus(seatId: string, newStatus: string) {
    if (newStatus === "OCCUPIED") {
      const error: any = new Error("Cannot change status to OCCUPIED directly. Use allocate flow.");
      error.status = 400;
      throw error;
    }

    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      const error: any = new Error("Seat not found");
      error.status = 404;
      throw error;
    }

    // Do not allow changing status if seat is actively occupied by an employee (except maybe to maintenance, but let's be safe)
    if (seat.employeeId) {
       const error: any = new Error("Cannot change status of a seat currently allocated to an employee. Release it first.");
       error.status = 409;
       throw error;
    }

    return prisma.seat.update({
      where: { id: seatId },
      data: {
        status: newStatus as SeatStatus,
      },
    });
  }
}
