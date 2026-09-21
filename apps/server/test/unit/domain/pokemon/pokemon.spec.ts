import { describe, expect, it } from 'vitest';
import {
  mapPokemon,
  normalizePokemonName,
} from '../../../../src/domain/pokemon/pokemon.ts';
import type { UpstreamPokemon } from '../../../../src/domain/pokemon/pokemon.schemas.ts';

const baseRaw: UpstreamPokemon = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  sprites: { front_default: 'https://cdn.test/pikachu.png' },
  types: [
    { slot: 2, type: { name: 'flying', url: 'https://pokeapi.co/type/flying' } },
    { slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/type/electric' } },
  ],
};

describe('normalizePokemonName', () => {
  it('trims and lowercases', () => {
    expect(normalizePokemonName('  Pikachu ')).toBe('pikachu');
  });
});

describe('mapPokemon', () => {
  it('maps upstream fields onto the wire contract', () => {
    const result = mapPokemon(baseRaw);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: ['electric', 'flying'],
      spriteUrl: 'https://cdn.test/pikachu.png',
    });
  });

  it('allows a missing sprite', () => {
    const result = mapPokemon({
      ...baseRaw,
      sprites: { front_default: null },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spriteUrl).toBeNull();
  });

  it('fails with an upstream code when the payload is malformed', () => {
    const result = mapPokemon({ ...baseRaw, id: 'not-a-number' } as never);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UPSTREAM_INVALID_RESPONSE');
    expect(result.error.statusCode).toBe(502);
  });
});
