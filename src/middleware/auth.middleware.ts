import type { RequestHandler } from 'express';
import { UnauthorizedException } from '../common/exception/domain.exception.js';
import { userRepository } from '../common/repository/user.repository.js';
import { isAccessTokenRevoked, verifyAccessToken } from '../common/service/token.service.js';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer access token is required');
    const token = authorization.slice(7).trim();
    const payload = verifyAccessToken(token);
    if (!payload.exp || !payload.sub || !payload.jti || typeof payload.role !== 'number') {
      throw new UnauthorizedException('Invalid access token');
    }
    if (await isAccessTokenRevoked(payload.jti)) throw new UnauthorizedException('Access token has been revoked');
    const user = await userRepository.findById(payload.sub);
    if (!user || user.deletedAt || user.isFrozen) throw new UnauthorizedException('Account is unavailable');
    req.auth = { userId: payload.sub, role: payload.role, accessTokenId: payload.jti, expiresAt: payload.exp };
    next();
  } catch (error) {
    next(error);
  }
};
