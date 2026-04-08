import { z } from 'zod';

export const applySchema = z.object({
  coverLetter: z.string().min(10).max(8000),
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
});

