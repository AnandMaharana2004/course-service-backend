import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import {
  forgotPasswordSchema,
  generateOtpSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyResetTokenSchema,
} from '../utils/schema';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/Error';
import { sendSuccess } from '../utils/Response';
import { generateHashPassword, verifyPassword } from '../utils/password';
import { sendEmail } from '../services/email';
import { asyncHandler } from '../utils/asyncHandler';
import crypto from 'node:crypto';

const prisma = new PrismaClient();
//otp generation function
function createOtpNumber(digits: number): number {
  if (digits <= 0) {
    throw new Error('Digits must be greater than 0');
  }

  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const LoginUser = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new BadRequestError('Invalid credentails type');
  }
  const { email, password } = req.body;
  const existUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (!existUser || !existUser.password) {
    throw new NotFoundError('Invalid uername or password!!');
  }
  const isMatch = await verifyPassword(password, existUser?.password);
  if (!isMatch) throw new NotFoundError('Invalid uername or password!!');

  // TODO: sesstion logic implement here
  // TODO: set cookies

  return sendSuccess(
    res,
    {
      email: existUser.name,
      name: existUser.name,
    },
    'User login successfully',
  );
});

export const RegisterUser = asyncHandler(
  async (req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      console.log(result.error);
      throw new BadRequestError('Invalid credential types');
    }

    const { email, name, otp, password } = result.data;

    const existUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new ConflictError('Email already exists');
    }

    const existOtp = await prisma.otp.findFirst({
      where: { email, otp },
    });

    if (!existOtp) {
      throw new NotFoundError('Invalid OTP');
    }

    const now = new Date();
    if (existOtp.expiresAt < now) {
      await prisma.otp.delete({ where: { email } });
      throw new BadRequestError('OTP expired, please request a new one');
    }

    const hashedPassword = await generateHashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        updateAt: new Date(Date.now()),
      },
    });

    await prisma.otp.delete({ where: { email } });

    return sendSuccess(
      res,
      { email: newUser.email, name: newUser.name },
      'User registered successfully 🎉',
    );
  },
);

export const GenerateOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = generateOtpSchema.safeParse(req.body);
  if (!result) throw new BadRequestError('Invalid credentails type');
  const { email } = req.body;
  if (!email) throw new BadRequestError('Email is required');

  const code = createOtpNumber(6);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

  const otpRecord = await prisma.otp.upsert({
    where: { email },
    update: {
      otp: code,
      expiresAt,
      purpose: 'User registration',
    },
    create: {
      email,
      otp: code,
      purpose: 'User registration',
      expiresAt,
    },
  });

  const emailResult = await sendEmail({
    sendTo: email,
    type: 'otp',
    otp: otpRecord.otp,
  });

  if (!emailResult.status)
    throw new Error('Something went wrong while sending OTP');

  return sendSuccess(res, null, 'OTP email sent successfully', 250);
});

export const ForgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse({
      email,
      ip,
    });

    if (!validationResult.success) {
      throw new BadRequestError('Invalid credentials type');
    }

    // Find user by email
    const existUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    // Always return success message (prevent email enumeration)
    if (!existUser || !existUser?.id) {
      return sendSuccess(
        res,
        null,
        'If your email is registered, you will receive a reset link',
      );
    }

    // Generate secure random token (unhashed for email)
    const tokenBuffer = crypto.randomBytes(32);
    const token = tokenBuffer.toString('hex'); // This goes in the email

    // Hash the token for database storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Set expiration time (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Upsert: Update existing or create new token record (more efficient)
    await prisma.forgotPasswordToken.upsert({
      where: {
        user_id: existUser.id,
      },
      update: {
        token_hash: tokenHash,
        expiresAt,
        used: false,
        ip_address: ip,
      },
      create: {
        user_id: existUser.id,
        token_hash: tokenHash,
        expiresAt,
        used: false,
        ip_address: ip,
      },
    });

    // Generate reset URL with unhashed token
    const baseUrl =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Send email with reset link
    await sendEmail({
      sendTo: email,
      type: 'setNewPasswordLink',
      url: resetUrl,
    });

    // Always return the same success message
    return sendSuccess(
      res,
      null,
      'If your email is registered, you will receive a reset link',
    );
  },
);

export const VerifyResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate query params
    const validationResult = verifyResetTokenSchema.safeParse(req.query);

    if (!validationResult.success) {
      throw new BadRequestError('Invalid credentials type');
    }

    const { token } = validationResult.data;

    if (!token) throw new BadRequestError('Token is required');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const existTokenRecord = await prisma.forgotPasswordToken.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });

    if (!existTokenRecord)
      throw new BadRequestError('Invalid or expired reset token');

    if (existTokenRecord.used) {
      await prisma.forgotPasswordToken.delete({
        where: {
          token_hash: tokenHash,
        },
      });
      throw new BadRequestError('This reset link has already been used');
    }

    const currentTime = new Date();
    if (currentTime > existTokenRecord.expiresAt) {
      await prisma.forgotPasswordToken.delete({
        where: {
          token_hash: tokenHash,
        },
      });
      throw new BadRequestError(
        'Reset token has expired. Please request a new one',
      );
    }

    return sendSuccess(res, { valid: true }, 'Token is valid');
  },
);

export const ResetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new BadRequestError('Invalid credentials types');
    }

    const { token, newPassword, confirmPassword } = validationResult.data;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    // Hash the token to compare with database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find token record
    const existToken = await prisma.forgotPasswordToken.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });

    // Check if token exists
    if (!existToken) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Check if token is already used
    if (existToken.used) {
      throw new BadRequestError('This reset link has already been used');
    }

    // Check if token is expired
    const currentTime = new Date();
    if (currentTime > existToken.expiresAt) {
      // Delete expired token
      await prisma.forgotPasswordToken.delete({
        where: {
          token_hash: tokenHash,
        },
      });
      throw new BadRequestError(
        'Reset token has expired. Please request a new one',
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id: existToken?.user_id,
      },
    });
    // Check if user exists
    if (!user) {
      await prisma.forgotPasswordToken.delete({
        where: {
          token_hash: tokenHash,
        },
      });
      throw new BadRequestError('User not found');
    }

    // Hash the new password
    const hashedPassword = await generateHashPassword(newPassword);

    // Update user password and delete token in a transaction
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: existToken.user_id },
        data: {
          password: hashedPassword,
          updateAt: new Date(),
        },
      }),
      // Delete the reset token
      prisma.forgotPasswordToken.delete({
        where: {
          token_hash: tokenHash,
        },
      }),
    ]);

    // Send confirmation email
    await sendEmail({
      sendTo: user.email,
      type: 'passwordReset',
    });

    // TODO: Invalidate all active sessions for this user (force re-login)

    return sendSuccess(res, null, 'Password reset successfully');
  },
);

// not found api
export const NotFoundAuthRoute = asyncHandler(async (req: Request) => {
  throw new NotFoundError(`auth${req.url} not found!!`);
});
