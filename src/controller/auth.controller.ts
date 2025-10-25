import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { generateOtpSchema, loginSchema, signupSchema } from '../utils/schema';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/Error';
import { sendSuccess } from '../utils/Response';
import { generateHashPassword, verifyPassword } from '../utils/password';
import { sendEmail } from '../services/email';
import { asyncHandler } from '../utils/asyncHandler';

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
    //implement forgotPassword logic
    // send set new password url link on mail
  },
);
// not found api
export const NotFoundAuthRoute = asyncHandler(async (req: Request) => {
  throw new NotFoundError(`auth${req.url} not found!!`);
});
