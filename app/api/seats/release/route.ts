import { NextRequest, NextResponse } from "next/server";
import { releaseSeatSchema } from "@/lib/validations/seat.schema";
import { SeatService } from "@/lib/services/seat.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = releaseSeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { seatId } = parsed.data;
    const updatedSeat = await SeatService.releaseSeat(seatId);

    return NextResponse.json({ data: updatedSeat }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/seats/release error:", error);
    if (error.status === 404) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to release seat" }, { status: 500 });
  }
}
