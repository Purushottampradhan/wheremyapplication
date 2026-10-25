import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Prefer server/.env whether running via tsx (src/) or node (dist/). */
const envCandidates = [
  path.resolve(__dirname, '../../.env'), // server/.env from src/config or dist/config
  path.resolve(process.cwd(), '.env'), // when cwd is server/
  path.resolve(process.cwd(), 'server/.env'), // when cwd is monorepo root
];

let loadedEnvPath: string | null = null;
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    loadedEnvPath = candidate;
    break;
  }
}
dotenv.config(); // allow process env / cwd fallback overrides

if (process.env.NODE_ENV !== 'production' && loadedEnvPath) {
  console.log(`Loaded env from ${loadedEnvPath}`);
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 5080,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: required(
    'MONGODB_URI',
    'mongodb://127.0.0.1:27017/WhereMyApplication'
  ),
  jwtSecret:
    process.env.NODE_ENV === 'production'
      ? required('JWT_SECRET')
      : required('JWT_SECRET', 'dev-jwt-secret-change-me'),
  // May include a path (e.g. https://domain/wma) for links; CORS uses URL origin only.
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((v) => v.trim().replace(/\/$/, ''))
    .filter(Boolean),
  loadedEnvPath,
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
};
