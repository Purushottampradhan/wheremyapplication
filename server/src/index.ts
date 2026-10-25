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

function toOrigin(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/$/, '');
  }
}

function corsOrigins(): string[] {
  const isProd = env.nodeEnv === 'production';
  const listed = [
    env.clientUrl,
    ...env.corsOrigins,
    ...(isProd ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
  ]
    .map(toOrigin)
    .filter(Boolean);
  return [...new Set(listed)];
}

function extensionIds(): Set<string> {
  return new Set(
    (process.env.CHROME_EXTENSION_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith('chrome-extension://')) {
        const id = origin.slice('chrome-extension://'.length).split('/')[0];
        const allowedIds = extensionIds();
        // Dev, or public unpacked installs: CHROME_EXTENSION_IDS=* (IDs differ per machine)
        if (
          env.nodeEnv !== 'production' ||
          process.env.CHROME_EXTENSION_ALLOW_ALL === 'true' ||
          allowedIds.has('*')
        ) {
          return callback(null, true);
        }
        if (allowedIds.size === 0) {
          console.warn(
            'CHROME_EXTENSION_IDS unset — denying chrome-extension origins in production'
          );
          return callback(null, false);
        }
        return callback(null, allowedIds.has(id));
      }
      const allowed = corsOrigins();
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      if (
        process.env.CORS_ALLOW_RENDER === 'true' &&
        origin.endsWith('.onrender.com')
      ) {
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
