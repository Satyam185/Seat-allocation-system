import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const analytics = await AnalyticsService.getAnalytics();
    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
