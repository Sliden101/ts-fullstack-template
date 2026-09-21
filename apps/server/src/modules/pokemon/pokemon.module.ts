import { Module } from '@nestjs/common';
import { PokemonResolver } from './pokemon.resolver.ts';
import { POKEAPI_BASE_URL, PokemonService } from './pokemon.service.ts';

@Module({
  providers: [
    PokemonService,
    PokemonResolver,
    {
      provide: POKEAPI_BASE_URL,
      useValue: process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2',
    },
  ],
})
export class PokemonModule {}
