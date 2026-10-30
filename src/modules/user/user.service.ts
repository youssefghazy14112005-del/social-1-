import { Types } from 'mongoose';
import { ConflictException, NotFoundException } from '../../common/exception/domain.exception.js';
import type { IUserRaw } from '../../common/interface/user.interface.js';
import { followRepository } from '../../common/repository/follow.repository.js';
import { userRepository } from '../../common/repository/user.repository.js';
import type { UpdatePrivacyDto, UpdateProfileDto, UserListDto, UserSearchDto } from './dto/user.dto.js';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class UserService {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const [followersCount, followingCount] = await Promise.all([
      followRepository.countFollowers(user._id),
      followRepository.countFollowing(user._id)
    ]);
    return { ...this.toPublicProfile(user), email: user.email, gender: user.gender, followersCount, followingCount };
  }

  async getProfile(userId: string, viewerId: string) {
    const user = await userRepository.findById(userId);
    if (!user || user.deletedAt || user.isFrozen) throw new NotFoundException('User not found');
    const isOwner = user._id.toString() === viewerId;
    const isFollowing = !isOwner && Boolean(await followRepository.exists(viewerId, user._id));
    const [followersCount, followingCount] = await Promise.all([
      followRepository.countFollowers(user._id),
      followRepository.countFollowing(user._id)
    ]);
    if (user.isPrivate && !isOwner && !isFollowing) {
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        image: user.image ?? null,
        isPrivate: true,
        isFollowing: false,
        followersCount,
        followingCount
      };
    }
    return { ...this.toPublicProfile(user), isFollowing: isOwner ? undefined : isFollowing, followersCount, followingCount };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (data.username && data.username !== user.username) {
      const existing = await userRepository.findOne({ username: data.username, _id: { $ne: user._id } });
      if (existing) throw new ConflictException('Username already exists');
    }
    Object.assign(user, data);
    await user.save();
    return this.getMe(userId);
  }

  async updatePrivacy(userId: string, data: UpdatePrivacyDto) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isPrivate = data.isPrivate;
    await user.save();
    return { isPrivate: user.isPrivate };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new ConflictException('You cannot follow yourself');
    const [follower, target] = await Promise.all([userRepository.findById(userId), userRepository.findById(targetId)]);
    if (!follower || follower.deletedAt || follower.isFrozen) throw new NotFoundException('User not found');
    if (!target || target.deletedAt || target.isFrozen) throw new NotFoundException('User not found');
    await followRepository.add(follower._id, target._id);
    return { following: true, userId: target._id.toString() };
  }

  async unfollow(userId: string, targetId: string) {
    if (userId === targetId) throw new ConflictException('You cannot unfollow yourself');
    const target = await userRepository.findById(targetId);
    if (!target || target.deletedAt || target.isFrozen) throw new NotFoundException('User not found');
    await followRepository.remove(userId, target._id);
    return { following: false, userId: target._id.toString() };
  }

  async search({ q, limit }: UserSearchDto, viewerId: string) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    const users = await userRepository.searchUsers(pattern, viewerId, limit);
    return users.map((user) => this.toPublicSummary(user));
  }

  async suggestions({ limit }: UserListDto, viewerId: string) {
    const followingIds = await followRepository.followingIds(new Types.ObjectId(viewerId));
    const users = await userRepository.findSuggestedUsers(viewerId, followingIds, limit);
    return users.map((user) => this.toPublicSummary(user));
  }

  private toPublicProfile(user: IUserRaw & { _id: Types.ObjectId; createdAt?: Date }) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      bio: user.bio ?? '',
      image: user.image ?? null,
      coverImage: user.coverImage ?? [],
      isPrivate: user.isPrivate,
      createdAt: user.createdAt
    };
  }

  private toPublicSummary(user: Record<string, unknown> & { _id: Types.ObjectId; firstName: string; lastName: string; username?: string; image?: string; isPrivate?: boolean }) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      image: user.image ?? null,
      isPrivate: user.isPrivate ?? false
    };
  }
}

export const userService = new UserService();
