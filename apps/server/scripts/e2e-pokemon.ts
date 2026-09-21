import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.ts';

const ORIGIN = 'http://localhost:3000';
const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
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
  return {
    status: res.status,
    body: (await res.json()) as { data?: T; errors?: unknown[] },
  };
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

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  assert(email && password, 'ADMIN_EMAIL and ADMIN_PASSWORD are required');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bodyParser: false, logger: false },
  );
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.getHttpAdapter().getInstance().server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  try {
    const anonymous = await gql(base, '{ pokemon(name: "pikachu") { name } }');
    assert(anonymous.status === 401, 'anonymous pokemon query should be 401');

    const login = await signIn(base, email, password);
    assert(login.status === 200, 'admin sign-in should succeed');

    const found = await gql<{ pokemon: { name: string; types: string[] } | null }>(
      base,
      '{ pokemon(name: "pikachu") { name types } }',
      login.cookie,
    );
    assert(found.body.data?.pokemon?.name === 'pikachu', 'should return pikachu');
    assert(
      (found.body.data?.pokemon?.types ?? []).includes('electric'),
      'pikachu should be electric',
    );

    const missing = await gql(
      base,
      '{ pokemon(name: "not-a-real-pokemon-xyz") { name } }',
      login.cookie,
    );
    assert(missing.status === 404, 'missing pokemon should be 404');

    const page = await gql<{ pokemons: { count: number; items: unknown[] } }>(
      base,
      '{ pokemons(limit: 3, offset: 0) { count items { name url } } }',
      login.cookie,
    );
    assert(
      (page.body.data?.pokemons?.items?.length ?? 0) === 3,
      'pokemons should return the requested page size',
    );
    assert(
      (page.body.data?.pokemons?.count ?? 0) > 0,
      'pokemons should report a total count',
    );

    console.log(
      `[e2e-pokemon] PASS: ${POKEAPI_BASE_URL} — auth, lookup, 404, pagination`,
    );
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[e2e-pokemon] FAIL:', error);
    process.exit(1);
  });
