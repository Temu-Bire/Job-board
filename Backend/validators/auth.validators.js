import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['jobseeker', 'recruiter', 'admin']).optional(),

  // Optional profile fields (role-dependent in UI)
  university: z.string().max(120).optional(),
  degree: z.string().max(120).optional(),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional(),

  company: z.string().max(120).optional(),
  companyDescription: z.string().max(1000).optional(),
  website: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(128),
});

export const googleAuthSchema = z.object({
  token: z.string(),
  role: z.enum(['jobseeker', 'recruiter']).optional(),
});

