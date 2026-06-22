import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';
import i18next from './config';

export const useTranslation = () => {
  const { t } = useI18nTranslation();
  
  const changeLanguage = useCallback((lang) => {
    i18next.changeLanguage(lang);
  }, []);
  
  return { t, changeLanguage, currentLanguage: i18next.language };
};

export default useTranslation;
