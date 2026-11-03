import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('hi') ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const isHindi = i18n.language.startsWith('hi');

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 shadow-sm"
      title="Switch Language / भाषा बदलें"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-amber-600" />
      <span>{isHindi ? 'English' : 'हिंदी'}</span>
    </button>
  );
};

