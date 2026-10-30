import app from './app.js';
import { PORT } from './config.js';
import { bootstrapDB } from './DB/connection.db.js';
import { cacheService } from './common/service/cache.service.js';
async function bootstrap(): Promise<void> {
  await bootstrapDB();
  await cacheService.connect();
  const server = app.listen(PORT, () => console.log(`Social Media App API listening on port ${PORT}`));
  const shutdown = async (signal: string) => { console.log(`${signal} received, shutting down`); server.close(async () => { await cacheService.quit(); process.exit(0); }); };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
bootstrap().catch((error: unknown) => { console.error('Application startup failed:', error); process.exitCode = 1; });
