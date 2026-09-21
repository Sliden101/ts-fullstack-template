import { describe, expect, it } from 'vitest';
import {
  COOKIE_CACHE_MAX_AGE,
  DEFAULT_ORIGIN,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW,
  SESSION_EXPIRES_IN,
  SESSION_FRESH_AGE,
  SESSION_UPDATE_AGE,
  buildAuthOptions,
  parseTrustedOrigins,
} from '../../src/auth-options.ts';

const fakeDatabase = {} as never;

describe('parseTrustedOrigins', () => {
  it('falls back to the default origin when undefined', () => {
    expect(parseTrustedOrigins(undefined)).toEqual([DEFAULT_ORIGIN]);
  });

  it('falls back to the default origin when blank', () => {
    expect(parseTrustedOrigins('   ')).toEqual([DEFAULT_ORIGIN]);
  });

  it('trims and filters a comma separated list', () => {
    expect(parseTrustedOrigins('http://a.test, http://b.test ,')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });
});

describe('buildAuthOptions', () => {
  it('applies safe session and rate limit defaults', () => {
    const options = buildAuthOptions({}, fakeDatabase);

    expect(options.session).toMatchObject({
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
      freshAge: SESSION_FRESH_AGE,
      cookieCache: { enabled: true, maxAge: COOKIE_CACHE_MAX_AGE },
    });
    expect(options.rateLimit).toEqual({
      enabled: true,
      window: RATE_LIMIT_WINDOW,
      max: RATE_LIMIT_MAX,
      customRules: {
        '/sign-in/email': { window: 60, max: 100 },
      },
    });
  });

  it('keeps the strict sign-in rate limit in production', () => {
    const options = buildAuthOptions({ nodeEnv: 'production' }, fakeDatabase);

    expect(options.rateLimit).toEqual({
      enabled: true,
      window: RATE_LIMIT_WINDOW,
      max: RATE_LIMIT_MAX,
    });
  });

  it('disables public sign-ups and registers admin + bearer plugins', () => {
    const options = buildAuthOptions({}, fakeDatabase);

    expect(options.emailAndPassword).toEqual({
      enabled: true,
      disableSignUp: true,
    });
    expect(options.plugins).toHaveLength(2);
  });

  it('registers the profile name fields as additional user fields', () => {
    const options = buildAuthOptions({}, fakeDatabase);

    expect(Object.keys(options.user?.additionalFields ?? {})).toEqual([
      'firstName',
      'lastName',
    ]);
  });

  it('uses the default base url and origins when env is empty', () => {
    const options = buildAuthOptions(
      { baseURL: '', trustedOrigins: '' },
      fakeDatabase,
    );

    expect(options.baseURL).toBe(DEFAULT_ORIGIN);
    expect(options.trustedOrigins).toEqual([DEFAULT_ORIGIN]);
  });

  it('honours provided env values', () => {
    const options = buildAuthOptions(
      {
        baseURL: 'https://api.example.test',
        trustedOrigins: 'https://app.example.test',
        secret: 'super-secret',
        nodeEnv: 'development',
      },
      fakeDatabase,
    );

    expect(options.baseURL).toBe('https://api.example.test');
    expect(options.trustedOrigins).toEqual(['https://app.example.test']);
    expect(options.secret).toBe('super-secret');
    expect(options.advanced).toBeUndefined();
  });

  it('hardens cookies in production', () => {
    const options = buildAuthOptions({ nodeEnv: 'production' }, fakeDatabase);

    expect(options.advanced?.defaultCookieAttributes).toEqual({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});
