import { z } from 'zod';

const phone = z
  .string()
  .regex(/^\+[1-9]\d{9,14}$/, 'Phone must be E.164, e.g. +919876543210');

export const otpRequestSchema = z.object({ phone });

export const otpVerifySchema = z.object({
  phone,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type OtpRequestDto = z.infer<typeof otpRequestSchema>;
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;
