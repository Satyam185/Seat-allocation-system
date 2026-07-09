import { NextRequest, NextResponse } from "next/server";
import { createSeatSchema } from "@/lib/validations/seat.schema";
import { SeatService } from "@/lib/services/seat.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const status = searchParams.get("status") ?? undefined;
  const floor = searchParams.get("floor") ? parseInt(searchParams.get("floor")!, 10) : undefined;
  const zone = searchParams.get("zone") ?? undefined;

  try {
    const { seats, total } = await SeatService.getSeats({
      page,
      limit,
      status,
      floor,
      zone,
    });

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
    console.error("GET /api/seats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch seats" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const newSeat = await SeatService.createSeat(parsed.data);

    return NextResponse.json({ data: newSeat }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/seats error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Seat code or composite key already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create seat" },
      { status: 500 }
    );
  }
}