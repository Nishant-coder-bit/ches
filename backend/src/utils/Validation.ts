
import {z} from 'zod';

export const signupSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    hashedPassword: z.string(),
    });