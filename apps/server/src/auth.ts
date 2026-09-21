import { betterAuth } from 'better-auth';
import { db } from './database.ts';
import { buildAuthOptions } from './auth-options.ts';

export const auth = betterAuth(
  buildAuthOptions(
    {
      appName: process.env.APP_NAME,
      baseURL: process.env.BETTER_AUTH_URL,
      trustedOrigins: process.env.TRUSTED_ORIGINS,
      secret: process.env.BETTER_AUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
    db,
  ),
);

export type AppAuth = typeof auth;
