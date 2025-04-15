import { en } from './en.js';
import { es } from './es.js';
import type { TranslationSet } from '~/types/translations.js';

// Define available languages
export type LanguageCode = 'en' | 'es';

// Combine all translations into one object, keyed by language code
export const translations: Record<LanguageCode, TranslationSet> = {
    en,
    es,
};

// Helper function to get translations for a specific language
export function getTranslations(lang: LanguageCode = 'en'): TranslationSet {
    return translations[lang] || translations.en;
}
