import Express from 'express';

const app = Express();
let port = 4000;



app.listen(port, () => {
  console.log(`Application listen on port : ${port}`);
});
