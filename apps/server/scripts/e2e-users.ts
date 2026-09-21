import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { LoggerService } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.ts';

const ORIGIN = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

class CaptureLogger implements LoggerService {
  readonly records: string[] = [];

  private push(message: unknown): void {
    this.records.push(
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }

  log(message: unknown): void {
    this.push(message);
  }
  error(message: unknown): void {
    this.push(message);
  }
  warn(message: unknown): void {
    this.push(message);
  }
  debug(message: unknown): void {
    this.push(message);
  }
  verbose(message: unknown): void {
    this.push(message);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function signIn(base: string, email: string, password: string) {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  const cookie = (res.headers.getSetCookie?.() ?? [])
    .map((value) => value.split(';')[0])
    .join('; ');
  return { status: res.status, cookie };
}

async function gql<T>(
  base: string,
  query: string,
  cookie?: string,
): Promise<{ status: number; body: { data?: T; errors?: unknown[] } }> {
  const res = await fetch(`${base}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ query }),
  });
  return { status: res.status, body: (await res.json()) as { data?: T; errors?: unknown[] } };
}

async function api(
  base: string,
  path: string,
  options: { method?: string; cookie?: string; body?: unknown } = {},
) {
  const res = await fetch(`${base}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      origin: ORIGIN,
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json as Record<string, unknown>, headers: res.headers };
}

async function main(): Promise<void> {
  assert(ADMIN_EMAIL && ADMIN_PASSWORD, 'ADMIN_EMAIL and ADMIN_PASSWORD required');

  const capture = new CaptureLogger();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bodyParser: false, logger: capture },
  );
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.getHttpAdapter().getInstance().server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  try {
    const admin = await signIn(base, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    assert(admin.status === 200, 'admin sign-in should succeed');
    const adminCookie = admin.cookie;

    // Provision a non-admin user through the admin API, then sign in as them.
    const roleUserEmail = `role-user-${Date.now()}@example.test`;
    const roleUserCreate = await api(base, '/api/users', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        email: roleUserEmail,
        password: 'Password1!',
        name: 'Role User',
        role: 'user',
      },
    });
    assert(
      roleUserCreate.status === 201,
      'admin should be able to create a role user',
    );

    const normal = await signIn(base, roleUserEmail, 'Password1!');
    assert(normal.status === 200, 'role user sign-in should succeed');
    const userCookie = normal.cookie;

    // 401 anonymous
    const anon = await api(base, '/api/users');
    assert(anon.status === 401, 'anonymous GET /api/users should be 401');

    // GraphQL auth.failure must be logged exactly once (single source)
    const beforeGraphql = capture.records.length;
    const anonGraphql = await gql(base, '{ mySessions { id } }');
    assert(anonGraphql.status === 401, 'anonymous GraphQL mySessions should be 401');
    const graphqlAuthFailures = capture.records
      .slice(beforeGraphql)
      .filter(
        (record) =>
          record.includes('"event":"auth.failure"') &&
          record.includes('"source":"graphql"'),
      );
    assert(
      graphqlAuthFailures.length === 1,
      `expected exactly one GraphQL auth.failure log, got ${graphqlAuthFailures.length}`,
    );

    // 403 authenticated non-admin
    const forbidden = await api(base, '/api/users', { cookie: userCookie });
    assert(forbidden.status === 403, 'user GET /api/users should be 403');

    // /me role escalation -> 400 FIELD_NOT_EDITABLE
    const escalation = await api(base, '/api/me', {
      method: 'PATCH',
      cookie: userCookie,
      body: { role: 'admin' },
    });
    assert(
      escalation.status === 400 && escalation.body.code === 'FIELD_NOT_EDITABLE',
      'self role escalation should be 400 FIELD_NOT_EDITABLE',
    );

    // create 201
    const email = `created-${Date.now()}@example.test`;
    const created = await api(base, '/api/users', {
      method: 'POST',
      cookie: adminCookie,
      body: { email, password: 'Password1!', name: 'Created User' },
    });
    assert(created.status === 201, `create should be 201 (got ${created.status})`);
    const createdUser = (created.body as { user: { id: string } }).user;
    assert(createdUser?.id, 'create should return a user id');
    assert(
      (created.headers.get('x-request-id') ?? '').length > 0,
      'x-request-id should be echoed',
    );

    // duplicate 409
    const duplicate = await api(base, '/api/users', {
      method: 'POST',
      cookie: adminCookie,
      body: { email, password: 'Password1!', name: 'Dup' },
    });
    assert(duplicate.status === 409, `duplicate should be 409 (got ${duplicate.status})`);

    // invalid input 400
    const invalid = await api(base, '/api/users', {
      method: 'POST',
      cookie: adminCookie,
      body: { email: 'not-an-email', password: 'short', name: '' },
    });
    assert(invalid.status === 400, 'invalid input should be 400');
    assert(invalid.body.code === 'VALIDATION_ERROR', 'invalid input code');

    // read 200 / 404
    const found = await api(base, `/api/users/${createdUser.id}`, { cookie: adminCookie });
    assert(found.status === 200, 'get user should be 200');
    const missing = await api(base, '/api/users/does-not-exist', { cookie: adminCookie });
    assert(missing.status === 404, 'get missing user should be 404');

    // login as created user before deactivation (for immediate 401 check)
    const createdSession = await signIn(base, email, 'Password1!');
    assert(createdSession.status === 200, 'created user can sign in');

    // patch 200
    const patched = await api(base, `/api/users/${createdUser.id}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { name: 'Updated User' },
    });
    assert(patched.status === 200, 'patch should be 200');
    assert(
      (patched.body as { user: { name: string } }).user.name === 'Updated User',
      'patch should update the name',
    );

    // concurrency: two simultaneous updates must leave consistent state
    const concurrent = await Promise.all([
      api(base, `/api/users/${createdUser.id}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { name: 'Concurrent A' },
      }),
      api(base, `/api/users/${createdUser.id}`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { name: 'Concurrent B' },
      }),
    ]);
    assert(
      concurrent.every((res) => res.status === 200),
      'concurrent updates should both succeed',
    );
    const finalState = await api(base, `/api/users/${createdUser.id}`, {
      cookie: adminCookie,
    });
    const finalName = (finalState.body as { user: { name: string } }).user.name;
    assert(
      finalName === 'Concurrent A' || finalName === 'Concurrent B',
      `concurrent final state must be consistent (got ${finalName})`,
    );

    // role change 200 + invalid role 400
    const roleOk = await api(base, `/api/users/${createdUser.id}/role`, {
      method: 'POST',
      cookie: adminCookie,
      body: { role: 'admin' },
    });
    assert(
      roleOk.status === 200,
      `role change should be 200 (got ${roleOk.status}: ${JSON.stringify(roleOk.body)})`,
    );
    const roleBad = await api(base, `/api/users/${createdUser.id}/role`, {
      method: 'POST',
      cookie: adminCookie,
      body: { role: 'ghost' },
    });
    assert(roleBad.status === 400, 'unknown role should be 400');

    // non-admin role change -> 403
    const roleForbidden = await api(base, `/api/users/${createdUser.id}/role`, {
      method: 'POST',
      cookie: userCookie,
      body: { role: 'user' },
    });
    assert(roleForbidden.status === 403, 'user role change should be 403');

    // /me 200
    const me = await api(base, '/api/me', { cookie: adminCookie });
    assert(me.status === 200, 'GET /api/me should be 200');

    // delete 204 -> deactivate
    const deleted = await api(base, `/api/users/${createdUser.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert(deleted.status === 204, `delete should be 204 (got ${deleted.status})`);

    // deactivated token -> 401 immediately
    const afterDelete = await api(base, '/api/me', { cookie: createdSession.cookie });
    assert(afterDelete.status === 401, 'deactivated token should be 401');

    // deactivated sign-in fails
    const reLogin = await signIn(base, email, 'Password1!');
    assert(reLogin.status >= 400, 'deactivated user sign-in should fail');

    console.log('[e2e-users] PASS: user CRUD, RBAC, /me, deactivation');
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[e2e-users] FAIL:', error);
    process.exit(1);
  });
