import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function describeMongoError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes('could not connect') ||
    (lower.includes('ip') && lower.includes('whitelist')) ||
    lower.includes('not authorized on') ||
    message.includes('AtlasError') ||
    (err as { code?: number })?.code === 8000
  ) {
    return (
      'MongoDB Atlas rejected the connection. In Atlas → Network Access, ' +
      'allow your current IP (or 0.0.0.0/0 for local dev), then retry.'
    );
  }

  if (
    lower.includes('authentication failed') ||
    lower.includes('bad auth') ||
    (err as { code?: number })?.code === 18
  ) {
    return (
      'MongoDB authentication failed. Check MONGODB_URI username/password in server/.env ' +
      '(URL-encode special characters in the password).'
    );
  }

  if (
    lower.includes('querysrv') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('server selection timed out')
  ) {
    return (
      'Cannot reach MongoDB (DNS/network). Check internet access and that the Atlas cluster is running. ' +
      'If using mongodb+srv, ensure DNS can resolve _mongodb._tcp.<cluster>.'
    );
  }

  return message;
}

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 12_000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    const friendly = describeMongoError(err);
    console.error('MongoDB connection failed:', friendly);
    throw new Error(friendly);
  }
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
