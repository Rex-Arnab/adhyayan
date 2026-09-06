import { z } from "zod";

import { PASSWORD_RULES } from "@/lib/password";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  // Built from PASSWORD_RULES so the form, the meter and the API cannot diverge.
  password: PASSWORD_RULES.reduce(
    (schema, rule) => schema.refine(rule.test, { message: rule.label }),
    z.string().max(200, "Password is too long") as z.ZodType<string>,
  ),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
