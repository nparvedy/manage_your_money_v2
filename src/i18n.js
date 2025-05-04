import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import th from './locales/th.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  th: { translation: th },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

export default i18n;
