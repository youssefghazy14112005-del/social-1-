import { createHash, randomUUID } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_USER_TOKEN_SIGNATURE
} from '../../config.js';
import { UnauthorizedException } from '../exception/domain.exception.js';
import { cacheService } from './cache.service.js';

type TokenUser = { id: string; role: number };
type VerifiedToken = JwtPayload & { tokenType?: string; sub?: string; jti?: string; role?: number };
type SessionRecord = { refreshTokenHash: string; accessTokenId: string; accessExpiresAt: number };

const sessionKey = (userId: string, tokenId: string) => `Session::${userId}::${tokenId}`;
const revokedAccessKey = (tokenId: string) => `RevokedAccess::${tokenId}`;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createTokenPair(user: TokenUser) {
  const accessTokenId = randomUUID();
  const refreshTokenId = randomUUID();
  const accessToken = jwt.sign(
    { tokenType: 'access', role: user.role },
    ACCESS_USER_TOKEN_SIGNATURE,
    { subject: user.id, jwtid: accessTokenId, expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { tokenType: 'refresh', role: user.role },
    REFRESH_USER_TOKEN_SIGNATURE,
    { subject: user.id, jwtid: refreshTokenId, expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
  const now = Math.floor(Date.now() / 1000);
  await cacheService.set({
    key: sessionKey(user.id, refreshTokenId),
    value: {
      refreshTokenHash: hashToken(refreshToken),
      accessTokenId,
      accessExpiresAt: now + ACCESS_TOKEN_EXPIRES_IN
    },
    ttl: REFRESH_TOKEN_EXPIRES_IN
  });
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: ACCESS_TOKEN_EXPIRES_IN };
}

export function verifyRefreshToken(token: string): VerifiedToken {
  try {
    const payload = jwt.verify(token, REFRESH_USER_TOKEN_SIGNATURE) as VerifiedToken;
    if (payload.tokenType !== 'refresh' || !payload.sub || !payload.jti) throw new Error('Invalid refresh token');
    return payload;
  } catch {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }
}

export function verifyAccessToken(token: string): VerifiedToken {
  try {
    const payload = jwt.verify(token, ACCESS_USER_TOKEN_SIGNATURE) as VerifiedToken;
    if (payload.tokenType !== 'access' || !payload.sub || !payload.jti || typeof payload.role !== 'number') {
      throw new Error('Invalid access token');
    }
    return payload;
  } catch {
    throw new UnauthorizedException('Invalid or expired access token');
  }
}

export async function isRefreshSessionValid(userId: string, tokenId: string, token: string): Promise<boolean> {
  const session = await cacheService.get<SessionRecord>(sessionKey(userId, tokenId));
  return Boolean(session && session.refreshTokenHash === hashToken(token));
}

export async function revokeRefreshSession(userId: string, tokenId: string): Promise<void> {
  await cacheService.del(sessionKey(userId, tokenId));
}

export async function revokeAccessToken(tokenId: string, expiresAt: number): Promise<void> {
  const ttl = Math.max(1, expiresAt - Math.floor(Date.now() / 1000));
  await cacheService.set({ key: revokedAccessKey(tokenId), value: '1', ttl });
}

export async function isAccessTokenRevoked(tokenId: string): Promise<boolean> {
  return (await cacheService.exists(revokedAccessKey(tokenId))) === 1;
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const keys = await cacheService.keys(`Session::${userId}::*`);
  for (const key of keys) {
    const session = await cacheService.get<SessionRecord>(key);
    if (session) await revokeAccessToken(session.accessTokenId, session.accessExpiresAt);
  }
  if (keys.length) await cacheService.del(...keys);
}
