import { Inject, Injectable } from '@nestjs/common';
import { Effect } from 'effect';
import { pokemonListInputSchema, type Pokemon, type PokemonList } from '@repo/contracts';
import { ERROR_CODES } from '../../common/errors/codes.ts';
import { fetchJson } from '../../common/http/fetch-json.ts';
import { isValidationFailure, type ValidationFailure } from '../../common/effect/failures.ts';
import { parse } from '../../common/effect/parse.ts';
import { withResilience } from '../../common/effect/resilience.ts';
import { fromResult } from '../../common/effect/result.ts';
import { domainError, type DomainError } from '../../domain/shared/errors.ts';
import {
  mapPokemon,
  normalizePokemonName,
} from '../../domain/pokemon/pokemon.ts';
import {
  upstreamPokemonListSchema,
  upstreamPokemonSchema,
} from '../../domain/pokemon/pokemon.schemas.ts';

export const POKEAPI_BASE_URL = 'POKEAPI_BASE_URL';

export type PokemonError = DomainError | ValidationFailure;

function upstreamInvalid(): DomainError {
  return domainError(
    ERROR_CODES.UPSTREAM_INVALID_RESPONSE,
    'Upstream pokemon payload did not match the expected shape',
    502,
  );
}

@Injectable()
export class PokemonService {
  constructor(
    @Inject(POKEAPI_BASE_URL) private readonly baseUrl: string,
  ) {}

  getByName(rawName: string): Effect.Effect<Pokemon, PokemonError> {
    const name = normalizePokemonName(rawName);
    if (name.length === 0) {
      return Effect.fail(
        domainError(ERROR_CODES.VALIDATION_ERROR, 'Pokemon name is required', 400),
      );
    }

    const self = this;
    return withResilience(
      Effect.gen(function* () {
        const json = yield* self.request(
          `${self.baseUrl}/pokemon/${encodeURIComponent(name)}`,
        );
        const raw = yield* parse(upstreamPokemonSchema, json).pipe(
          Effect.catchIf(isValidationFailure, () =>
            Effect.fail(upstreamInvalid()),
          ),
        );
        return yield* fromResult(mapPokemon(raw));
      }),
      { idempotent: true, timeoutMs: 5000 },
    );
  }

  list(limit = 20, offset = 0): Effect.Effect<PokemonList, PokemonError> {
    const self = this;
    return withResilience(
      Effect.gen(function* () {
        const input = yield* parse(pokemonListInputSchema, { limit, offset });
        const json = yield* self.request(
          `${self.baseUrl}/pokemon?limit=${input.limit}&offset=${input.offset}`,
        );
        const parsed = yield* parse(upstreamPokemonListSchema, json).pipe(
          Effect.catchIf(isValidationFailure, () =>
            Effect.fail(upstreamInvalid()),
          ),
        );
        return {
          count: parsed.count,
          items: parsed.results.map((entry) => ({
            name: entry.name,
            url: entry.url,
          })),
        };
      }),
      { idempotent: true, timeoutMs: 5000 },
    );
  }

  private request(url: string): Effect.Effect<unknown, PokemonError> {
    return fetchJson(url).pipe(
      Effect.catchTag('HttpFailure', (failure) =>
        Effect.fail(
          failure.status === 404
            ? domainError(
                ERROR_CODES.POKEMON_NOT_FOUND,
                'Pokemon not found',
                404,
              )
            : domainError(
                ERROR_CODES.UPSTREAM_UNAVAILABLE,
                'Upstream service unavailable',
                502,
              ),
        ),
      ),
    );
  }
}
