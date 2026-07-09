import { NextRequest, NextResponse } from "next/server";
import { changeSeatStatusSchema } from "@/lib/validations/seat.schema";
import { SeatService } from "@/lib/services/seat.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = changeSeatStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const updatedSeat = await SeatService.changeSeatStatus(id, status);

    return NextResponse.json({ data: updatedSeat }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/seats/${id}/status error:`, error);
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to change seat status" }, { status: 500 });
  }
}
