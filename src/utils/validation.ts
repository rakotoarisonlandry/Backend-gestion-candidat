import { z } from "zod";

export const candidateSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.email("Invalid email"),
});