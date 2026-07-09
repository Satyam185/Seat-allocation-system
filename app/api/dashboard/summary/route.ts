import { NextRequest, NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(req: NextRequest) {
  try {
    const summary = await DashboardService.getDashboardSummary();
    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 });
  }
}
