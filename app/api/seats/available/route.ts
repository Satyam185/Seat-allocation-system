import { NextRequest, NextResponse } from "next/server";
import { SeatService } from "@/lib/services/seat.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  try {
    const { seats, total } = await SeatService.getAvailableSeats({ page, limit });

    return NextResponse.json({
      data: seats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/seats/available error:", error);
    return NextResponse.json({ error: "Failed to fetch available seats" }, { status: 500 });
  }
}
