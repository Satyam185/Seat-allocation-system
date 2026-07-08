import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeSchema } from "@/lib/validations/employee.schema";
import { EmployeeService } from "@/lib/services/employee.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const employee = await EmployeeService.getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await EmployeeService.updateEmployee(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("PATCH /api/employees/[id] error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const deleted = await EmployeeService.deleteEmployee(id);
    return NextResponse.json({ data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
