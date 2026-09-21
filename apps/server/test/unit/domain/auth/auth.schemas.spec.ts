import { describe, expect, it } from 'vitest';
import { LoginInputSchema } from '../../../../src/domain/auth/auth.schemas.ts';

describe('LoginInputSchema', () => {
  it('accepts a valid email and password', () => {
    const result = LoginInputSchema.safeParse({
      email: 'admin@example.test',
      password: 'ChangeMe123!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = LoginInputSchema.safeParse({
      email: 'not-an-email',
      password: 'ChangeMe123!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = LoginInputSchema.safeParse({
      email: 'admin@example.test',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });
});
