"use client"

import { useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react"
import type { TranslationSchema } from "@/i18n"
import { Button } from "@/components/atom"
import { useAppForm } from "@/lib/form"
import { signIn } from "@/lib/auth"
import { createSignInSchema } from "@/lib/validations/sign-in"

type SignInFormProps = {
  translations: TranslationSchema["signIn"]
  redirectTo?: string
}

function SignInForm({ translations: t, redirectTo }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const schema = useMemo(() => createSignInSchema(t), [t])

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const result = await signIn(value.email, value.password)
        if (!result.ok) {
          setError(
            result.status === 401 ? t.invalidCredentials : t.signInError,
          )
          return
        }
        await navigate({ to: redirectTo ?? "/" })
      } catch {
        setError(t.signInError)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
      noValidate
    >
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{t.signInFailed}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={
              <>
                {t.email}{" "}
                <span className="text-rose-400 font-normal">{t.required}</span>
              </>
            }
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            leadingIcon={<Mail className="h-4 w-4" />}
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={
              <>
                {t.password}{" "}
                <span className="text-rose-400 font-normal">{t.required}</span>
              </>
            }
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t.password}
            leadingIcon={<Lock className="h-4 w-4" />}
            trailing={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600"
                aria-label={t.togglePassword}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            }
          />
        )}
      </form.AppField>

      <div className="pt-2">
        <form.AppForm>
          <form.SubmitButton
            label={t.signIn}
            loadingLabel={t.signingIn}
            icon={<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />}
            className="group w-full justify-center gap-2 rounded-xl bg-accent-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 disabled:opacity-60"
          />
        </form.AppForm>
      </div>
    </form>
  )
}

export { SignInForm }
