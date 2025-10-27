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

export const authRouter = Router();

authRouter.route('/sign-in').post(LoginUser);
authRouter.route('/sign-up').post(RegisterUser);
authRouter.route('/generate-otp').post(GenerateOtp);
authRouter.route('/forgot-password').post(ForgotPassword);
authRouter.route('/verify-forgot-token').get(VerifyResetToken);
authRouter.route('/reset-password').post(ResetPassword);

//Not found Page
authRouter.use(NotFoundAuthRoute);
