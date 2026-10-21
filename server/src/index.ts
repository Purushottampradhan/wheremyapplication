import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb, isDbReady } from './config/db.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import profileRoutes from './routes/profile.js';
import dashboardRoutes from './routes/dashboard.js';
import inboxRoutes from './routes/inbox.js';

const app = express();
app.set('trust proxy', 1);

function corsOrigins(): string[] {
  const listed = [
    env.clientUrl,
    ...env.corsOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean);
  return [...new Set(listed)];
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith('chrome-extension://')) return callback(null, true);
      const allowed = corsOrigins();
      if (allowed.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const dbReady = isDbReady();
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    name: 'wheremyapplication',
    db: dbReady ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inbox', inboxRoutes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

async function main() {
  await connectDb();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`WhereMyApplication API on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
