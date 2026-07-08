import { z } from "zod";

export const assignSeatSchema = z.object({
  seatId: z.string().cuid(),
  employeeId: z.string().cuid(),
});

export const releaseSeatSchema = z.object({
  seatId: z.string().cuid(),
});

export type AssignSeatInput = z.infer<typeof assignSeatSchema>;
export type ReleaseSeatInput = z.infer<typeof releaseSeatSchema>;