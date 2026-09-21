import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins/admin';
import { bearer } from 'better-auth/plugins/bearer';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { ADMIN_ROLE, DEFAULT_ROLE, ac, roles } from './auth/rbac.ts';

export type AuthOptions = Parameters<typeof betterAuth>[0];
type DrizzleDatabase = Parameters<typeof drizzleAdapter>[0];

export const SESSION_EXPIRES_IN = 60 * 60 * 24 * 7;
export const SESSION_UPDATE_AGE = 60 * 60 * 24;
export const SESSION_FRESH_AGE = 60 * 10;
export const COOKIE_CACHE_MAX_AGE = 60 * 5;
export const RATE_LIMIT_WINDOW = 60;
export const RATE_LIMIT_MAX = 100;
export const DEFAULT_ORIGIN = 'http://localhost:3001';

export interface AuthEnv {
  readonly appName?: string;
  readonly baseURL?: string;
  readonly trustedOrigins?: string;
  readonly secret?: string;
  readonly nodeEnv?: string;
}

export function parseTrustedOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? origins : [DEFAULT_ORIGIN];
}

export function buildAuthOptions(env: AuthEnv, database: DrizzleDatabase) {
  const isProduction = env.nodeEnv === 'production';

  return {
    appName: env.appName || 'Fullstack Template',
    baseURL: env.baseURL || DEFAULT_ORIGIN,
    secret: env.secret,
    trustedOrigins: parseTrustedOrigins(env.trustedOrigins),
    database: drizzleAdapter(database, { provider: 'pg' }),
    plugins: [
      admin({
        ac,
        roles,
        defaultRole: DEFAULT_ROLE,
        adminRoles: [ADMIN_ROLE],
      }),
      bearer(),
    ],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        firstName: { type: 'string', required: false },
        lastName: { type: 'string', required: false },
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
      freshAge: SESSION_FRESH_AGE,
      cookieCache: {
        enabled: true,
        maxAge: COOKIE_CACHE_MAX_AGE,
      },
    },
    rateLimit: {
      enabled: true,
      window: RATE_LIMIT_WINDOW,
      max: RATE_LIMIT_MAX,
      ...(isProduction
        ? {}
        : {
            customRules: {
              '/sign-in/email': { window: 60, max: 100 },
            },
          }),
    },
    ...(isProduction
      ? {
          advanced: {
            defaultCookieAttributes: {
              secure: true,
              httpOnly: true,
              sameSite: 'lax' as const,
            },
          },
        }
      : {}),
  } satisfies AuthOptions;
}
