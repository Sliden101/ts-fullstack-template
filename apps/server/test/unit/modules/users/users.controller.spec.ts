import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { UsersController } from '../../../../src/modules/users/users.controller.ts';

function createController() {
  const usersService = {
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    setRole: vi.fn(),
    deactivate: vi.fn(),
  };
  const controller = new UsersController(usersService as never);
  const req = { user: { id: 'admin-1' } } as unknown as FastifyRequest & {
    user: { id: string };
  };
  return { controller, usersService, req };
}

describe('UsersController', () => {
  it('creates a user and wraps the response', async () => {
    const { controller, usersService, req } = createController();
    usersService.create.mockReturnValue(Effect.succeed({ id: 'u1' }));

    await expect(
      controller.create(
        { email: 'a@b.test', password: 'Password1!', name: 'Ada' },
        req,
      ),
    ).resolves.toEqual({ user: { id: 'u1' } });
    expect(usersService.create).toHaveBeenCalledWith(
      { email: 'a@b.test', password: 'Password1!', name: 'Ada' },
      'admin-1',
    );
  });

  it('lists users with pagination', async () => {
    const { controller, usersService } = createController();
    usersService.list.mockReturnValue(
      Effect.succeed({ users: [], total: 0 }),
    );

    await expect(controller.list('10', '5')).resolves.toEqual({
      users: [],
      total: 0,
    });
    expect(usersService.list).toHaveBeenCalledWith(10, 5);
  });

  it('lists users with default pagination when no query is provided', async () => {
    const { controller, usersService } = createController();
    usersService.list.mockReturnValue(
      Effect.succeed({ users: [], total: 0 }),
    );

    await controller.list(undefined, undefined);

    expect(usersService.list).toHaveBeenCalledWith(undefined, undefined);
  });

  it('fetches a single user', async () => {
    const { controller, usersService } = createController();
    usersService.findById.mockReturnValue(Effect.succeed({ id: 'u1' }));

    await expect(controller.findOne('u1')).resolves.toEqual({
      user: { id: 'u1' },
    });
  });

  it('updates a user with the actor id', async () => {
    const { controller, usersService, req } = createController();
    usersService.update.mockReturnValue(
      Effect.succeed({ id: 'u1', name: 'New' }),
    );

    await expect(
      controller.update('u1', { name: 'New' }, req),
    ).resolves.toEqual({ user: { id: 'u1', name: 'New' } });
    expect(usersService.update).toHaveBeenCalledWith(
      'u1',
      { name: 'New' },
      'admin-1',
    );
  });

  it('changes a role', async () => {
    const { controller, usersService, req } = createController();
    usersService.setRole.mockReturnValue(
      Effect.succeed({ id: 'u1', role: 'admin' }),
    );

    await expect(
      controller.setRole('u1', { role: 'admin' }, req),
    ).resolves.toEqual({ user: { id: 'u1', role: 'admin' } });
    expect(usersService.setRole).toHaveBeenCalledWith('u1', 'admin', 'admin-1');
  });

  it('deactivates a user', async () => {
    const { controller, usersService, req } = createController();
    usersService.deactivate.mockReturnValue(Effect.succeed(undefined));

    await expect(controller.deactivate('u1', req)).resolves.toBeUndefined();
    expect(usersService.deactivate).toHaveBeenCalledWith('u1', 'admin-1');
  });
});
