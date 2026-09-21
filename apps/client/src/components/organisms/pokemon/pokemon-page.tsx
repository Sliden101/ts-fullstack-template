import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/atom';
import { getTranslation } from '@/i18n';
import { fetchPokemon, fetchPokemonList } from '@/lib/pokemon-api';

const PAGE_SIZE = 12;

function messageFor(error: unknown): string {
  const { errors } = getTranslation('en');
  const code = (error as { code?: string }).code?.toLowerCase();
  const table = errors as Record<string, string>;
  return (code ? table[code] : undefined) ?? errors.unknown;
}

export function PokemonPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [offset, setOffset] = useState(0);

  const detail = useQuery({
    queryKey: ['pokemon', submitted],
    queryFn: () => fetchPokemon(submitted),
    enabled: submitted.length > 0,
  });

  const list = useQuery({
    queryKey: ['pokemons', PAGE_SIZE, offset],
    queryFn: () => fetchPokemonList(PAGE_SIZE, offset),
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(query.trim());
  };

  const canGoBack = offset > 0;
  const canGoForward =
    list.data !== undefined && offset + PAGE_SIZE < list.data.count;

  return (
    <main className="mx-auto max-w-4xl p-6 md:p-8">
      <h1 className="text-lg font-bold tracking-tight text-slate-900">
        Pokemon
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        An end-to-end example: a GraphQL query served by an Effect service,
        validated against shared contracts, and rendered with React Query.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a pokemon, e.g. pikachu"
            aria-label="Pokemon search"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-700/20"
          />
        </div>
        <Button type="submit" size="lg">
          Look up
        </Button>
      </form>

      {submitted.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Result for “{submitted}”
          </h2>

          {detail.isPending && (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          )}

          {detail.isError && (
            <p className="mt-3 text-sm text-rose-600">
              {messageFor(detail.error)}
            </p>
          )}

          {detail.data && (
            <div className="mt-4 flex items-center gap-4">
              {detail.data.spriteUrl ? (
                <img
                  src={detail.data.spriteUrl}
                  alt={detail.data.name}
                  className="h-20 w-20"
                />
              ) : null}
              <div>
                <p className="text-base font-semibold capitalize text-slate-900">
                  {detail.data.name}
                </p>
                <p className="text-xs text-slate-500">
                  #{detail.data.id} · height {detail.data.height} · weight{' '}
                  {detail.data.weight}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.data.types.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-accent-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Pokedex
            {list.data ? (
              <span className="ml-2 font-normal text-slate-400">
                ({list.data.count})
              </span>
            ) : null}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoBack}
              onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGoForward}
              onClick={() => setOffset((value) => value + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>

        {list.isPending && (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        )}

        {list.isError && (
          <p className="mt-3 text-sm text-rose-600">
            {messageFor(list.error)}
          </p>
        )}

        {list.data && list.data.items.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No results found.</p>
        )}

        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {list.data?.items.map((item) => (
            <li
              key={item.name}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize text-slate-700"
            >
              {item.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default PokemonPage;
