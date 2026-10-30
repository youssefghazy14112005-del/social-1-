import { UserModel } from '../../DB/model/user.model.js';
import type { IUserRaw } from '../interface/user.interface.js';
import { DatabaseRepository } from './base.repository.js';
import type { Types } from 'mongoose';

const publicFields = 'firstName lastName username bio image coverImage isPrivate createdAt';

export class UserRepository extends DatabaseRepository<IUserRaw> {
  constructor() { super(UserModel); }

  searchUsers(pattern: RegExp, viewerId: string, limit: number) {
    return this.model.find({
      _id: { $ne: viewerId },
      deletedAt: null,
      isFrozen: false,
      $or: [{ username: pattern }, { firstName: pattern }, { lastName: pattern }]
    }).select(publicFields).sort({ username: 1 }).limit(limit).lean();
  }

  findSuggestedUsers(viewerId: string, followingIds: Types.ObjectId[], limit: number) {
    return this.model.find({
      _id: { $nin: [viewerId, ...followingIds] },
      deletedAt: null,
      isFrozen: false
    }).select(publicFields).sort({ createdAt: -1 }).limit(limit).lean();
  }
}
export const userRepository = new UserRepository();
