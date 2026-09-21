import { pokemonSchema, type Pokemon } from '@repo/contracts';
import { ERROR_CODES } from '../../common/errors/codes.ts';
import { domainError, type DomainError } from '../shared/errors.ts';
import { err, ok, type Result } from '../shared/result.ts';
import type { UpstreamPokemon } from './pokemon.schemas.ts';

/** Normalize a user-supplied name to the form PokeAPI expects. */
export function normalizePokemonName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Map a raw PokeAPI payload onto the public wire contract.
 *
 * Pure and framework-free: the service is responsible for fetching.
 */
export function mapPokemon(
  raw: UpstreamPokemon,
): Result<Pokemon, DomainError> {
  const mapped = pokemonSchema.safeParse({
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name),
    spriteUrl: raw.sprites.front_default,
  });

  if (!mapped.success) {
    return err(
      domainError(
        ERROR_CODES.UPSTREAM_INVALID_RESPONSE,
        'Upstream pokemon payload did not match the expected shape',
        502,
      ),
    );
  }

  return ok(mapped.data);
}
