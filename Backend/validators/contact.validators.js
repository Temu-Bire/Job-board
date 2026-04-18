import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Invalid email format"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150, "Subject cannot exceed 150 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message cannot exceed 2000 characters"),
});
