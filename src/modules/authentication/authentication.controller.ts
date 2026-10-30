import { Router } from 'express';
import { responseFormatter } from '../../middleware/response.middleware.js';
import { validation } from '../../middleware/validation.middleware.js';
import { authenticationService } from './authentication.service.js';
import {
  confirmEmailSchema,
  forgotPasswordSchema,
  googleSigninSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  resendConfirmEmailSchema,
  resetPasswordSchema,
  signupSchema
} from './authentication.validation.js';
import type { ConfirmEmailDto, ForgotPasswordDto, GoogleSigninDto, LoginDto, LogoutDto, RefreshTokenDto, ResendConfirmEmailDto, ResetPasswordDto, SignupDto } from './dto/authentication.dto.js';

const router = Router();

router.post('/signup', validation(signupSchema), responseFormatter((req) => authenticationService.signup(req.body as SignupDto), 201));
router.patch('/confirm-email', validation(confirmEmailSchema), responseFormatter((req) => authenticationService.confirmEmail(req.body as ConfirmEmailDto)));
router.patch('/resend-confirm-email', validation(resendConfirmEmailSchema), responseFormatter((req) => authenticationService.resendConfirmEmail(req.body as ResendConfirmEmailDto)));
router.post('/login', validation(loginSchema), responseFormatter((req) => authenticationService.login(req.body as LoginDto)));
router.post('/refresh-token', validation(refreshTokenSchema), responseFormatter((req) => authenticationService.refresh(req.body as RefreshTokenDto)));
router.post('/logout', validation(logoutSchema), responseFormatter((req) => authenticationService.logout(req.body as LogoutDto, req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : undefined)));
router.post('/forgot-password', validation(forgotPasswordSchema), responseFormatter((req) => authenticationService.forgotPassword(req.body as ForgotPasswordDto)));
router.patch('/reset-password', validation(resetPasswordSchema), responseFormatter((req) => authenticationService.resetPassword(req.body as ResetPasswordDto)));
router.post('/google-signin', validation(googleSigninSchema), responseFormatter((req) => authenticationService.googleSignin(req.body as GoogleSigninDto)));

export default router;
