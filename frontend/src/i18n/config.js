import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import ptTranslations from './locales/pt.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';
import jaTranslations from './locales/ja.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  pt: { translation: ptTranslations },
  ar: { translation: arTranslations },
  zh: { translation: zhTranslations },
  ja: { translation: jaTranslations },
};

// Get user's language from localStorage or default to 'en'
const getUserLanguage = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.language || 'en';
  } catch (e) {
    return 'en';
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: getUserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
