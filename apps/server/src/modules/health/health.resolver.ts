import { Query, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Resolver()
export class HealthResolver {
  @AllowAnonymous()
  @Query(() => String)
  health(): string {
    return 'ok';
  }
}
