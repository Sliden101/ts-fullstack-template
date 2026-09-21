import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { runGraphQL } from '../../common/effect/run.ts';
import { PokemonService } from './pokemon.service.ts';
import { Pokemon, PokemonPage } from './pokemon.types.ts';

@Resolver()
export class PokemonResolver {
  constructor(
    @Inject(PokemonService) private readonly pokemonService: PokemonService,
  ) {}

  @UserHasPermission({ permission: { pokemon: ['read'] } })
  @Query(() => Pokemon, { nullable: true })
  async pokemon(
    @Args('name', { type: () => String }) name: string,
  ): Promise<Pokemon | null> {
    return runGraphQL(this.pokemonService.getByName(name));
  }

  @UserHasPermission({ permission: { pokemon: ['read'] } })
  @Query(() => PokemonPage)
  async pokemons(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<PokemonPage> {
    return runGraphQL(this.pokemonService.list(limit, offset));
  }
}
