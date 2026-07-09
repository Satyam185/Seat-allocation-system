import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SeatService } from "@/lib/services/seat.service";

const suggestSeatSchema = z.object({
  employeeId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = suggestSeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId } = parsed.data;
    const result = await SeatService.suggestSeatForEmployee(employeeId);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/seats/suggest error:", error);
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to suggest and allocate seat" }, { status: 500 });
  }
}
