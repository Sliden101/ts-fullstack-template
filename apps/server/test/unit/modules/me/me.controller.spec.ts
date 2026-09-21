import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { MeController } from '../../../../src/modules/me/me.controller.ts';

const sessionUser = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@b.test',
  role: 'user',
  banned: false,
  firstName: 'Ada',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createController(user: unknown = sessionUser) {
  const authService = {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  };
  const controller = new MeController(authService as never);
  const req = {
    headers: { cookie: 'session=abc' },
    user,
  } as unknown as FastifyRequest & { user: unknown };
  return { controller, authService, req };
}

describe('MeController.getMe', () => {
  it('returns the guard-attached profile without another session lookup', () => {
    const { controller, authService, req } = createController();

    const result = controller.getMe(req as never);

    expect(result.user).toMatchObject({ id: 'u1', role: 'user', firstName: 'Ada' });
    expect(result.user).not.toHaveProperty('banned');
    expect(authService.api.getSession).not.toHaveBeenCalled();
  });

  it('throws 401 when there is no user on the request', () => {
    const { controller, req } = createController(null);

    expect(() => controller.getMe(req as never)).toThrow(UnauthorizedException);
  });
});

describe('MeController.updateMe', () => {
  it('updates and returns the merged profile', async () => {
    const { controller, authService, req } = createController();

    const result = await controller.updateMe({ name: 'Ada Lovelace' }, req as never);

    expect(authService.api.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: 'Ada Lovelace' } }),
    );
    expect(result.user.name).toBe('Ada Lovelace');
    expect(JSON.stringify(result)).not.toContain('banned');
    expect(result.user).not.toHaveProperty('banned');
  });

  it('throws 401 when there is no user on the request', async () => {
    const { controller, req } = createController(null);

    await expect(controller.updateMe({ name: 'Ada' }, req as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
