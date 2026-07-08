import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validations/project.schema";
import { ProjectService } from "@/lib/services/project.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const name = searchParams.get("name") ?? undefined;
  const code = searchParams.get("code") ?? undefined;

  try {
    const { projects, total } = await ProjectService.getProjects({
      page,
      limit,
      name,
      code,
    });

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = await ProjectService.createProject(parsed.data);

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Project code already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
