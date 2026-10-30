import { Types } from 'mongoose';
import { FollowModel, type IFollowRaw } from '../../DB/model/follow.model.js';
import { DatabaseRepository } from './base.repository.js';

export class FollowRepository extends DatabaseRepository<IFollowRaw> {
  constructor() { super(FollowModel); }

  exists(followerId: string, followingId: Types.ObjectId) {
    return this.model.exists({ follower: followerId, following: followingId });
  }

  async add(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<void> {
    try {
      await this.model.create({ follower: followerId, following: followingId });
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error;
    }
  }

  remove(followerId: string, followingId: Types.ObjectId) {
    return this.model.deleteOne({ follower: followerId, following: followingId });
  }

  countFollowers(userId: Types.ObjectId) { return this.model.countDocuments({ following: userId }); }
  countFollowing(userId: Types.ObjectId) { return this.model.countDocuments({ follower: userId }); }
  followingIds(userId: Types.ObjectId) { return this.model.find({ follower: userId }).distinct('following'); }
}

export const followRepository = new FollowRepository();
