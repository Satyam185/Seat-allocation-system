import { z } from "zod";

// The shape the LLM must return when parsing a natural language query
// into a structured filter. Keep this narrow — only fields your DB
// queries actually support.
export const aiFilterSchema = z.object({
  entity: z.enum(["employee", "seat", "project"]),
  filters: z.object({
    department: z.string().optional(),
    status: z.string().optional(),
    floor: z.number().optional(),
    zone: z.string().optional(),
    projectId: z.string().optional(),
    projectCode: z.string().optional(),
    unassigned: z.boolean().optional(),
  }),
  rawQuery: z.string(),
});

export const aiQueryRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

export type AiFilter = z.infer<typeof aiFilterSchema>;
export type AiQueryRequest = z.infer<typeof aiQueryRequestSchema>;