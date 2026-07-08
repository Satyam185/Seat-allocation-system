import { NextRequest, NextResponse } from "next/server";
import { createEmployeeSchema } from "@/lib/validations/employee.schema";
import { EmployeeService } from "@/lib/services/employee.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  
  const department = searchParams.get("department") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const floor = searchParams.get("floor") ?? undefined;
  const zone = searchParams.get("zone") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;
  const projectCode = searchParams.get("projectCode") ?? undefined;
  const unassigned = searchParams.get("unassigned") === "true" ? true : undefined;

  try {
    const { employees, total } = await EmployeeService.getEmployees({
      page,
      limit,
      department,
      status,
      floor,
      zone,
      projectId,
      projectCode,
      unassigned,
    });

    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const employee = await EmployeeService.createEmployee(parsed.data);

    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Employee code or email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}