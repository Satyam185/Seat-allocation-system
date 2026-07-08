import { NextRequest, NextResponse } from "next/server";
import { SeatService } from "@/lib/services/seat.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const seat = await SeatService.getSeatById(id);
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }
    return NextResponse.json({ data: seat });
  } catch (error) {
    console.error("GET /api/seats/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { action, employeeId } = body;

    if (action === "release") {
      const updated = await SeatService.releaseSeat(id);
      return NextResponse.json({ data: updated });
    }

    if (action === "assign") {
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required for assignment" }, { status: 400 });
      }
      const updated = await SeatService.assignSeat(employeeId, id);
      return NextResponse.json({ data: updated });
    }

    if (action === "suggest") {
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required to suggest a seat" }, { status: 400 });
      }
      const suggested = await SeatService.allocateNewJoiner(employeeId);
      if (!suggested) {
        return NextResponse.json({ error: "No available seats found" }, { status: 404 });
      }
      return NextResponse.json({ data: suggested });
    }

    return NextResponse.json({ error: "Invalid action. Supported actions: release, assign, suggest" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/seats/[id] error:", error);
    if (error.status === 409) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to modify seat assignment" },
      { status: 500 }
    );
  }
}
