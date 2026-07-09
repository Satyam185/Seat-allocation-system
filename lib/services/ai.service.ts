import { prisma } from "@/lib/db";
import { AiIntent, aiIntentSchema } from "@/lib/validations/ai.schema";

export class AiService {
  static async processQuery(query: string): Promise<{ answer: string, data?: any, filter?: any }> {
    const intent = await this.extractIntent(query);
    return this.executeIntent(intent);
  }

  static async extractIntent(query: string): Promise<AiIntent> {
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `Extract the intent and entities from the following user query about a seat allocation system.
The intent MUST be one of: find_my_seat, employee_lookup, available_seats, team_location, seat_utilization, allocate_new_joiner, unknown.
Return ONLY a valid JSON object matching this schema:
{
  "intent": "string",
  "entities": {
    "email": "string (optional, extract if an email is mentioned)",
    "employeeName": "string (optional)",
    "projectName": "string (optional, e.g., 'Talos')",
    "floor": "number (optional)",
    "zone": "string (optional, e.g., 'A', 'B')"
  }
}

User query: "${query}"` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.candidates[0].content.parts[0].text;
          const parsedJson = JSON.parse(textResponse);
          const validated = aiIntentSchema.safeParse(parsedJson);
          if (validated.success) {
            return validated.data;
          }
        }
      } catch (error) {
        console.error("Gemini Extraction failed, falling back", error);
      }
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `Extract the intent and entities from the following user query about a seat allocation system.
The intent MUST be one of: find_my_seat, employee_lookup, available_seats, team_location, seat_utilization, allocate_new_joiner, unknown.
Return ONLY a valid JSON object matching this schema:
{
  "intent": "string",
  "entities": {
    "email": "string (optional, extract if an email is mentioned)",
    "employeeName": "string (optional)",
    "projectName": "string (optional, e.g., 'Talos')",
    "floor": "number (optional)",
    "zone": "string (optional, e.g., 'A', 'B')"
  }
}`
              },
              { role: "user", content: query }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.choices[0].message.content;
          const parsedJson = JSON.parse(textResponse);
          const validated = aiIntentSchema.safeParse(parsedJson);
          if (validated.success) {
            return validated.data;
          }
        }
      } catch (error) {
        console.error("Groq extraction failed", error);
      }
    }

    return this.fallbackExtractIntent(query);
  }

  static fallbackExtractIntent(query: string): AiIntent {
    const lowerQuery = query.toLowerCase();
    const result: AiIntent = { intent: "unknown", entities: {} };

    // Email extraction
    const emailMatch = query.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      result.entities = result.entities || {};
      result.entities.email = emailMatch[1];
    }

    // Floor extraction
    const floorMatch = lowerQuery.match(/floor\s*(\d+)/);
    if (floorMatch) {
      result.entities = result.entities || {};
      result.entities.floor = parseInt(floorMatch[1], 10);
    }

    // Project extraction
    const projectMatch = query.match(/project\s+([a-zA-Z]+)/i);
    if (projectMatch) {
      result.entities = result.entities || {};
      result.entities.projectName = projectMatch[1];
    }

    // Intent resolution
    if (lowerQuery.includes("where is my seat") || (lowerQuery.includes("my seat") && result.entities?.email)) {
      result.intent = "find_my_seat";
    } else if (lowerQuery.includes("project am i assigned to") || lowerQuery.includes("my project")) {
      result.intent = "employee_lookup";
    } else if (lowerQuery.includes("available seats")) {
      result.intent = "available_seats";
    } else if (lowerQuery.includes("seats are occupied for project") || lowerQuery.includes("seat utilization")) {
      result.intent = "seat_utilization";
    } else if (lowerQuery.includes("allocate") && lowerQuery.includes("joiner")) {
      result.intent = "allocate_new_joiner";
    } else if (lowerQuery.includes("where is team") || lowerQuery.includes("team location")) {
      result.intent = "team_location";
    } else if (query.trim().split(/\s+/).length <= 2 && !query.includes("@")) {
      // If it's 1-2 words and not an email, assume it's a name search
      result.intent = "employee_lookup";
      result.entities = result.entities || {};
      result.entities.employeeName = query.trim();
    }

    return result;
  }

  static async executeIntent(intentData: AiIntent): Promise<{ answer: string, data?: any, filter?: any }> {
    const { intent, entities } = intentData;

    switch (intent) {
      case "find_my_seat":
        if (!entities?.email) return { answer: "I need your email address to find your seat." };
        
        const empForSeat = await prisma.employee.findUnique({
          where: { email: entities.email },
          include: { seat: true, project: true },
        });

        if (!empForSeat) return { answer: `I couldn't find an employee with the email ${entities.email}.` };
        if (!empForSeat.seat) return { answer: `You don't have a seat assigned yet.`, data: [empForSeat] };

        return { 
          answer: `You are allocated Floor ${empForSeat.seat.floor}, Zone ${empForSeat.seat.zone}, Bay ${empForSeat.seat.bay}, Seat ${empForSeat.seat.seatCode}. Your project is ${empForSeat.project?.name || 'Unassigned'}.`,
          data: [empForSeat] 
        };

      case "employee_lookup":
        if (!entities?.email && !entities?.employeeName) return { answer: "I need an email address or name to find the employee." };
        
        let empsForProj: any[] = [];
        if (entities?.email) {
          const emp = await prisma.employee.findUnique({
            where: { email: entities.email },
            include: { project: true, seat: true },
          });
          if (emp) empsForProj = [emp];
        } else if (entities?.employeeName) {
          empsForProj = await prisma.employee.findMany({
            where: { name: { contains: entities.employeeName, mode: "insensitive" } },
            include: { project: true, seat: true },
            take: 50, // Limit results just in case
          });
        }

        if (empsForProj.length === 0) return { answer: `I couldn't find an employee matching ${entities?.email || entities?.employeeName}.` };
        
        if (empsForProj.length === 1) {
          const emp = empsForProj[0];
          const projName = emp.project ? emp.project.name : "no project";
          const seatLoc = emp.seat ? `Floor ${emp.seat.floor}, Zone ${emp.seat.zone}, Seat ${emp.seat.seatCode}` : "no assigned seat";
          return {
            answer: `${emp.name} is assigned to ${projName} and is located at ${seatLoc}.`,
            data: empsForProj
          };
        } else {
          return {
            answer: `Found ${empsForProj.length} employees matching "${entities?.employeeName}".`,
            data: empsForProj
          };
        }

      case "available_seats":
        const whereClause = {
          status: "AVAILABLE",
          ...(entities?.floor && { floor: entities.floor }),
          ...(entities?.zone && { zone: entities.zone }),
        };

        const availableSeats = await prisma.seat.findMany({ where: whereClause as any, take: 50 });
        const availableCount = await prisma.seat.count({ where: whereClause as any });
        
        let locString = "";
        if (entities?.floor) locString += ` on Floor ${entities.floor}`;
        if (entities?.zone) locString += ` in Zone ${entities.zone}`;

        return { 
          answer: `There are ${availableCount} available seats${locString}.`,
          data: availableSeats.map((seat: any) => ({ ...seat, employee: null })),
          filter: { entity: "seat", filters: whereClause }
        };

      case "seat_utilization":
        if (!entities?.projectName) return { answer: "Please specify a project name to check utilization." };

        const project = await prisma.project.findFirst({
          where: { name: entities.projectName }
        });

        if (!project) {
          const projFuzzy = await prisma.project.findFirst({
            where: { name: { equals: entities.projectName, mode: "insensitive" } }
          });
          if (!projFuzzy) return { answer: `I couldn't find a project named ${entities.projectName}.` };
          
          const occupiedCount = await prisma.seatAllocation.count({
            where: { projectId: projFuzzy.id, allocationStatus: "ACTIVE" }
          });
          return { answer: `There are ${occupiedCount} seats occupied for Project ${projFuzzy.name}.` };
        }

        const occupiedCountExact = await prisma.seatAllocation.count({
          where: { projectId: project.id, allocationStatus: "ACTIVE" }
        });
        return { answer: `There are ${occupiedCountExact} seats occupied for Project ${project.name}.` };

      case "allocate_new_joiner":
        return { answer: "Please use the 'New Joiner' and 'Assign Seat' buttons in the interface to allocate a seat." };

      case "team_location":
        return { answer: "Team location feature is currently available visually via the Dashboard." };

      default:
        return { answer: "I'm sorry, I couldn't understand your request. Could you rephrase it?" };
    }
  }
}
