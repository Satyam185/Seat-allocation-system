import { NextRequest, NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(req: NextRequest) {
  try {
    const utilization = await DashboardService.getFloorUtilization();
    return NextResponse.json({ data: utilization });
  } catch (error) {
    console.error("GET /api/dashboard/floor-utilization error:", error);
    return NextResponse.json({ error: "Failed to fetch floor utilization" }, { status: 500 });
  }
}
