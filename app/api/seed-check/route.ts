import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const [employees, projects, seats, allocations] = await Promise.all([
      prisma.employee.count(),
      prisma.project.count(),
      prisma.seat.count(),
      prisma.seatAllocation.count(),
    ]);

    return NextResponse.json({
      data: {
        employees,
        projects,
        seats,
        allocations,
      },
    });
  } catch (error: any) {
    console.error("GET /api/seed-check error:", error);
    return NextResponse.json(
      { error: error.message || "Database connection error" },
      { status: 500 }
    );
  }
}
