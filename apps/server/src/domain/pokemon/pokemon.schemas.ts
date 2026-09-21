import { z } from 'zod';

/**
 * Raw PokeAPI payload shapes. These are intentionally kept separate from the
 * wire contract in `@repo/contracts`: upstream may change without breaking our
 * public API, and the domain layer maps between the two.
 */
export const upstreamPokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  sprites: z.object({
    front_default: z.string().nullable(),
  }),
  types: z.array(
    z.object({
      slot: z.number(),
      type: z.object({
        name: z.string(),
        url: z.string(),
      }),
    }),
  ),
});

export type UpstreamPokemon = z.infer<typeof upstreamPokemonSchema>;

export const upstreamPokemonListSchema = z.object({
  count: z.number(),
  results: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
});

export type UpstreamPokemonList = z.infer<typeof upstreamPokemonListSchema>;
