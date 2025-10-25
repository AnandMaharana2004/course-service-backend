// authSchemas.ts
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const loginSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email')
      .optional()
      .or(z.literal('').optional()),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .optional(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !!(data.email && data.email.trim() !== '') ||
      !!(data.username && data.username.trim() !== ''),
    {
      message: 'Either email or username is required',
      path: ['email'], // general place to attach the error
    },
  );

/**
 * SIGNUP:
 * Typical fields: username, email, password, confirmPassword, optional profile data.
 */
export const signupSchema = z.object({
  name: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Username can contain letters, numbers, ., _, -',
    ),
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  // optional extras
  gender: z.enum(['male', 'female', 'other']).optional(),
  bio: z
    .string()
    .max(160, "Bio can't be longer than 160 characters")
    .optional(),
  profilePictureUrl: z
    .string()
    .url('Profile picture must be a valid URL')
    .optional(),
  // age example (optional, with range)
  age: z.number().int().min(13, 'Must be 13 or older').max(120).optional(),
  acceptTerms: z
    .boolean()
    .refine(Boolean, { message: 'You must accept the terms' }),
  otp: z.number(),
});
export const generateOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});

/** Inferred TS types */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
