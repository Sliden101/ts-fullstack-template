import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Observable } from 'rxjs';
import { Inject } from '@nestjs/common';
import { SessionRevocationService } from '../../modules/auth/session-revocation.service.ts';

type RequestWithSession = {
  session?: { session?: { token?: string } } | null;
};

@Injectable()
export class SessionRevocationInterceptor implements NestInterceptor {
  constructor(
    @Inject(SessionRevocationService)
    private readonly revocation: SessionRevocationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = this.getRequest(context);
    const token = request?.session?.session?.token;

    if (request && this.revocation.isRevoked(token)) {
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Session has been revoked',
      });
    }

    return next.handle();
  }

  private getRequest(context: ExecutionContext): RequestWithSession | undefined {
    const type = context.getType<string>();
    if (type === 'http') {
      return context.switchToHttp().getRequest<RequestWithSession>();
    }
    if (type === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req?: RequestWithSession;
      }>().req;
    }
    return undefined;
  }
}
