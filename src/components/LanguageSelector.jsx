import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex items-center gap-1">
      <select
        className="border rounded px-2 py-1 text-sm bg-white cursor-pointer"
        value={current}
        onChange={e => i18n.changeLanguage(e.target.value)}
        aria-label={t('select_language')}
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
