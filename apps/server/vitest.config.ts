import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/auth-options.ts',
        'src/auth/rbac.ts',
        'src/domain/auth/auth.schemas.ts',
        'src/domain/shared/errors.ts',
        'src/domain/pokemon/pokemon.ts',
        'src/common/db.ts',
        'src/common/errors/codes.ts',
        'src/common/errors/to-http-exception.ts',
        'src/common/validation.ts',
        'src/common/http/fetch-json.ts',
        'src/modules/auth/auth.service.ts',
        'src/modules/auth/auth.resolver.ts',
        'src/modules/auth/session-revocation.service.ts',
        'src/modules/users/users.service.ts',
        'src/modules/users/users.controller.ts',
        'src/modules/users/users.schemas.ts',
        'src/modules/me/me.controller.ts',
        'src/modules/pokemon/pokemon.service.ts',
        'src/modules/pokemon/pokemon.resolver.ts',
        'src/common/filters/all-exceptions.filter.ts',
        'src/common/graphql/graphql-error-formatter.ts',
        'src/common/pipes/zod-validation.pipe.ts',
        'src/common/interceptors/logging.interceptor.ts',
        'src/common/interceptors/session-revocation.interceptor.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
});
