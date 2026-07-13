import { startServer } from './app';

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
