import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionRevocationService } from '../../../../src/modules/auth/session-revocation.service.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionRevocationService', () => {
  it('reports revoked tokens until the TTL expires', () => {
    const service = new SessionRevocationService();
    service.revoke('tok', 60);

    expect(service.isRevoked('tok')).toBe(true);
  });

  it('returns false for unknown or empty tokens', () => {
    const service = new SessionRevocationService();

    expect(service.isRevoked('missing')).toBe(false);
    expect(service.isRevoked(undefined)).toBe(false);
    expect(service.isRevoked(null)).toBe(false);
  });

  it('expires entries after the TTL', () => {
    vi.useFakeTimers();
    const service = new SessionRevocationService();
    service.revoke('tok', 1);

    vi.advanceTimersByTime(1500);

    expect(service.isRevoked('tok')).toBe(false);
  });

  it('revokes many tokens at once', () => {
    const service = new SessionRevocationService();
    service.revokeTokens(['a', 'b'], 60);

    expect(service.isRevoked('a')).toBe(true);
    expect(service.isRevoked('b')).toBe(true);
  });
});
