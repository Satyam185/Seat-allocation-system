import { NextRequest, NextResponse } from "next/server";
import { aiQueryRequestSchema } from "@/lib/validations/ai.schema";
import { AiService } from "@/lib/services/ai.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = aiQueryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query } = parsed.data;
    const result = await AiService.parseAndQuery(query);

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI query" },
      { status: 500 }
    );
  }
}
