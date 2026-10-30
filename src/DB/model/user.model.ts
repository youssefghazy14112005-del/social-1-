import { model, Schema } from 'mongoose';
import type { IUserRaw } from '../../common/interface/user.interface.js';
import { GenderEnum, ProviderEnum, RoleEnum, genderValues } from '../../common/enum/index.js';

const userSchema = new Schema<IUserRaw>({
  firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  username: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function (this: IUserRaw) { return this.provider === ProviderEnum.SYSTEM; }, select: false },
  phone: { type: String, select: false },
  gender: { type: Number, enum: genderValues, default: GenderEnum.OTHER },
  role: { type: Number, enum: Object.values(RoleEnum), default: RoleEnum.USER },
  provider: { type: String, enum: Object.values(ProviderEnum), default: ProviderEnum.SYSTEM },
  confirmEmail: { type: Date }, image: { type: String }, coverImage: { type: [String], default: [] },
  googleId: { type: String, unique: true, sparse: true, select: false },
  bio: { type: String, trim: true, maxlength: 500 },
  isPrivate: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }, isFrozen: { type: Boolean, default: false }, frozenAt: { type: Date, default: null },
  verificationTokenHash: { type: String, select: false }, verificationTokenExpiresAt: { type: Date, select: false }
}, { timestamps: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ firstName: 'text', lastName: 'text', username: 'text' });
export const UserModel = model<IUserRaw>('User', userSchema);
