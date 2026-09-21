import { describe, expect, it, vi } from 'vitest';
import type { FastifyRequest } from 'fastify';

vi.mock('../../../../src/auth.ts', () => ({ auth: {} }));

import { AuthResolver } from '../../../../src/modules/auth/auth.resolver.ts';

type Req = FastifyRequest & {
  user?: Record<string, unknown> | null;
  session?: Record<string, unknown> | null;
};

function createResolver() {
  const service = {
    me: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
  };
  const resolver = new AuthResolver(service as never);
  return { resolver, service };
}

describe('AuthResolver.me', () => {
  it('returns null when the guard found no user', () => {
    const { resolver } = createResolver();
    const req = { headers: {}, user: null } as unknown as Req;

    expect(resolver.me(req as never)).toBeNull();
  });

  it('maps the guard-attached user', () => {
    const { resolver } = createResolver();
    const req = {
      headers: {},
      user: {
        id: 'u1',
        name: 'Admin',
        email: 'a@b.test',
        role: 'admin',
        firstName: 'Admin',
      },
    } as unknown as Req;

    expect(resolver.me(req as never)).toEqual({
      id: 'u1',
      name: 'Admin',
      email: 'a@b.test',
      role: 'admin',
      firstName: 'Admin',
      lastName: null,
      image: null,
    });
  });

  it('defaults the role to user when missing', () => {
    const { resolver } = createResolver();
    const req = {
      headers: {},
      user: { id: 'u1', name: 'A', email: 'a@b.test' },
    } as unknown as Req;

    expect(resolver.me(req as never)?.role).toBe('user');
  });
});

describe('AuthResolver.mySessions', () => {
  it('marks the current session from the guard context', async () => {
    const { resolver, service } = createResolver();
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    service.listSessions.mockResolvedValue([
      { id: 's1', expiresAt, createdAt, ipAddress: null, userAgent: 'ua' },
      { id: 's2', expiresAt, createdAt },
    ]);
    const req = { headers: {}, session: { session: { id: 's1' } } } as unknown as Req;

    const result = await resolver.mySessions(req as never);

    expect(result[0]).toMatchObject({ id: 's1', isCurrent: true, userAgent: 'ua' });
    expect(result[1]).toMatchObject({ id: 's2', isCurrent: false, userAgent: null });
  });
});

describe('AuthResolver.revokeSession', () => {
  it('delegates to the service', async () => {
    const { resolver, service } = createResolver();
    service.revokeSession.mockResolvedValue(true);
    const req = { headers: { cookie: 'a' } } as unknown as FastifyRequest;

    await expect(resolver.revokeSession('s1', req)).resolves.toBe(true);
    expect(service.revokeSession).toHaveBeenCalledWith('s1', req.headers);
  });
});
