import { Router } from 'express';
import {
  GenerateOtp,
  LoginUser,
  RegisterUser,
  ForgotPassword,
  VerifyResetToken,
  ResetPassword,
} from '../controller/auth.controller';
import { NotFoundAuthRoute } from '../controller/auth.controller';
import {
  forgotPasswordIpRateLimiter,
  forgotPasswordRateLimiter,
  generateOtpIpRateLimiter,
  generateOtpRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
  verifyResetTokenRateLimiter,
} from '../middleware/Ratelimitor';

export const authRouter = Router();

authRouter.route('/sign-in').post(loginRateLimiter, LoginUser);
authRouter
  .route('/sign-up')
  .post(registerRateLimiter, RegisterUser, RegisterUser);
authRouter
  .route('/generate-otp')
  .post(generateOtpIpRateLimiter, generateOtpRateLimiter, GenerateOtp);
authRouter
  .route('/forgot-password')
  .post(forgotPasswordIpRateLimiter, forgotPasswordRateLimiter, ForgotPassword);
authRouter
  .route('/verify-forgot-token')
  .get(verifyResetTokenRateLimiter, VerifyResetToken);
authRouter
  .route('/reset-password')
  .post(resetPasswordRateLimiter, ResetPassword);

//Not found Page
authRouter.use(NotFoundAuthRoute);
