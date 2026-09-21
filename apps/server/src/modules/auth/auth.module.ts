import { Module } from '@nestjs/common';
import { AppAuthService } from './auth.service.ts';
import { AuthResolver } from './auth.resolver.ts';
import { SessionRevocationService } from './session-revocation.service.ts';

@Module({
  providers: [AppAuthService, AuthResolver, SessionRevocationService],
  exports: [AppAuthService, SessionRevocationService],
})
export class AppAuthModule {}
