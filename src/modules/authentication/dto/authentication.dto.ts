export interface SignupDto { firstName: string; lastName: string; username?: string; email: string; password: string; confirmPassword: string; phone?: string; }
export interface ConfirmEmailDto { email: string; otp: string; }
export interface ResendConfirmEmailDto { email: string; }
export interface LoginDto { email: string; password: string; }
export interface RefreshTokenDto { refreshToken: string; }
export interface LogoutDto { refreshToken: string; }
export interface ForgotPasswordDto { email: string; }
export interface ResetPasswordDto { email: string; otp: string; password: string; confirmPassword: string; }
export interface GoogleSigninDto { idToken: string; }
