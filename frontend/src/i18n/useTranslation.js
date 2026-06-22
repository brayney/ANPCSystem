import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = useCallback((lang) => {
    if (lang && i18n) {
      console.log(`🌐 Changing language to: ${lang}`);
      return i18n.changeLanguage(lang).catch(err => {
        console.error('❌ Error changing language:', err);
      });
    }
  }, [i18n]);
  
  return { t, changeLanguage, currentLanguage: i18n?.language || 'en' };
};

export default useTranslation;
