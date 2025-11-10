import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ToomanyRequestError } from '../utils/Error';

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitRecord;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const rateLimitStore: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
  },
  5 * 60 * 1000,
);

const getIpKey = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const getEmailKey = (req: Request): string => {
  const email = req.body.email || 'no-email';
  return email.toLowerCase();
};

const getEmailIpKey = (req: Request): string => {
  const email = req.body.email || 'no-email';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${email.toLowerCase()}-${ip}`;
};

const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyGenerator = getIpKey,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();

      let record = rateLimitStore[key];

      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + windowMs,
          firstRequestTime: now,
        };
        rateLimitStore[key] = record;
      }

      record.count++;

      const remaining = Math.max(0, max - record.count);
      const resetTime = Math.ceil((record.resetTime - now) / 1000); // in seconds

      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(record.resetTime).toISOString(),
      );

      if (record.count > max) {
        res.setHeader('Retry-After', resetTime.toString());
        throw new ToomanyRequestError(message);
      }

      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data: any) {
          const statusCode = res.statusCode;

          if (
            (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            if (record.count > 0) {
              record.count--;
            }
          }

          return originalSend.call(this, data);
        };
      }

      next();
    },
  );
};

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: getEmailIpKey,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 2. REGISTER - Moderate rate limiting (3 per hour per IP)
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many registration attempts. Please try again after an hour.',
  keyGenerator: getIpKey,
});

// 3. GENERATE OTP - By email (3 per hour)
export const generateOtpRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many OTP requests. Please try again after an hour.',
  keyGenerator: getEmailKey,
});

// 4. GENERATE OTP - By IP (10 per hour)
export const generateOtpIpRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many OTP requests from this IP. Please try again later.',
  keyGenerator: getIpKey,
});

// 5. FORGOT PASSWORD - By email (3 per hour)
export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again after an hour.',
  keyGenerator: getEmailKey,
});

// 6. FORGOT PASSWORD - By IP (10 per hour)
export const forgotPasswordIpRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message:
    'Too many password reset requests from this IP. Please try again later.',
  keyGenerator: getIpKey,
});

// 7. RESET PASSWORD - By IP (5 per 15 min)
export const resetPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    'Too many password reset attempts. Please try again after 15 minutes.',
  keyGenerator: getIpKey,
});

// 8. VERIFY RESET TOKEN - By IP (10 per 15 min)
export const verifyResetTokenRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many token verification attempts. Please try again later.',
  keyGenerator: getIpKey,
});

// 9. GLOBAL API RATE LIMITER - By IP (100 per 15 min)
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  keyGenerator: getIpKey,
});

// Get current rate limit status for a key
export const getRateLimitStatus = (req: Request, keyGenerator = getIpKey) => {
  const key = keyGenerator(req);
  const record = rateLimitStore[key];

  if (!record) {
    return { limited: false, remaining: Infinity };
  }

  const now = Date.now();
  if (now > record.resetTime) {
    return { limited: false, remaining: Infinity };
  }

  return {
    limited: true,
    count: record.count,
    resetTime: record.resetTime,
    remaining: Math.max(0, record.resetTime - now),
  };
};

// Clear rate limit for a specific key (useful for testing)
export const clearRateLimit = (req: Request, keyGenerator = getIpKey) => {
  const key = keyGenerator(req);
  delete rateLimitStore[key];
};

// Clear all rate limits (useful for testing)
export const clearAllRateLimits = () => {
  Object.keys(rateLimitStore).forEach((key) => {
    delete rateLimitStore[key];
  });
};
