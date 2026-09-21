import { randomUUID } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { db } from '../src/database.ts';
import { user, account } from '../src/db/schema.ts';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main(): Promise<void> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);

    let userId = existing[0]?.id;

    if (!userId) {
      userId = randomUUID();
      await tx.insert(user).values({
        id: userId,
        name: 'Administrator',
        email: ADMIN_EMAIL,
        emailVerified: true,
        role: 'admin',
      });
    } else {
      await tx.update(user).set({ role: 'admin' }).where(eq(user.id, userId));
    }

    const credential = await tx
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential'),
        ),
      )
      .limit(1);

    if (credential[0]) {
      await tx
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(account.id, credential[0].id));
    } else {
      await tx.insert(account).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      });
    }

    return { userId, created: existing.length === 0 };
  });

  console.log(
    `[seed-admin] ${result.created ? 'created' : 'updated'} admin ${ADMIN_EMAIL} (${result.userId})`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[seed-admin] failed:', error);
    process.exit(1);
  });
