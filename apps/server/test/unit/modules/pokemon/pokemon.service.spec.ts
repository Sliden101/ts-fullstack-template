import { afterEach, describe, expect, it, vi } from 'vitest';
import { PokemonService } from '../../../../src/modules/pokemon/pokemon.service.ts';
import { runEffect, runEffectResult } from '../../../support/effect-test.ts';

const BASE = 'https://pokeapi.test/api/v2';

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  };
}

function createService() {
  return new PokemonService(BASE);
}

const rawPokemon = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  sprites: { front_default: 'https://cdn.test/pikachu.png' },
  types: [
    { slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/type/electric' } },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PokemonService.getByName', () => {
  it('fetches and maps a pokemon', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(rawPokemon)));

    const result = await runEffect(createService().getByName(' Pikachu '));

    expect(result).toEqual({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: ['electric'],
      spriteUrl: 'https://cdn.test/pikachu.png',
    });
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/pokemon/pikachu`,
      undefined,
    );
  });

  it('maps an upstream 404 to POKEMON_NOT_FOUND', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    const result = await runEffectResult(createService().getByName('missing'));

    expect(result._tag).toBe('Failure');
    if (result._tag !== 'Failure') return;
    expect(result.failure.code).toBe('POKEMON_NOT_FOUND');
    expect(result.failure.statusCode).toBe(404);
  });

  it('maps a network error to UPSTREAM_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await runEffectResult(createService().getByName('pikachu'));

    expect(result._tag).toBe('Failure');
    if (result._tag !== 'Failure') return;
    expect(result.failure.code).toBe('UPSTREAM_UNAVAILABLE');
  });

  it('fails fast on an empty name without calling upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runEffectResult(createService().getByName('   '));

    expect(result._tag).toBe('Failure');
    if (result._tag !== 'Failure') return;
    expect(result.failure.code).toBe('VALIDATION_ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a malformed upstream payload to UPSTREAM_INVALID_RESPONSE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ id: 'x' })),
    );

    const result = await runEffectResult(createService().getByName('pikachu'));

    expect(result._tag).toBe('Failure');
    if (result._tag !== 'Failure') return;
    expect(result.failure.code).toBe('UPSTREAM_INVALID_RESPONSE');
  });
});

describe('PokemonService.list', () => {
  it('returns a page of items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          count: 2,
          results: [
            { name: 'bulbasaur', url: 'https://pokeapi.co/pokemon/1' },
            { name: 'ivysaur', url: 'https://pokeapi.co/pokemon/2' },
          ],
        }),
      ),
    );

    const result = await runEffect(createService().list(2, 0));

    expect(result.count).toBe(2);
    expect(result.items).toEqual([
      { name: 'bulbasaur', url: 'https://pokeapi.co/pokemon/1' },
      { name: 'ivysaur', url: 'https://pokeapi.co/pokemon/2' },
    ]);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/pokemon?limit=2&offset=0`, undefined);
  });

  it('rejects an out-of-range limit without calling upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runEffectResult(createService().list(0, 0));

    expect(result._tag).toBe('Failure');
    if (result._tag !== 'Failure') return;
    expect(result.failure.code).toBe('VALIDATION_ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
