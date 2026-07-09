import { NextRequest, NextResponse } from "next/server";
import { assignSeatSchema } from "@/lib/validations/seat.schema";
import { SeatService } from "@/lib/services/seat.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = assignSeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { seatId, employeeId } = parsed.data;
    const updatedSeat = await SeatService.allocateSeat(employeeId, seatId);

    return NextResponse.json({ data: updatedSeat }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/seats/allocate error:", error);
    if (error.status === 404 || error.status === 409) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to allocate seat" }, { status: 500 });
  }
}
