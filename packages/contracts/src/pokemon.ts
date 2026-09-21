import { z } from 'zod';

/**
 * The public shape of the example feature, as exposed over GraphQL and
 * consumed by the client. Deliberately independent of the upstream PokeAPI
 * payload so the wire format can stay stable if the upstream changes.
 */
export const pokemonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  height: z.number().int(),
  weight: z.number().int(),
  types: z.array(z.string()),
  spriteUrl: z.string().url().nullable(),
});
export type Pokemon = z.infer<typeof pokemonSchema>;

export const pokemonListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
export type PokemonListInput = z.infer<typeof pokemonListInputSchema>;

export const pokemonListItemSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});
export type PokemonListItem = z.infer<typeof pokemonListItemSchema>;

export const pokemonListSchema = z.object({
  count: z.number().int(),
  items: z.array(pokemonListItemSchema),
});
export type PokemonList = z.infer<typeof pokemonListSchema>;
