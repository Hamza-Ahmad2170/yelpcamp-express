import z from 'zod';

const signUpSchema = z.object({
  email: z.email().trim().lowercase().min(1).max(255),
  password: z.string().min(8).trim().min(8).max(255),
  firstName: z.string().min(1).trim().min(1).max(255),
  lastName: z.string().min(1).trim().min(1).max(255),
});

const signInSchema = z.object({
  email: z.email().trim().lowercase().min(1).max(255),
  password: z.string().min(8).trim().min(8).max(255),
});

export { signUpSchema, signInSchema };
