import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/services/project.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const employees = await ProjectService.getProjectEmployees(id);
    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error(`GET /api/projects/${id}/employees error:`, error);
    return NextResponse.json({ error: "Failed to fetch project employees" }, { status: 500 });
  }
}
