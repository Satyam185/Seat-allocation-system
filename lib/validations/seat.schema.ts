import { z } from "zod";

export const createSeatSchema = z.object({
  seatCode: z.string().min(1),
  floor: z.number().int().min(1),
  zone: z.string().min(1),
  bay: z.string().min(1),
  seatNumber: z.string().min(1),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]).optional(),
});

export const assignSeatSchema = z.object({
  seatId: z.string().cuid(),
  employeeId: z.string().cuid(),
});

export const releaseSeatSchema = z.object({
  seatId: z.string().cuid(),
});

export const changeSeatStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "RESERVED", "MAINTENANCE"]),
});

export type CreateSeatInput = z.infer<typeof createSeatSchema>;
export type AssignSeatInput = z.infer<typeof assignSeatSchema>;
export type ReleaseSeatInput = z.infer<typeof releaseSeatSchema>;
export type ChangeSeatStatusInput = z.infer<typeof changeSeatStatusSchema>;