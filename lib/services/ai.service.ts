import { aiFilterSchema } from "@/lib/validations/ai.schema";
import { EmployeeService } from "./employee.service";
import { SeatService } from "./seat.service";
import { ProjectService } from "./project.service";

export class AiService {
  static async parseAndQuery(query: string) {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      throw new Error("Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in the environment.");
    }

    const systemPrompt = `
You are an expert search parsing assistant for a Seat Allocation & Project Mapping System.
Analyze the user's natural language search query and convert it into a structured filter JSON object.

The output JSON must strictly follow this TypeScript interface:
interface AiFilter {
  entity: "employee" | "seat" | "project";
  filters: {
    department?: string; // One of: "Engineering", "Design", "Product", "Marketing", "Sales", "HR", "Finance", "Operations", "Legal", "Data Science"
    status?: string;     // If entity=employee: "ACTIVE" | "INACTIVE". If entity=seat: "AVAILABLE" | "OCCUPIED" | "RESERVED"
    floor?: number;      // Integer floor number
    zone?: string;       // Zone letter (A, B, C, D, E, F)
    projectId?: string;
    projectCode?: string; // Project code format like PRJ-XXXX
    unassigned?: boolean; // True if searching for unseated employees
  };
  rawQuery: string;
}

Rules for parsing:
1. Determine the primary entity:
   - "employee", "people", "staff", "who is", "who sits" -> "employee"
   - "seat", "desk", "available desk", "occupied" -> "seat"
   - "project", "team" -> "project"
2. Infer floor (e.g. "floor 3" -> 3) and zone (e.g. "zone A" or "A zone" -> "A").
3. Infer department matching one of the department names listed above.
4. If looking for unseated/unassigned employees, set entity = "employee" and filters.unassigned = true.
5. If looking for empty or available seats, set entity = "seat" and filters.status = "AVAILABLE".
6. If the query asks about a specific project code (e.g. "PRJ-0045"), set projectCode = "PRJ-0045".
7. Always set rawQuery to the exact user query.

You must return ONLY a valid JSON block. Do not include markdown formatting or extra text.
`;

    let responseText = "";

    if (groqKey) {
      // Call Groq API
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Groq API returned error status ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      responseText = data.choices[0].message.content;
    } else if (geminiKey) {
      // Call Gemini API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `Query: ${query}` },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Gemini API returned error status ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      responseText = data.candidates[0].content.parts[0].text;
    }

    // Clean up responseText (strip ```json ... ``` wrapper if the model outputted it anyway)
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsedFilter;
    try {
      parsedFilter = JSON.parse(cleanJson);
    } catch (e: any) {
      throw new Error(`Failed to parse AI response as JSON: ${cleanJson}. Error: ${e.message}`);
    }

    // Validate using Zod schema
    const validation = aiFilterSchema.safeParse(parsedFilter);
    if (!validation.success) {
      throw new Error(`AI generated filter failed validation: ${JSON.stringify(validation.error.flatten())}`);
    }

    const filterObj = validation.data;

    // Convert filter object to Prisma query results
    let dbResults: any[] = [];
    let count = 0;

    if (filterObj.entity === "employee") {
      const { employees, total } = await EmployeeService.getEmployees({
        page: 1,
        limit: 50,
        department: filterObj.filters.department,
        status: filterObj.filters.status,
        floor: filterObj.filters.floor?.toString(),
        zone: filterObj.filters.zone,
        projectId: filterObj.filters.projectId,
        projectCode: filterObj.filters.projectCode,
        unassigned: filterObj.filters.unassigned,
      });
      dbResults = employees;
      count = total;
    } else if (filterObj.entity === "seat") {
      const { seats, total } = await SeatService.getSeats({
        page: 1,
        limit: 50,
        status: filterObj.filters.status,
        floor: filterObj.filters.floor,
        zone: filterObj.filters.zone,
      });
      dbResults = seats;
      count = total;
    } else if (filterObj.entity === "project") {
      const { employees, total } = await EmployeeService.getEmployees({
        page: 1,
        limit: 50,
        projectCode: filterObj.filters.projectCode,
      });
      dbResults = employees;
      count = total;
    }

    return {
      filter: filterObj,
      data: dbResults,
      total: count,
    };
  }
}
