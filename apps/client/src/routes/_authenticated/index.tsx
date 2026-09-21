import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Sidebar } from '@/components/organisms';
import { LanguageToggle } from '@/components/molecules';
import { usePermissions } from '@/lib/permissions';
import type { SupportedLanguage } from '@/i18n';

export const Route = createFileRoute('/_authenticated/')({
  component: Index,
});

function Index() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = usePermissions();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar
        language={language}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className="flex-1 p-6 md:p-8 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back{user?.name ? `, ${user.name}` : ''}.
            </p>
          </div>
          <LanguageToggle language={language} onLanguageChange={setLanguage} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-800">
            Start here
          </h2>
          <p className="mt-1 max-w-prose text-sm text-slate-500">
            This template ships one complete vertical slice — a PokéAPI-backed
            example — that exercises the shared contracts, the GraphQL API, and
            the client data layer end to end.
          </p>
          <Link
            to="/pokemon"
            className="mt-4 inline-flex items-center rounded-xl bg-accent-700 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
          >
            Browse the Pokemon example
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Index;
