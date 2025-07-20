import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

// Get saved language preference or default to French
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredLanguage') || 'fr';
  }
  return 'fr';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    // React settings
    react: {
      useSuspense: false,
    },
  });

export default i18n;
