import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.ts';

const ORIGIN = 'http://localhost:3000';
const DURATION_MS = 5000;
const CONCURRENCY = 50;

interface BenchResult {
  name: string;
  completed: number;
  failed: number;
  rps: number;
  p50: number;
  p95: number;
  max: number;
}

async function benchmark(
  name: string,
  request: () => Promise<globalThis.Response>,
): Promise<BenchResult> {
  const warmup = await request();
  await warmup.text();

  const latencies: number[] = [];
  let completed = 0;
  let failed = 0;
  const deadline = Date.now() + DURATION_MS;

  async function worker(): Promise<void> {
    while (Date.now() < deadline) {
      const start = performance.now();
      try {
        const res = await request();
        await res.text();
        const elapsed = performance.now() - start;
        if (res.status === 200) {
          completed += 1;
          latencies.push(elapsed);
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  latencies.sort((a, b) => a - b);
  const percentile = (q: number) =>
    latencies[Math.min(latencies.length - 1, Math.floor(q * latencies.length))] ?? 0;

  return {
    name,
    completed,
    failed,
    rps: completed / (DURATION_MS / 1000),
    p50: percentile(0.5),
    p95: percentile(0.95),
    max: latencies.at(-1) ?? 0,
  };
}

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD required');

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
    const login = await fetch(`${base}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ email, password }),
    });
    const cookie = (login.headers.getSetCookie?.() ?? [])
      .map((value) => value.split(';')[0])
      .join('; ');
    if (login.status !== 200 || !cookie) throw new Error('load test login failed');

    const listRes = await fetch(`${base}/api/users?limit=1`, {
      headers: { cookie, origin: ORIGIN },
    });
    const listBody = (await listRes.json()) as { users?: Array<{ id: string }> };
    const userId = listBody.users?.[0]?.id;
    if (!userId) throw new Error('no user id for load test');

    const results = [
      await benchmark('graphql:me', () =>
        fetch(`${base}/graphql`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie },
          body: JSON.stringify({ query: '{ me { id email } }' }),
        }),
      ),
      await benchmark('rest:GET /api/me', () =>
        fetch(`${base}/api/me`, { headers: { cookie, origin: ORIGIN } }),
      ),
      await benchmark('rest:GET /api/users/:id', () =>
        fetch(`${base}/api/users/${userId}`, { headers: { cookie, origin: ORIGIN } }),
      ),
    ];

    console.log(
      `[load-auth] concurrency=${CONCURRENCY} duration=${DURATION_MS}ms (cookieCache enabled)`,
    );
    for (const r of results) {
      console.log(
        `[load-auth] ${r.name}: rps=${r.rps.toFixed(1)} completed=${r.completed} failed=${r.failed} p50=${r.p50.toFixed(1)}ms p95=${r.p95.toFixed(1)}ms max=${r.max.toFixed(1)}ms`,
      );
    }

    const worst = results.reduce((acc, r) => Math.max(acc, r.p95), 0);
    if (worst >= 4000) {
      throw new Error(`p95 latency exceeded the 4s budget (worst ${worst.toFixed(1)}ms)`);
    }
    const slowest = Math.min(...results.map((r) => r.rps));
    if (slowest < 100) {
      throw new Error(`throughput below 100 TPS (slowest ${slowest.toFixed(1)})`);
    }
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[load-auth] FAIL:', error);
    process.exit(1);
  });
