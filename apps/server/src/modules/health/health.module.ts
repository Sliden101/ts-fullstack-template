import { Module } from '@nestjs/common';
import { HealthResolver } from './health.resolver.ts';

import { DateScalar, TimeScalar } from '../../common/scalars/date-time.scalar.ts';

@Module({ providers: [HealthResolver, DateScalar, TimeScalar]})
export class HealthModule {}
