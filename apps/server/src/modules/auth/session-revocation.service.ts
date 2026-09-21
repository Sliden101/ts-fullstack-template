import { Injectable } from '@nestjs/common';

/**
 * In-process denylist for session tokens that were invalidated (deactivated or
 * role-changed) while a client may still hold a cached session cookie.
 *
 * Entries expire after the cookie-cache TTL, by which point Better Auth will
 * read the (deleted/updated) session from the database anyway.
 *
 * NOTE: single-instance. For horizontally scaled deployments this must be
 * backed by a shared store (e.g. Redis).
 */
@Injectable()
export class SessionRevocationService {
  private readonly revoked = new Map<string, number>();

  revoke(token: string, ttlSeconds: number): void {
    this.revoked.set(token, Date.now() + ttlSeconds * 1000);
  }

  revokeTokens(tokens: readonly string[], ttlSeconds: number): void {
    for (const token of tokens) {
      this.revoke(token, ttlSeconds);
    }
  }

  isRevoked(token: string | null | undefined): boolean {
    if (!token) {
      return false;
    }

    const expiresAt = this.revoked.get(token);
    if (expiresAt === undefined) {
      return false;
    }

    if (expiresAt <= Date.now()) {
      this.revoked.delete(token);
      return false;
    }

    return true;
  }
}
