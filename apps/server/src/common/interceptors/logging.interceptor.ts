import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyReply, FastifyRequest } from 'fastify';

function statusFromError(error: unknown): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();
    const startedAt = Date.now();
    const traceId = (request as { id?: string }).id;

    if (traceId) {
      response.header('x-request-id', traceId);
    }

    return next.handle().pipe(
      tap({
        next: () => this.write(request, response, startedAt, traceId),
        error: (error: unknown) =>
          this.write(request, response, startedAt, traceId, error),
      }),
    );
  }

  private write(
    request: FastifyRequest,
    response: FastifyReply,
    startedAt: number,
    traceId: string | undefined,
    error?: unknown,
  ): void {
    const userId = (request as { user?: { id?: string } }).user?.id;
    const status = error ? statusFromError(error) : response.statusCode;

    this.logger.log(
      JSON.stringify({
        event: 'http.request',
        traceId,
        userId,
        method: request.method,
        url: request.url,
        status,
        durationMs: Date.now() - startedAt,
      }),
    );
  }
}
