import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;