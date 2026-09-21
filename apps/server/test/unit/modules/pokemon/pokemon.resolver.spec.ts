import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import type { HttpException } from '@nestjs/common';
import { PokemonResolver } from '../../../../src/modules/pokemon/pokemon.resolver.ts';
import { domainError } from '../../../../src/domain/shared/errors.ts';

function createResolver() {
  const service = {
    getByName: vi.fn(),
    list: vi.fn(),
  };
  return { resolver: new PokemonResolver(service as never), service };
}

describe('PokemonResolver', () => {
  it('returns a pokemon from the service', async () => {
    const { resolver, service } = createResolver();
    service.getByName.mockReturnValue(
      Effect.succeed({ id: 25, name: 'pikachu', types: ['electric'] }),
    );

    await expect(resolver.pokemon('pikachu')).resolves.toEqual({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
    });
    expect(service.getByName).toHaveBeenCalledWith('pikachu');
  });

  it('returns a page of pokemon', async () => {
    const { resolver, service } = createResolver();
    service.list.mockReturnValue(
      Effect.succeed({ count: 0, items: [{ name: 'a', url: 'u' }] }),
    );

    await expect(resolver.pokemons(10, 5)).resolves.toEqual({
      count: 0,
      items: [{ name: 'a', url: 'u' }],
    });
    expect(service.list).toHaveBeenCalledWith(10, 5);
  });

  it('surfaces a domain failure as an HTTP exception', async () => {
    const { resolver, service } = createResolver();
    service.getByName.mockReturnValue(
      Effect.fail(domainError('POKEMON_NOT_FOUND', 'Pokemon not found', 404)),
    );

    try {
      await resolver.pokemon('missing');
      throw new Error('Expected the resolver to reject');
    } catch (error) {
      const response = (error as HttpException).getResponse();
      expect(response).toMatchObject({
        code: 'POKEMON_NOT_FOUND',
        message: 'Pokemon not found',
      });
      expect((error as HttpException).getStatus()).toBe(404);
    }
  });
});
