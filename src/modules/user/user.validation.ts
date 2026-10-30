import { z } from 'zod';
import { genderValues } from '../../common/enum/index.js';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().trim().max(500).optional(),
  image: z.string().trim().max(2048).optional(),
  coverImage: z.array(z.string().trim().max(2048)).max(10).optional(),
  gender: z.coerce.number().refine((value) => genderValues.includes(value as never), 'Invalid gender').optional()
}).refine((data) => Object.keys(data).length > 0, 'Provide at least one profile field to update');

export const updatePrivacySchema = z.object({ isPrivate: z.boolean() });
export const userSearchSchema = z.object({
  q: z.string().trim().min(2).max(50),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export const userListSchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });
export const userIdSchema = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id') });
