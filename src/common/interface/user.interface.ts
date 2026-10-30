import type { HydratedDocument } from 'mongoose';
import type { Gender, Provider, Role } from '../enum/index.js';
export interface IUserRaw {
  firstName: string; lastName: string; username?: string; email: string; password?: string;
  phone?: string; gender: Gender; role: Role; provider: Provider; confirmEmail?: Date;
  image?: string; coverImage: string[]; deletedAt?: Date | null; isFrozen: boolean; frozenAt?: Date | null;
  verificationTokenHash?: string; verificationTokenExpiresAt?: Date; googleId?: string;
  bio?: string; isPrivate: boolean;
}
export type IUserDocument = HydratedDocument<IUserRaw>;
