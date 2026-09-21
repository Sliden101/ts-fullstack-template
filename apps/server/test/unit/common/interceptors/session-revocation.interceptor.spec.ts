import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { of } from 'rxjs';
import { SessionRevocationInterceptor } from '../../../../src/common/interceptors/session-revocation.interceptor.ts';

const next = { handle: () => of('ok') } as CallHandler;

function httpContext(token?: string) {
  const request = {
    session: token ? { session: { token } } : null,
  };
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SessionRevocationInterceptor', () => {
  it('rejects requests whose session token was revoked', () => {
    const revocation = { isRevoked: vi.fn().mockReturnValue(true) };
    const interceptor = new SessionRevocationInterceptor(revocation as never);

    expect(() => interceptor.intercept(httpContext('tok'), next)).toThrow(
      UnauthorizedException,
    );
  });

  it('allows requests with a non-revoked token', () => {
    const revocation = { isRevoked: vi.fn().mockReturnValue(false) };
    const interceptor = new SessionRevocationInterceptor(revocation as never);

    expect(interceptor.intercept(httpContext('tok'), next)).toBeDefined();
    expect(revocation.isRevoked).toHaveBeenCalledWith('tok');
  });

  it('allows anonymous requests (no session token)', () => {
    const revocation = { isRevoked: vi.fn().mockReturnValue(false) };
    const interceptor = new SessionRevocationInterceptor(revocation as never);

    interceptor.intercept(httpContext(undefined), next);

    expect(revocation.isRevoked).toHaveBeenCalledWith(undefined);
  });

  it('reads the token from the GraphQL context', () => {
    const revocation = { isRevoked: vi.fn().mockReturnValue(true) };
    const interceptor = new SessionRevocationInterceptor(revocation as never);
    const context = { getType: () => 'graphql' } as unknown as ExecutionContext;
    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { session: { session: { token: 'gql-tok' } } } }),
    } as never);

    expect(() => interceptor.intercept(context, next)).toThrow(
      UnauthorizedException,
    );
    expect(revocation.isRevoked).toHaveBeenCalledWith('gql-tok');
  });

  it('passes through non-http, non-graphql contexts', () => {
    const revocation = { isRevoked: vi.fn() };
    const interceptor = new SessionRevocationInterceptor(revocation as never);
    const context = { getType: () => 'rpc' } as unknown as ExecutionContext;

    interceptor.intercept(context, next);

    expect(revocation.isRevoked).not.toHaveBeenCalled();
  });
});
