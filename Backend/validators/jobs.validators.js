import { z } from 'zod';

export const jobCreateSchema = z.object({
  title: z.string().min(2).max(150),
  company: z.string().min(2).max(150),
  location: z.string().min(2).max(150),
  type: z.string().min(2).max(60),
  category: z.string().max(120).optional(),
  description: z.string().min(10).max(5000),
  requirements: z.array(z.string().min(1).max(120)).min(1),
  salaryMin: z.coerce.number().nonnegative().optional().nullable(),
  salaryMax: z.coerce.number().nonnegative().optional().nullable(),
  openings: z.coerce.number().int().min(1).max(1000).optional(),
  applicationStart: z.coerce.date().optional().nullable(),
  applicationEnd: z.coerce.date().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactWebsite: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'open', 'closed']).optional(),
});

export const jobUpdateSchema = jobCreateSchema.partial();

