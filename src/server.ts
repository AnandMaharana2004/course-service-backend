import Express, { Request } from 'express';
import { errorHandler } from './middleware/ErrorHandler';

import { sendSuccess } from './utils/Response';
import { NotFoundError } from './utils/Error';

import { authRouter } from './routes/auth.route';
import { asyncHandler } from './utils/asyncHandler';
import { globalRateLimiter } from './middleware/Ratelimitor';

const app = Express();

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.set('trust proxy', 1);
app.use(globalRateLimiter);
app.get('/health', (_, res, next) => {
  try {
    return sendSuccess(res, null, 'Server Health is GOOD 👍');
  } catch (error) {
    console.error('Something went wrong while check Health check', error);
    next(error);
  }
});

// Routes
app.use('/auth', authRouter);

// Not found error
app.use(
  asyncHandler((req: Request) => {
    throw new NotFoundError(`${req.url} not found!!`);
  }),
);

// Error handler middleware
app.use(errorHandler);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Application listen on port : ${port}`);
});
