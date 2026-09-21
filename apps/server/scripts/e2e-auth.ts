import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.ts';

const GQL_PATH = '/graphql';
const AUTH_PATH = '/api/auth';
const ORIGIN = 'http://localhost:3000';

interface GqlResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function gql<T>(
  base: string,
  query: string,
  cookie?: string,
): Promise<{ status: number; body: GqlResult<T> }> {
  const res = await fetch(`${base}${GQL_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ query }),
  });
  return { status: res.status, body: (await res.json()) as GqlResult<T> };
}

async function main(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bodyParser: false, logger: false },
  );
  await app.listen({ port: 0, host: '127.0.0.1' });

  const address = app.getHttpAdapter().getInstance().server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  assert(email && password, 'ADMIN_EMAIL and ADMIN_PASSWORD are required');

  try {
    const health = await gql<{ health: string }>(base, '{ health }');
    assert(health.body.data?.health === 'ok', 'health query should return ok');

    const badLogin = await fetch(`${base}${AUTH_PATH}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    assert(badLogin.status === 401, 'wrong password should return 401');

    const login = await fetch(`${base}${AUTH_PATH}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email, password }),
    });
    assert(login.status === 200, 'valid credentials should return 200');
    const cookie = (login.headers.getSetCookie?.() ?? [])
      .map((value) => value.split(';')[0])
      .join('; ');
    assert(cookie.length > 0, 'sign-in should set a session cookie');

    const me = await gql<{ me: { email: string; role: string } | null }>(
      base,
      '{ me { email role } }',
      cookie,
    );
    assert(me.body.data?.me?.email === email, 'me should return the signed-in user');
    assert(me.body.data?.me?.role === 'admin', 'seeded user should be an admin');

    const sessions = await gql<{ mySessions: Array<{ id: string; isCurrent: boolean }> }>(
      base,
      '{ mySessions { id isCurrent } }',
      cookie,
    );
    assert(
      sessions.body.data?.mySessions?.some((session) => session.isCurrent),
      'mySessions should include the current session',
    );

    // GraphQL mutation smoke test: revoke a second session
    const secondLogin = await fetch(`${base}${AUTH_PATH}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email, password }),
    });
    assert(secondLogin.status === 200, 'second sign-in should return 200');

    const sessionsAfter = await gql<{
      mySessions: Array<{ id: string; isCurrent: boolean }>;
    }>(base, '{ mySessions { id isCurrent } }', cookie);
    const other = sessionsAfter.body.data?.mySessions?.find(
      (session) => !session.isCurrent,
    );
    assert(other, 'expected a non-current session to revoke');

    const revoked = await gql<{ revokeSession: boolean }>(
      base,
      `mutation { revokeSession(sessionId: "${other!.id}") }`,
      cookie,
    );
    assert(
      revoked.body.data?.revokeSession === true,
      'revokeSession mutation should return true',
    );

    const anonymous = await gql(base, '{ mySessions { id } }');
    assert(anonymous.status === 401, 'anonymous mySessions should be 401');

    const signOut = await fetch(`${base}${AUTH_PATH}/sign-out`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, cookie },
      body: JSON.stringify({}),
    });
    assert(signOut.status === 200, 'sign-out should return 200');

    const clearedCookie = (signOut.headers.getSetCookie?.() ?? [])
      .map((value) => value.split(';')[0])
      .join('; ');

    const afterSignOut = await gql<{ me: unknown }>(
      base,
      '{ me { id } }',
      clearedCookie,
    );
    assert(afterSignOut.body.data?.me === null, 'me should be null after sign-out');

    console.log('[e2e-auth] PASS: sign-in, session, revoke eligibility, sign-out');
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[e2e-auth] FAIL:', error);
    process.exit(1);
  });
