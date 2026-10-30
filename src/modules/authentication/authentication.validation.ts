import { z } from 'zod';
const email = z.string().trim().email().toLowerCase();
export const signupSchema = z.object({
  firstName: z.string().trim().min(2).max(50), lastName: z.string().trim().min(2).max(50),
  username: z.string().trim().min(3).max(30).optional(), email,
  password: z.string().min(8).max(128), confirmPassword: z.string().min(8).max(128),
  phone: z.string().trim().min(7).max(20).optional()
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export const confirmEmailSchema = z.object({ email, otp: z.string().regex(/^\d{6}$/, 'OTP must contain 6 digits') });
export const resendConfirmEmailSchema = z.object({ email });
export const loginSchema = z.object({ email, password: z.string().min(8).max(128) });
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(20) });
export const logoutSchema = refreshTokenSchema;
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, 'OTP must contain 6 digits'),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export const googleSigninSchema = z.object({ idToken: z.string().min(20) });
