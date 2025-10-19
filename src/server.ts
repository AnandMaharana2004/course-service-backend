import Express from 'express';
import { asyncHandler, errorHandler } from './middleware/ErrorHandler';

import { sendSuccess } from './utils/Response';
import { NotFoundError } from './utils/Error';

const app = Express();
const port = process.env.PORT;

app.get('/health', (_, res, next) => {
  try {
    return sendSuccess(res, null, 'Server Health is GOOD 👍');
  } catch (error) {
    console.error('Something went wrong while check Health check', error);
    next(error);
  }
});

// Not found error
app.use(
  asyncHandler((req: Request) => {
    throw new NotFoundError(`${req.url} not found!!`);
  }),
);

app.use(errorHandler);
app.listen(port, () => {
  console.log(`Application listen on port : ${port}`);
});
