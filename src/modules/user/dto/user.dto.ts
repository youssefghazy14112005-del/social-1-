import type { Gender } from '../../../common/enum/index.js';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  image?: string;
  coverImage?: string[];
  gender?: Gender;
}

export interface UpdatePrivacyDto { isPrivate: boolean; }
export interface UserSearchDto { q: string; limit: number; }
export interface UserListDto { limit: number; }
