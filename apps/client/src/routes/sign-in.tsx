import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { SupportedLanguage } from "@/i18n"
import { getTranslation } from "@/i18n"
import { SignInForm, BrandPanel } from "@/components/organisms"
import { LanguageToggle } from "@/components/molecules"

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SignIn,
})

function SignIn() {
  const { redirect } = Route.useSearch()
  const [language, setLanguage] = useState<SupportedLanguage>("en")
  const t = getTranslation(language)

  return (
    <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
      <BrandPanel variant="desktop" language={language} />
      <BrandPanel variant="mobile" language={language} />

      <main className="flex flex-1 flex-col px-5 py-6 md:items-center md:justify-center md:p-10 lg:p-14">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center md:flex-none">
          <div className="mb-4 flex justify-end">
            <LanguageToggle language={language} onLanguageChange={setLanguage} />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {t.signIn.welcomeBack}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t.signIn.welcomeSubtitle}
            </p>
          </div>

          <SignInForm translations={t.signIn} redirectTo={redirect} />

          <footer className="mt-8 text-center md:mt-6">
            <p className="text-xs text-slate-600">
              {t.signIn.needAccount}{" "}
              <a href="#" className="font-semibold text-accent-700 hover:underline">
                {t.signIn.contactSupport}
              </a>
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
