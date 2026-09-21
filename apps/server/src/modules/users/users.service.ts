import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Effect } from 'effect';
import { ERROR_CODES } from '../../common/errors/codes.ts';
import { sql, type SQL } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { InjectDrizzle } from '@nest-native/drizzle';
import { extractRows } from '../../common/db.ts';
import type { AppDatabase } from '../../database.ts';
import {
  DbFailure,
  runInTransaction,
  tryDb,
  withResilience,
  type EffectTransactionClient,
} from '../../common/effect/index.ts';
import { DEFAULT_ROLE, isKnownRole } from '../../auth/rbac.ts';
import { COOKIE_CACHE_MAX_AGE } from '../../auth-options.ts';
import { domainError, type DomainError } from '../../domain/shared/errors.ts';
import { SessionRevocationService } from '../auth/session-revocation.service.ts';
import type { CreateUserInput, UpdateUserInput } from './users.schemas.ts';

type UserError = DomainError | DbFailure;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  createdAt: Date;
}

export interface UserListResult {
  users: PublicUser[];
  total: number;
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  created_at: Date;
};

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    banned: Boolean(row.banned),
    firstName: row.first_name,
    lastName: row.last_name,
    image: row.image,
    createdAt: row.created_at,
  };
}

function isUniqueDbFailure(failure: UserError): failure is DbFailure {
  return failure instanceof DbFailure && failure.sqlState === '23505';
}

@Injectable()
export class AppUsersService {
  private readonly logger = new Logger(AppUsersService.name);

  constructor(
    @InjectDrizzle() private readonly db: AppDatabase,
    @Inject(SessionRevocationService)
    private readonly revocation: SessionRevocationService,
  ) {}

  create(
    input: CreateUserInput,
    actorId?: string,
  ): Effect.Effect<PublicUser, UserError> {
    const self = this;
    return Effect.gen(function* () {
      const role = input.role ?? DEFAULT_ROLE;
      if (!isKnownRole(role)) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.UNKNOWN_ROLE, 'Unknown role', 400),
        );
      }

      const email = input.email.toLowerCase();
      const passwordHash = yield* tryDb(() => hashPassword(input.password));
      const userId = randomUUID();

      const row = yield* runInTransaction(self.db, (tx) =>
        Effect.gen(function* () {
          const inserted = extractRows<UserRow>(
            yield* tryDb(() =>
              tx.execute(sql`
                insert into "user"
                  (id, name, email, email_verified, role,
                   first_name, last_name, image,
                   created_at, updated_at)
                values
                  (${userId}, ${input.name}, ${email}, true, ${role},
                   ${input.firstName ?? null}, ${input.lastName ?? null},
                   ${input.image ?? null}, now(), now())
                returning *
              `),
            ),
          );

          yield* tryDb(() =>
            tx.execute(sql`
              insert into "account"
                (id, user_id, account_id, provider_id, password, created_at, updated_at)
              values
                (${randomUUID()}, ${userId}, ${userId}, 'credential', ${passwordHash}, now(), now())
            `),
          );

          return inserted[0];
        }),
      ).pipe(
        Effect.catchIf(isUniqueDbFailure, () =>
          Effect.fail(domainError(ERROR_CODES.EMAIL_TAKEN, 'Email already exists', 409)),
        ),
      );

      if (!row) {
        return yield* Effect.fail(
          domainError(
            ERROR_CODES.INTERNAL_SERVER_ERROR,
            'User insert returned no rows',
            500,
          ),
        );
      }

      self.logger.log(
        JSON.stringify({ event: 'user.created', actorId, userId: row.id, role }),
      );
      return toPublicUser(row);
    });
  }

  findById(id: string): Effect.Effect<PublicUser, UserError> {
    const self = this;
    return withResilience(
      Effect.gen(function* () {
        const rows = extractRows<UserRow>(
          yield* tryDb(() =>
            self.db.execute(sql`select * from "user" where id = ${id} limit 1`),
          ),
        );
        const row = rows[0];
        if (!row) {
          return yield* Effect.fail(
            domainError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404),
          );
        }
        return toPublicUser(row);
      }),
      { idempotent: true },
    );
  }

  list(limit = 50, offset = 0): Effect.Effect<UserListResult, UserError> {
    const self = this;
    return withResilience(
      Effect.gen(function* () {
        const rows = extractRows<UserRow>(
          yield* tryDb(() =>
            self.db.execute(sql`
              select * from "user"
              order by created_at desc
              limit ${limit} offset ${offset}
            `),
          ),
        );
        const totalRows = extractRows<{ total: number | string }>(
          yield* tryDb(() =>
            self.db.execute(sql`select count(*)::int as total from "user"`),
          ),
        );

        return {
          users: rows.map(toPublicUser),
          total: Number(totalRows[0]?.total ?? 0),
        };
      }),
      { idempotent: true },
    );
  }

  update(
    id: string,
    input: UpdateUserInput,
    actorId?: string,
  ): Effect.Effect<PublicUser, UserError> {
    const self = this;
    return Effect.gen(function* () {
      const sets: SQL[] = [];
      if (input.name !== undefined) sets.push(sql`name = ${input.name}`);
      if (input.firstName !== undefined)
        sets.push(sql`first_name = ${input.firstName}`);
      if (input.lastName !== undefined)
        sets.push(sql`last_name = ${input.lastName}`);
      if (input.image !== undefined) sets.push(sql`image = ${input.image}`);

      if (sets.length === 0) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.NO_DATA, 'No fields to update', 400),
        );
      }

      const row = yield* runInTransaction(self.db, (tx) =>
        Effect.gen(function* () {
          yield* self.lockOrThrow(tx, id);
          const updated = extractRows<UserRow>(
            yield* tryDb(() =>
              tx.execute(sql`
                update "user" set ${sql.join(sets, sql`, `)}, updated_at = now()
                where id = ${id}
                returning *
              `),
            ),
          );
          return updated[0];
        }),
      );

      if (!row) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404),
        );
      }

      self.logger.log(
        JSON.stringify({ event: 'user.updated', actorId, userId: id }),
      );
      return toPublicUser(row);
    });
  }

  setRole(
    id: string,
    role: string,
    actorId?: string,
  ): Effect.Effect<PublicUser, UserError> {
    const self = this;
    return Effect.gen(function* () {
      if (!isKnownRole(role)) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.UNKNOWN_ROLE, 'Unknown role', 400),
        );
      }

      const result = yield* runInTransaction(self.db, (tx) =>
        Effect.gen(function* () {
          yield* self.lockOrThrow(tx, id);
          const tokens = extractRows<{ token: string }>(
            yield* tryDb(() =>
              tx.execute(
                sql`select token from "session" where user_id = ${id}`,
              ),
            ),
          );
          const updated = extractRows<UserRow>(
            yield* tryDb(() =>
              tx.execute(sql`
                update "user" set role = ${role}, updated_at = now()
                where id = ${id}
                returning *
              `),
            ),
          );
          return { row: updated[0], tokens: tokens.map((entry) => entry.token) };
        }),
      );

      const { row } = result;
      if (!row) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404),
        );
      }

      self.revocation.revokeTokens(result.tokens, COOKIE_CACHE_MAX_AGE);
      self.logger.log(
        JSON.stringify({ event: 'user.role_changed', actorId, userId: id, role }),
      );
      return toPublicUser(row);
    });
  }

  deactivate(id: string, actorId?: string): Effect.Effect<void, UserError> {
    const self = this;
    return Effect.gen(function* () {
      const tokens = yield* runInTransaction(self.db, (tx) =>
        Effect.gen(function* () {
          yield* self.lockOrThrow(tx, id);
          const rows = extractRows<{ token: string }>(
            yield* tryDb(() =>
              tx.execute(
                sql`select token from "session" where user_id = ${id}`,
              ),
            ),
          );
          yield* tryDb(() =>
            tx.execute(sql`
              update "user" set banned = true, ban_reason = ${'Deactivated'}, updated_at = now()
              where id = ${id}
            `),
          );
          yield* tryDb(() =>
            tx.execute(sql`delete from "session" where user_id = ${id}`),
          );
          return rows.map((entry) => entry.token);
        }),
      );

      self.revocation.revokeTokens(tokens, COOKIE_CACHE_MAX_AGE);
      self.logger.log(
        JSON.stringify({ event: 'user.deactivated', actorId, userId: id }),
      );
    });
  }

  private lockOrThrow(
    tx: EffectTransactionClient,
    id: string,
  ): Effect.Effect<void, UserError> {
    return Effect.gen(function* () {
      const locked = extractRows<{ id: string }>(
        yield* tryDb(() =>
          tx.execute(sql`select id from "user" where id = ${id} for update`),
        ),
      );
      if (locked.length === 0) {
        return yield* Effect.fail(
          domainError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404),
        );
      }
    });
  }
}
