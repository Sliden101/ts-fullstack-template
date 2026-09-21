import { describe, expect, it } from 'vitest';
import { err, ok } from '../../../../src/domain/shared/result.ts';

describe('result', () => {
  it('wraps a success value', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });

  it('wraps a failure', () => {
    expect(err('bad')).toEqual({ ok: false, error: 'bad' });
  });
});
