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
    const userStr = localStorage.getItem('user');
    console.log(`📖 Retrieved user from localStorage:`, userStr ? 'exists' : 'empty');
    
    if (!userStr) {
      console.log(`ℹ️ No user in localStorage, using default language: en`);
      return 'en';
    }
    
    const user = JSON.parse(userStr);
    const language = user?.language || 'en';
    console.log(`🌐 Detected user language: ${language}`);
    
    if (!['en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja'].includes(language)) {
      console.warn(`⚠️ Invalid language "${language}", using default: en`);
      return 'en';
    }
    
    return language;
  } catch (e) {
    console.error(`❌ Error parsing user from localStorage:`, e.message);
    return 'en';
  }
};

const initialLanguage = getUserLanguage();

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch(err => console.error('❌ Error initializing i18next:', err));

console.log(`✅ i18next initialized with language: ${initialLanguage}`);

export default i18next;
