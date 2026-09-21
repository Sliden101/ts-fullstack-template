import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PokemonPage } from '@/components/organisms/pokemon';
import { fetchPokemon, fetchPokemonList } from '@/lib/pokemon-api';

vi.mock('@/lib/pokemon-api', () => ({
  fetchPokemon: vi.fn(),
  fetchPokemonList: vi.fn(),
}));

const mockedFetchPokemon = vi.mocked(fetchPokemon);
const mockedFetchPokemonList = vi.mocked(fetchPokemonList);

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PokemonPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchPokemonList.mockResolvedValue({
    count: 2,
    items: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/pokemon/1' },
      { name: 'ivysaur', url: 'https://pokeapi.co/pokemon/2' },
    ],
  });
});

describe('PokemonPage', () => {
  it('renders the pokedex list returned by the API', async () => {
    renderPage();

    expect(await screen.findByText('bulbasaur')).toBeDefined();
    expect(screen.getByText('ivysaur')).toBeDefined();
    expect(mockedFetchPokemonList).toHaveBeenCalledWith(12, 0);
  });

  it('shows a localized message when the list request fails', async () => {
    mockedFetchPokemonList.mockRejectedValue(
      Object.assign(new Error('boom'), { code: 'UPSTREAM_UNAVAILABLE' }),
    );

    renderPage();

    expect(
      await screen.findByText(
        'The upstream service is unavailable. Try again shortly.',
      ),
    ).toBeDefined();
  });

  it('looks up a pokemon by name and renders the result', async () => {
    mockedFetchPokemon.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: ['electric'],
      spriteUrl: null,
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Pokemon search'), 'pikachu');
    await user.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() =>
      expect(mockedFetchPokemon).toHaveBeenCalledWith('pikachu'),
    );
    expect(await screen.findByText('electric')).toBeDefined();
    expect(screen.getAllByText('pikachu').length).toBeGreaterThan(0);
  });
});
