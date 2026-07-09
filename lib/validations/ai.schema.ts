import { z } from "zod";

export const aiQueryRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

export const aiIntentEnum = z.enum([
  "find_my_seat",
  "employee_lookup",
  "available_seats",
  "team_location",
  "seat_utilization",
  "allocate_new_joiner",
  "unknown",
]);

export const aiIntentSchema = z.object({
  intent: aiIntentEnum,
  entities: z.object({
    email: z.string().email().optional(),
    employeeName: z.string().optional(),
    projectName: z.string().optional(),
    floor: z.number().int().optional(),
    zone: z.string().optional(),
  }).optional(),
});

export type AiQueryRequest = z.infer<typeof aiQueryRequestSchema>;
export type AiIntent = z.infer<typeof aiIntentSchema>;
export type AiIntentType = z.infer<typeof aiIntentEnum>;