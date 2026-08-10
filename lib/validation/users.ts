import { z } from "zod";
import { ROLES } from "../../convex/lib/roles";

export const userSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(ROLES),
});
