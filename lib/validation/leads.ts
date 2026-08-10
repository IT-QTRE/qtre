import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "closed"]).default("new"),
  assignedAgentId: z.string().optional(),
});
