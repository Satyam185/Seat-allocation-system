import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeSchema } from "@/lib/validations/employee.schema";
import { EmployeeService } from "@/lib/services/employee.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const employee = await EmployeeService.getEmployeeById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error(`GET /api/employees/${id} error:`, error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if exists
    const existing = await EmployeeService.getEmployeeById(id);
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const employee = await EmployeeService.updateEmployee(id, parsed.data);
    return NextResponse.json({ data: employee });
  } catch (error: any) {
    console.error(`PUT /api/employees/${id} error:`, error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Employee code or email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const existing = await EmployeeService.getEmployeeById(id);
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const employee = await EmployeeService.deleteEmployee(id);
    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error(`DELETE /api/employees/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
