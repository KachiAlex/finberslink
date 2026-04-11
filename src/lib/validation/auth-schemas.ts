import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});
