import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';
import { DrizzleModule } from '@nest-native/drizzle';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { join } from 'node:path';

import { schema } from './db/schema.ts';
import { createDatabase, pool, type AppDatabase } from './database.ts';
import { auth } from './auth.ts';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.ts';
import { graphqlErrorFormatter } from './common/graphql/graphql-error-formatter.ts';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.ts';
import { SessionRevocationInterceptor } from './common/interceptors/session-revocation.interceptor.ts';
import { HealthModule } from './modules/health/health.module.ts';
import { AppAuthModule } from './modules/auth/auth.module.ts';
import { PingModule } from './modules/ping/ping.module.ts';
import { UsersModule } from './modules/users/users.module.ts';
import { MeModule } from './modules/me/me.module.ts';
import { PokemonModule } from './modules/pokemon/pokemon.module.ts';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: () => pool.end(),
    }),
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      graphiql: true,
      ide: true,
      path: '/graphql',
      typePaths: [join(import.meta.dirname, '**/*.graphql')],
      errorFormatter: graphqlErrorFormatter,
    }),
    HealthModule,
    AppAuthModule,
    PingModule,
    UsersModule,
    MeModule,
    PokemonModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SessionRevocationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
