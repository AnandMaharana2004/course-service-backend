import Express from 'express';

const app = Express();
const port = 4000;

app.get('/health', (_, res) => {
  try {
    return res.status(200).json({
      message: 'Server health is good',
      statusCode: 200,
      data: null,
    });
  } catch (error: unknown) {
    console.error('Something went wrong while check Health check');
  }
});

app.listen(port, () => {
  console.log(`Application listen on port : ${port}`);
});
