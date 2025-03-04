import { hash } from 'bcryptjs';
import {z} from 'zod';

export const signupSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    hashedPassword: z.string().min(6).optional(),
    });