import { createFileRoute } from '@tanstack/react-router';
import { PokemonPage } from '@/components/organisms/pokemon';

export const Route = createFileRoute('/_authenticated/pokemon')({
  component: PokemonPage,
});
