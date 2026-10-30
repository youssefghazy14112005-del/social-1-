import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { EmailSubjectEnum, ProviderEnum, RoleEnum } from '../../common/enum/index.js';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '../../common/exception/domain.exception.js';
import { userRepository } from '../../common/repository/user.repository.js';
import { cacheService } from '../../common/service/cache.service.js';
import { createTokenPair, isRefreshSessionValid, revokeAccessToken, revokeRefreshSession, revokeUserSessions, verifyAccessToken, verifyRefreshToken } from '../../common/service/token.service.js';
import { encrypt } from '../../common/security/encryption.security.js';
import { hash, compare } from '../../common/security/password.security.js';
import { createOtp } from '../../common/utils/otp.js';
import { emailEvent } from '../../common/utils/email/email.event.js';
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, WEB_CLIENT_IDS } from '../../config.js';
import type { ConfirmEmailDto, ForgotPasswordDto, GoogleSigninDto, LoginDto, LogoutDto, RefreshTokenDto, ResendConfirmEmailDto, ResetPasswordDto, SignupDto } from './dto/authentication.dto.js';

const UserEmailKey = (email: string, subject: string) => `User::${email}::${subject}::OTP`;
const UserEmailTrailsKey = (email: string, subject: string) => `${UserEmailKey(email, subject)}::Trails`;
const googleClient = new OAuth2Client();

class AuthenticationService {
  async sendEmailOtp({ email, subject, expiresIn = 120, maxTrails = 3, blockInSeconds = 300 }: { email: string; subject: string; expiresIn?: number; maxTrails?: number; blockInSeconds?: number }): Promise<void> {
    const otpKey = UserEmailKey(email, subject);
    const trailsKey = UserEmailTrailsKey(email, subject);
    const ttl = await cacheService.ttl(otpKey);
    if (ttl > 0) throw new ConflictException('A code was already sent. Please wait until it expires.');
    const oldTrails = Number(await cacheService.get<string>(trailsKey) ?? 0);
    if (oldTrails >= maxTrails) throw new BadRequestException('Maximum OTP attempts reached. Try again later.');
    const code = createOtp();
    await cacheService.set({ key: otpKey, value: await hash(code), ttl: expiresIn });
    const trails = await cacheService.incrBy(trailsKey, 1);
    if (trails === maxTrails) await cacheService.expire(trailsKey, blockInSeconds);
    else if (trails === 1) await cacheService.expire(trailsKey, expiresIn);
    emailEvent.emit('sendEmail', { recipients: { to: email }, subject, data: { code } });
  }

  async signup(data: SignupDto) {
    const existing = await userRepository.findOne({ $or: [{ email: data.email }, ...(data.username ? [{ username: data.username }] : [])] });
    if (existing) throw new ConflictException(existing.email === data.email ? 'Email already exists' : 'Username already exists');
    const user = await userRepository.createOne({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      phone: data.phone ? encrypt(data.phone) : undefined,
      password: await hash(data.password),
      provider: ProviderEnum.SYSTEM,
      role: RoleEnum.USER,
      isPrivate: false
    });
    await this.sendEmailOtp({ email: data.email, subject: EmailSubjectEnum.CONFIRM_EMAIL });
    return this.publicUser(user);
  }

  async confirmEmail({ email, otp }: ConfirmEmailDto) {
    const account = await userRepository.findOne({ email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: false } });
    if (!account) throw new NotFoundException('Unverified account was not found');
    const key = UserEmailKey(email, EmailSubjectEnum.CONFIRM_EMAIL);
    const hashedOtp = await cacheService.get<string>(key);
    if (!hashedOtp || !(await compare(otp, hashedOtp))) throw new ConflictException('Invalid or expired verification code');
    account.confirmEmail = new Date();
    await account.save();
    await cacheService.del(key, UserEmailTrailsKey(email, EmailSubjectEnum.CONFIRM_EMAIL));
    return { email: account.email, confirmEmail: account.confirmEmail };
  }

  async resendConfirmEmail({ email }: ResendConfirmEmailDto) {
    const account = await userRepository.findOne({ email, provider: ProviderEnum.SYSTEM, confirmEmail: { $exists: false } });
    if (!account) throw new NotFoundException('Unverified account was not found');
    await this.sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL });
    return { email, message: 'Confirmation code sent' };
  }

  async login({ email, password }: LoginDto) {
    const user = await userRepository.findOne({ email, deletedAt: null }).select('+password');
    if (!user || !user.password || !(await compare(password, user.password))) throw new UnauthorizedException('Email or password is incorrect');
    if (user.isFrozen) throw new UnauthorizedException('This account is unavailable');
    if (!user.confirmEmail) throw new UnauthorizedException('Please confirm your email before signing in');
    const tokens = await createTokenPair({ id: user._id.toString(), role: user.role });
    return { ...tokens, user: this.publicUser(user) };
  }

  async refresh({ refreshToken }: RefreshTokenDto) {
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload.sub!;
    const tokenId = payload.jti!;
    if (!(await isRefreshSessionValid(userId, tokenId, refreshToken))) throw new UnauthorizedException('Refresh token has been revoked');
    const user = await userRepository.findById(userId);
    if (!user || user.deletedAt || user.isFrozen) throw new UnauthorizedException('Account is unavailable');
    await revokeRefreshSession(userId, tokenId);
    return createTokenPair({ id: user._id.toString(), role: user.role });
  }

  async logout({ refreshToken }: LogoutDto, accessToken?: string) {
    const payload = verifyRefreshToken(refreshToken);
    await revokeRefreshSession(payload.sub!, payload.jti!);
    if (accessToken) {
      try {
        const accessPayload = verifyAccessToken(accessToken);
        if (accessPayload.sub === payload.sub && accessPayload.jti && accessPayload.exp) {
          await revokeAccessToken(accessPayload.jti, accessPayload.exp);
        }
      } catch {
        // A valid refresh token is sufficient to revoke its session even after the access token expires.
      }
    }
    return { revoked: true };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const account = await userRepository.findOne({ email, provider: ProviderEnum.SYSTEM, deletedAt: null });
    if (account && !account.isFrozen) await this.sendEmailOtp({ email, subject: EmailSubjectEnum.RESET_PASSWORD });
    return { message: 'If the account exists, a password reset code has been sent.' };
  }

  async resetPassword({ email, otp, password }: ResetPasswordDto) {
    const account = await userRepository.findOne({ email, provider: ProviderEnum.SYSTEM, deletedAt: null });
    if (!account || account.isFrozen) throw new NotFoundException('Account was not found');
    const key = UserEmailKey(email, EmailSubjectEnum.RESET_PASSWORD);
    const hashedOtp = await cacheService.get<string>(key);
    if (!hashedOtp || !(await compare(otp, hashedOtp))) throw new ConflictException('Invalid or expired reset code');
    account.password = await hash(password);
    await account.save();
    await cacheService.del(key, UserEmailTrailsKey(email, EmailSubjectEnum.RESET_PASSWORD));
    await revokeUserSessions(account._id.toString());
    return { message: 'Password has been reset. Please sign in again.' };
  }

  async googleSignin({ idToken }: GoogleSigninDto) {
    if (!WEB_CLIENT_IDS.length) throw new BadRequestException('Configure WEB_CLIENT_IDS before using Google sign-in');
    let claims;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: WEB_CLIENT_IDS });
      claims = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google ID token is invalid or expired');
    }
    if (!claims?.sub || !claims.email || claims.email_verified !== true) throw new UnauthorizedException('Google account email must be verified');
    let user = await userRepository.findOne({ email: claims.email.toLowerCase(), deletedAt: null }).select('+googleId');
    if (!user) {
      const baseUsername = (claims.email.split('@')[0] ?? 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';
      const username = `${baseUsername}_${randomBytes(3).toString('hex')}`;
      user = await userRepository.createOne({
        firstName: claims.given_name?.trim() || 'Google',
        lastName: claims.family_name?.trim() || 'User',
        username,
        email: claims.email.toLowerCase(),
        googleId: claims.sub,
        provider: ProviderEnum.GOOGLE,
        role: RoleEnum.USER,
        confirmEmail: new Date(),
        image: claims.picture,
        isPrivate: false
      });
    } else {
      if (user.isFrozen) throw new UnauthorizedException('This account is unavailable');
      if (user.googleId && user.googleId !== claims.sub) throw new ConflictException('This email is linked to another Google account');
      user.googleId = claims.sub;
      user.provider = ProviderEnum.GOOGLE;
      user.confirmEmail ??= new Date();
      await user.save();
    }
    const tokens = await createTokenPair({ id: user._id.toString(), role: user.role });
    return { ...tokens, user: this.publicUser(user) };
  }

  private publicUser(user: { _id: { toString(): string }; firstName: string; lastName: string; username?: string; email: string; provider: string; confirmEmail?: Date | null; role: number; image?: string }) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      provider: user.provider,
      role: user.role,
      image: user.image ?? null,
      confirmEmail: user.confirmEmail ?? null
    };
  }
}

export const authenticationService = new AuthenticationService();
