import { prisma } from "@/lib/db";
import { SeatStatus } from "@prisma/client";

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

    return {
      seats,
      total,
    };
  }

  static async getSeatById(id: string) {
    return prisma.seat.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });
  }

  static async assignSeat(employeeId: string, seatId: string, notes?: string) {
    // 1. Fetch employee and check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { seat: true },
    });
    if (!employee) {
      throw new Error("Employee not found");
    }

    // 2. Fetch target seat and check availability
    const targetSeat = await prisma.seat.findUnique({
      where: { id: seatId },
    });
    if (!targetSeat) {
      throw new Error("Seat not found");
    }

    // If seat is occupied by another employee
    if (targetSeat.employeeId && targetSeat.employeeId !== employeeId) {
      const error: any = new Error("Seat already occupied");
      error.status = 409;
      throw error;
    }

    if (employee.seat && employee.seat.id === seatId) {
      // Already assigned to this exact seat, nothing to do
      return employee.seat;
    }

    // 3. Auto-release previous seat if employee has one (done sequentially)
    if (employee.seat) {
      await prisma.seat.update({
        where: { id: employee.seat.id },
        data: {
          employeeId: null,
          status: SeatStatus.AVAILABLE,
        },
      });

      await prisma.allocationHistory.create({
        data: {
          employeeId,
          seatId: employee.seat.id,
          action: "RELEASED",
          notes: `Auto-released during reassignment to seat ${targetSeat.seatCode}`,
        },
      });
    }

    // 4. Update target seat to OCCUPIED and assign employee
    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: {
        employeeId,
        status: SeatStatus.OCCUPIED,
      },
    });

    await prisma.allocationHistory.create({
      data: {
        employeeId,
        seatId,
        action: "ASSIGNED",
        notes: notes || "Assigned via SeatService",
      },
    });

    return updatedSeat;
  }

  static async releaseSeat(seatId: string, notes?: string) {
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      throw new Error("Seat not found");
    }

    if (!seat.employeeId) {
      // Seat already available, just return it
      return seat;
    }

    const employeeId = seat.employeeId;

    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: {
        employeeId: null,
        status: SeatStatus.AVAILABLE,
      },
    });

    await prisma.allocationHistory.create({
      data: {
        employeeId,
        seatId,
        action: "RELEASED",
        notes: notes || "Released via SeatService",
      },
    });

    return updatedSeat;
  }

  static async allocateNewJoiner(employeeId: string) {
    // 1. Fetch employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { project: true },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    let targetFloor: number | null = null;
    let targetZone: string | null = null;

    // 2. Try to suggest seat based on project team
    if (employee.projectId) {
      const teammates = await prisma.employee.findMany({
        where: {
          projectId: employee.projectId,
          id: { not: employeeId },
          seat: { isNot: null },
        },
        include: { seat: true },
      });

      if (teammates.length > 0) {
        // Find most common floor and zone
        const floorCounts: Record<number, number> = {};
        const zoneCounts: Record<string, number> = {};

        teammates.forEach((tm) => {
          if (tm.seat) {
            floorCounts[tm.seat.floor] = (floorCounts[tm.seat.floor] || 0) + 1;
            zoneCounts[tm.seat.zone] = (zoneCounts[tm.seat.zone] || 0) + 1;
          }
        });

        // Determine top floor
        let maxFloorCount = 0;
        for (const [floorStr, count] of Object.entries(floorCounts)) {
          const floorNum = parseInt(floorStr, 10);
          if (count > maxFloorCount) {
            maxFloorCount = count;
            targetFloor = floorNum;
          }
        }

        // Determine top zone
        let maxZoneCount = 0;
        for (const [zone, count] of Object.entries(zoneCounts)) {
          if (count > maxZoneCount) {
            maxZoneCount = count;
            targetZone = zone;
          }
        }
      }
    }

    // 3. Find available seats using preferences (if any) or fallback
    let suggestedSeat = null;

    if (targetFloor !== null && targetZone !== null) {
      // First try: exact match floor and zone
      suggestedSeat = await prisma.seat.findFirst({
        where: {
          status: SeatStatus.AVAILABLE,
          floor: targetFloor,
          zone: targetZone,
          employeeId: null,
        },
        orderBy: { seatCode: "asc" },
      });
    }

    if (!suggestedSeat && targetFloor !== null) {
      // Second try: same floor, any zone
      suggestedSeat = await prisma.seat.findFirst({
        where: {
          status: SeatStatus.AVAILABLE,
          floor: targetFloor,
          employeeId: null,
        },
        orderBy: { seatCode: "asc" },
      });
    }

    if (!suggestedSeat) {
      // Third try: any available seat in the building
      suggestedSeat = await prisma.seat.findFirst({
        where: {
          status: SeatStatus.AVAILABLE,
          employeeId: null,
        },
        orderBy: [{ floor: "asc" }, { zone: "asc" }, { seatCode: "asc" }],
      });
    }

    return suggestedSeat;
  }
}
