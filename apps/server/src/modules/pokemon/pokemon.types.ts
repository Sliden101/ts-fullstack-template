export class Pokemon {
  id!: number;
  name!: string;
  height!: number;
  weight!: number;
  types!: string[];
  spriteUrl?: string | null;
}

export class PokemonListItem {
  name!: string;
  url!: string;
}

export class PokemonPage {
  count!: number;
  items!: PokemonListItem[];
}
