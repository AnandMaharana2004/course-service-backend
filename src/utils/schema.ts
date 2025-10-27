// authSchemas.ts
import { z } from 'zod';

// ========================================
// REUSABLE SCHEMAS
// ========================================

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number');

const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, dots, underscores, and hyphens',
  )
  .trim();

const resetTokenSchema = z
  .string()
  .min(1, 'Token is required')
  .regex(
    /^[a-f0-9]{64}$/,
    'Invalid token format. Must be a 64-character hex string.',
  );

// ========================================
// AUTH SCHEMAS
// ========================================

export const loginSchema = z
  .object({
    email: z.string().email('Invalid email').trim().toLowerCase().optional(),
    username: usernameSchema.optional(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  })
  .refine((data) => data.email || data.username, {
    message: 'Either email or username is required',
    path: ['email'],
  });

export const signupSchema = z
  .object({
    name: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    otp: z.number().int().positive('Invalid OTP'),
    // Optional fields
    gender: z.enum(['male', 'female', 'other']).optional(),
    bio: z
      .string()
      .max(160, 'Bio cannot exceed 160 characters')
      .trim()
      .optional(),
    profilePictureUrl: z
      .string()
      .url('Profile picture must be a valid URL')
      .optional(),
    age: z
      .number()
      .int()
      .min(13, 'You must be at least 13 years old')
      .max(120, 'Invalid age')
      .optional(),
    acceptTerms: z.literal(true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .strict(); // Reject unknown fields

export const generateOtpSchema = z.object({
  email: emailSchema,
});

// ========================================
// PASSWORD RESET SCHEMAS
// ========================================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  ip: z.string().optional(),
});

export const verifyResetTokenSchema = z.object({
  token: resetTokenSchema,
});

export const resetPasswordSchema = z
  .object({
    token: resetTokenSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ========================================
// TYPESCRIPT TYPES
// ========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type GenerateOtpInput = z.infer<typeof generateOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
