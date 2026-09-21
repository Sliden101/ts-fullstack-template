import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { auth } from '../../auth.ts';

@Injectable()
export class AppAuthService {
  private readonly logger = new Logger(AppAuthService.name);

  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService<typeof auth>,
  ) {}

  private toWebHeaders(headers: IncomingHttpHeaders) {
    return fromNodeHeaders(headers);
  }

  me(headers: IncomingHttpHeaders) {
    return this.authService.api.getSession({
      headers: this.toWebHeaders(headers),
    });
  }

  listSessions(headers: IncomingHttpHeaders) {
    return this.authService.api.listSessions({
      headers: this.toWebHeaders(headers),
    });
  }

  async revokeSession(
    sessionId: string,
    headers: IncomingHttpHeaders,
  ): Promise<boolean> {
    const sessions = await this.listSessions(headers);
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) {
      return false;
    }

    await this.authService.api.revokeSession({
      body: { token: target.token },
      headers: this.toWebHeaders(headers),
    });

    this.logger.log(
      JSON.stringify({
        event: 'session.revoked',
        sessionId,
      }),
    );

    return true;
  }
}
