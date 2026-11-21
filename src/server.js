import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Pickleball Paddle API running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
});
