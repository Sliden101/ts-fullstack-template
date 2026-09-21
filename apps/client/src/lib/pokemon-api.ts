import { pokemonListSchema, pokemonSchema, type Pokemon, type PokemonList } from '@repo/contracts';
import { graphqlRequest } from './graphql';

const POKEMON_QUERY = `
  query Pokemon($name: String!) {
    pokemon(name: $name) {
      id
      name
      height
      weight
      types
      spriteUrl
    }
  }
`;

const POKEMON_LIST_QUERY = `
  query Pokemons($limit: Int, $offset: Int) {
    pokemons(limit: $limit, offset: $offset) {
      count
      items {
        name
        url
      }
    }
  }
`;

export async function fetchPokemon(name: string): Promise<Pokemon | null> {
  const data = await graphqlRequest<{ pokemon: unknown }>(POKEMON_QUERY, {
    name,
  });

  const parsed = pokemonSchema.nullable().safeParse(data.pokemon);
  if (!parsed.success) {
    throw new Error('The server returned an unexpected pokemon payload');
  }
  return parsed.data;
}

export async function fetchPokemonList(
  limit: number,
  offset: number,
): Promise<PokemonList> {
  const data = await graphqlRequest<{ pokemons: unknown }>(
    POKEMON_LIST_QUERY,
    { limit, offset },
  );

  const parsed = pokemonListSchema.safeParse(data.pokemons);
  if (!parsed.success) {
    throw new Error('The server returned an unexpected pokemon list payload');
  }
  return parsed.data;
}
