import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { AppUsersService } from '../../../../src/modules/users/users.service.ts';
import {
  makeFakeDb,
  runEffect,
  runEffectResult,
} from '../../../support/effect-test.ts';

function createRevocation() {
  return {
    revoke: vi.fn(),
    revokeTokens: vi.fn(),
    isRevoked: vi.fn(),
  };
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@b.test',
    role: 'user',
    banned: false,
    first_name: null,
    last_name: null,
    image: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

async function failureOf<A, E>(
  effect: Effect.Effect<A, E, never>,
): Promise<E> {
  const result = await runEffectResult(effect);
  if (result._tag === 'Success') {
    throw new Error('Expected the effect to fail');
  }
  return result.failure;
}

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
});

describe('AppUsersService.create', () => {
  it('inserts a user and credential account in a transaction', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [userRow()] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(
      service.create(
        { email: 'Ada@B.test', password: 'Password1!', name: 'Ada' },
        'admin-1',
      ),
    );

    expect(result).toMatchObject({ id: 'u1', role: 'user' });
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('user.created'),
    );
  });

  it('maps unique violations to EMAIL_TAKEN', async () => {
    const db = makeFakeDb();
    db.execute.mockRejectedValueOnce({ code: '23505' });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(
      service.create({ email: 'a@b.test', password: 'Password1!', name: 'Ada' }),
    );

    expect(failure).toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('maps wrapped unique violations (cause.code) to EMAIL_TAKEN', async () => {
    const db = makeFakeDb();
    db.execute.mockRejectedValueOnce({ cause: { code: '23505' } });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(
      service.create({ email: 'a@b.test', password: 'Password1!', name: 'Ada' }),
    );

    expect(failure).toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('applies every optional field and an explicit role', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [userRow({ role: 'admin' })] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(
      service.create(
        {
          email: 'Ada@B.test',
          password: 'Password1!',
          name: 'Ada',
          role: 'admin',
          firstName: 'Ada',
          lastName: 'Lovelace',
          image: 'https://cdn.test/ada.png',
        },
        undefined,
      ),
    );

    expect(result.role).toBe('admin');
  });

  it('fails when the insert returns no rows', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(
      service.create({ email: 'a@b.test', password: 'Password1!', name: 'Ada' }),
    );

    expect(failure).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  it('rejects unknown roles before touching the database', async () => {
    const db = makeFakeDb();
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(
      service.create({
        email: 'a@b.test',
        password: 'Password1!',
        name: 'Ada',
        role: 'ghost',
      }),
    );

    expect(failure).toMatchObject({ code: 'UNKNOWN_ROLE' });
    expect(db.execute).not.toHaveBeenCalled();
  });
});

describe('AppUsersService.findById', () => {
  it('returns the public user when found', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({ rows: [userRow()] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(service.findById('u1'));

    expect(result).toMatchObject({ id: 'u1' });
  });

  it('fails with USER_NOT_FOUND when missing', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.findById('nope'));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('AppUsersService.list', () => {
  it('returns users and total', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [userRow()] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(service.list(10, 0));

    expect(result.total).toBe(1);
    expect(result.users).toHaveLength(1);
  });

  it('defaults total to 0 when the count row is missing', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(service.list());

    expect(result).toEqual({ users: [], total: 0 });
  });

  it('treats a result without a rows array as empty', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({});
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.findById('u1'));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('AppUsersService.update', () => {
  it('locks the row and updates fields', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [userRow({ name: 'New' })] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(service.update('u1', { name: 'New' }, 'admin-1'));

    expect(result).toMatchObject({ name: 'New' });
  });

  it('fails with USER_NOT_FOUND when the row is missing', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.update('nope', { name: 'X' }));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('rejects empty updates', async () => {
    const db = makeFakeDb();
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.update('u1', {}));

    expect(failure).toMatchObject({ code: 'NO_DATA' });
  });

  it('updates every optional field', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [userRow()] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(
      service.update('u1', {
        firstName: 'Ada',
        lastName: 'Lovelace',
        image: 'https://cdn.test/ada.png',
      }),
    );

    expect(result).toMatchObject({ id: 'u1' });
  });

  it('fails with USER_NOT_FOUND when the update returns no row', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.update('u1', { name: 'X' }));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('AppUsersService.setRole', () => {
  it('rejects unknown roles', async () => {
    const db = makeFakeDb();
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.setRole('u1', 'ghost'));

    expect(failure).toMatchObject({ code: 'UNKNOWN_ROLE' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('updates and logs the role change', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [{ token: 'tok' }] })
      .mockResolvedValueOnce({ rows: [userRow({ role: 'admin' })] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const result = await runEffect(service.setRole('u1', 'admin', 'admin-1'));

    expect(result).toMatchObject({ role: 'admin' });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('user.role_changed'),
    );
  });

  it('fails with USER_NOT_FOUND when the target row is missing', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.setRole('nope', 'admin'));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('fails with USER_NOT_FOUND when the role update returns no row', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.setRole('u1', 'admin'));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('AppUsersService.deactivate', () => {
  it('bans the user and deletes their sessions', async () => {
    const db = makeFakeDb();
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [{ token: 'tok-1' }, { token: 'tok-2' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const revocation = createRevocation();
    const service = new AppUsersService(db as never, revocation as never);

    await expect(runEffect(service.deactivate('u1', 'admin-1'))).resolves.toBeUndefined();

    expect(db.execute).toHaveBeenCalledTimes(4);
    expect(revocation.revokeTokens).toHaveBeenCalledWith(
      ['tok-1', 'tok-2'],
      expect.any(Number),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('user.deactivated'),
    );
  });

  it('fails with USER_NOT_FOUND when the user is missing', async () => {
    const db = makeFakeDb();
    db.execute.mockResolvedValueOnce({ rows: [] });
    const service = new AppUsersService(db as never, createRevocation() as never);

    const failure = await failureOf(service.deactivate('nope'));

    expect(failure).toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});
