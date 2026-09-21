import type { SupportedLanguage } from "@/i18n"
import { cn } from "cn"
import { Button } from "@/components/atom"

export type LanguageToggleProps = {
  language: SupportedLanguage
  onLanguageChange: (lang: SupportedLanguage) => void
  className?: string
}

function LanguageToggle({ language, onLanguageChange, className }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn(
        "inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-xs",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onLanguageChange("en")}
        aria-pressed={language === "en"}
        className={cn(
          "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
          language === "en"
            ? "bg-white text-accent-700 shadow-xs"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        EN
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onLanguageChange("km")}
        aria-pressed={language === "km"}
        className={cn(
          "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
          language === "km"
            ? "bg-white text-accent-700 shadow-xs"
            : "text-slate-500 hover:text-slate-800"
        )}
      >
        ខ្មែរ
      </Button>
    </div>
  )
}

export { LanguageToggle }
