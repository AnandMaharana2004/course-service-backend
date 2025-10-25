import crypto from 'node:crypto';

const PasswordSecret =
  process.env.PASSWORD_SECRET || 'fallback_secret_for_development_only';
export const generateHashPassword = (password: string): string => {
  if (
    !PasswordSecret ||
    PasswordSecret === 'fallback_secret_for_development_only'
  ) {
    throw new Error('Please set PASSWORD_SECRET in .env for production use.');
  }

  const hmac = crypto.createHmac('SHA256', PasswordSecret);

  hmac.update(password);

  const hash = hmac.digest('hex');

  return hash;
};

export const verifyPassword = (
  inputPassword: string,
  storedHash: string,
): boolean => {
  if (
    !PasswordSecret ||
    PasswordSecret === 'fallback_secret_for_development_only'
  ) {
    throw new Error('Cannot verify password. Please set PASSWORD_SECRET.');
  }

  const inputHash = generateHashPassword(inputPassword);

  const result = crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(storedHash, 'hex'),
  );

  return result;
};
