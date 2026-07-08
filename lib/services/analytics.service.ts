import { prisma } from "@/lib/db";
import { SeatStatus, EmployeeStatus } from "@prisma/client";

export class AnalyticsService {
  static async getAnalytics() {
    // 1. Total counts of seats by status
    const seatCounts = await prisma.seat.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    let totalSeats = 0;
    let occupiedSeats = 0;
    let availableSeats = 0;
    let reservedSeats = 0;

    seatCounts.forEach((group) => {
      const count = group._count._all;
      totalSeats += count;
      if (group.status === SeatStatus.OCCUPIED) {
        occupiedSeats = count;
      } else if (group.status === SeatStatus.AVAILABLE) {
        availableSeats = count;
      } else if (group.status === SeatStatus.RESERVED) {
        reservedSeats = count;
      }
    });

    const utilizationPct = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;

    // 2. Count of active employees
    const totalEmployees = await prisma.employee.count({
      where: { status: EmployeeStatus.ACTIVE },
    });

    // Seated employees count
    const seatedEmployees = await prisma.employee.count({
      where: {
        status: EmployeeStatus.ACTIVE,
        seat: { isNot: null },
      },
    });

    const unseatedEmployees = totalEmployees - seatedEmployees;

    // 3. Seat utilization broken down by floor
    const seatsFloorRaw = await prisma.seat.groupBy({
      by: ["floor", "status"],
      _count: {
        _all: true,
      },
    });

    // Organize floor raw data
    const floorMap: Record<
      number,
      { occupied: number; available: number; reserved: number; total: number }
    > = {};

    seatsFloorRaw.forEach((row) => {
      const f = row.floor;
      if (!floorMap[f]) {
        floorMap[f] = { occupied: 0, available: 0, reserved: 0, total: 0 };
      }
      const count = row._count._all;
      floorMap[f].total += count;
      if (row.status === SeatStatus.OCCUPIED) {
        floorMap[f].occupied = count;
      } else if (row.status === SeatStatus.AVAILABLE) {
        floorMap[f].available = count;
      } else if (row.status === SeatStatus.RESERVED) {
        floorMap[f].reserved = count;
      }
    });

    const byFloor = Object.entries(floorMap).map(([floorStr, data]) => ({
      floor: parseInt(floorStr, 10),
      ...data,
    })).sort((a, b) => a.floor - b.floor);

    // 4. Seat utilization broken down by department
    // Find total active employees by department
    const deptAllRaw = await prisma.employee.groupBy({
      by: ["department"],
      where: { status: EmployeeStatus.ACTIVE },
      _count: {
        _all: true,
      },
    });

    // Find seated active employees by department
    const deptSeatedRaw = await prisma.employee.groupBy({
      by: ["department"],
      where: {
        status: EmployeeStatus.ACTIVE,
        seat: { isNot: null },
      },
      _count: {
        _all: true,
      },
    });

    const deptMap: Record<string, { employees: number; seated: number }> = {};

    deptAllRaw.forEach((row) => {
      if (row.department) {
        deptMap[row.department] = {
          employees: row._count._all,
          seated: 0,
        };
      }
    });

    deptSeatedRaw.forEach((row) => {
      if (row.department && deptMap[row.department]) {
        deptMap[row.department].seated = row._count._all;
      }
    });

    const byDepartment = Object.entries(deptMap).map(([department, data]) => ({
      department,
      ...data,
    })).sort((a, b) => b.employees - a.employees);

    return {
      summary: {
        totalSeats,
        occupiedSeats,
        availableSeats,
        reservedSeats,
        utilizationPct,
        totalEmployees,
        seatedEmployees,
        unseatedEmployees,
      },
      byFloor,
      byDepartment,
    };
  }
}
