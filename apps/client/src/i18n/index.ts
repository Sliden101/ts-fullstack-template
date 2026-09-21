import { en, type TranslationSchema } from './locales/en';
import { km } from './locales/km';
import type { SidebarLanguage } from '@/types/sidebar';

export type SupportedLanguage = SidebarLanguage;

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  en,
  km,
};

/**
 * Returns the dictionary for the specified language.
 */
export function getTranslation(
  lang: SupportedLanguage = 'en',
): TranslationSchema {
  return translations[lang] ?? translations.en;
}

/**
 * Returns a translated string via a type-safe selector function.
 * Example: t('en', (d) => d.common.save) -> "Save"
 */
export function t(
  lang: SupportedLanguage,
  selector: (dict: TranslationSchema) => string,
): string {
  return selector(getTranslation(lang));
}

export { en, km, type TranslationSchema };
