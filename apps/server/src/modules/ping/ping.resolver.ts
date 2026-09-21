import { Args, Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PingResult } from './ping.types.ts';

@Resolver()
export class PingResolver {
  @AllowAnonymous()
  @Query(() => PingResult)
    ping(@Args('nonce', { type: () => String, nullable: true }) nonce?: string): PingResult {
      const startedAt = process.hrtime.bigint();
      const serverTime = new Date();
      const processingTimeMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

      return {
        serverTime,
        uptimeSeconds: process.uptime(),
        processingTimeMs,
        nonce: nonce ?? null,
      };

    }
}
