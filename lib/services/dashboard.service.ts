import { prisma } from "@/lib/db";
import { SeatStatus } from "@prisma/client";

export class DashboardService {
  static async getDashboardSummary() {
    const [
      totalEmployees,
      totalSeats,
      occupiedSeats,
      availableSeats,
      reservedSeats,
      maintenanceSeats,
      pendingAllocation,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.seat.count(),
      prisma.seat.count({ where: { status: SeatStatus.OCCUPIED } }),
      prisma.seat.count({ where: { status: SeatStatus.AVAILABLE } }),
      prisma.seat.count({ where: { status: SeatStatus.RESERVED } }),
      prisma.seat.count({ where: { status: SeatStatus.MAINTENANCE } }),
      prisma.employee.count({ where: { seat: null } }),
    ]);

    return {
      totalEmployees,
      totalSeats,
      occupiedSeats,
      availableSeats,
      reservedSeats,
      maintenanceSeats,
      pendingAllocation,
    };
  }

  static async getProjectUtilization() {
    // We want per-project employee and seat counts.
    // Employees with this project, and how many of them have seats.
    const projects = await prisma.project.findMany({
      include: {
        employees: {
          include: {
            seat: true,
          },
        },
      },
    });

    const utilization = projects.map((project) => {
      const employeeCount = project.employees.length;
      const seatCount = project.employees.filter((emp) => emp.seat !== null).length;
      return {
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        employeeCount,
        seatCount,
      };
    });

    return utilization;
  }

  static async getFloorUtilization() {
    // Get distinct floors
    const floorsResult = await prisma.seat.findMany({
      select: { floor: true },
      distinct: ["floor"],
      orderBy: { floor: "asc" },
    });

    const floors = floorsResult.map((f) => f.floor);

    const utilization = await Promise.all(
      floors.map(async (floor) => {
        const [total, occupied, available, reserved, maintenance] = await Promise.all([
          prisma.seat.count({ where: { floor } }),
          prisma.seat.count({ where: { floor, status: SeatStatus.OCCUPIED } }),
          prisma.seat.count({ where: { floor, status: SeatStatus.AVAILABLE } }),
          prisma.seat.count({ where: { floor, status: SeatStatus.RESERVED } }),
          prisma.seat.count({ where: { floor, status: SeatStatus.MAINTENANCE } }),
        ]);

        return {
          floor,
          total,
          occupied,
          available,
          reserved,
          maintenance,
        };
      })
    );

    return utilization;
  }
}
