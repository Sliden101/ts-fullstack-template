import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, Logger } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError, firstValueFrom } from 'rxjs';
import { LoggingInterceptor } from '../../../../src/common/interceptors/logging.interceptor.ts';

function createContext(type = 'http') {
  const header = vi.fn();
  const request = {
    id: 'trace-1',
    method: 'GET',
    url: '/api/me',
    user: { id: 'user-1' },
  };
  const response = { statusCode: 200, header };
  const context = {
    getType: () => type,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, header, response };
}

describe('LoggingInterceptor', () => {
  it('logs a structured http.request for successful calls', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { context, header } = createContext();
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    await firstValueFrom(new LoggingInterceptor().intercept(context, next));

    expect(header).toHaveBeenCalledWith('x-request-id', 'trace-1');
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      event: 'http.request',
      traceId: 'trace-1',
      userId: 'user-1',
      method: 'GET',
      url: '/api/me',
      status: 200,
    });
    expect(typeof payload.durationMs).toBe('number');
  });

  it('logs the error status when the handler throws', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { context } = createContext();
    const next = {
      handle: () => throwError(() => new BadRequestException('bad')),
    } as CallHandler;

    await firstValueFrom(
      new LoggingInterceptor().intercept(context, next),
    ).catch(() => undefined);

    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({ event: 'http.request', status: 400 });
  });

  it('passes through non-http contexts', () => {
    const { context } = createContext('graphql');
    const next = { handle: () => of('graphql-result') } as CallHandler;

    expect(new LoggingInterceptor().intercept(context, next)).toBeDefined();
  });
});
