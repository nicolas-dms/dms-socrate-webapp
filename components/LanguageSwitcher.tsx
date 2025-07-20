"use client";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Persist language preference in localStorage
    localStorage.setItem('preferredLanguage', lng);
  };  return (
    <div className="d-flex gap-2 justify-content-center language-switcher">
      <button
        onClick={() => changeLanguage('fr')}
        className={`btn btn-sm p-1 ${i18n.language === 'fr' ? 'btn-light' : 'btn-outline-light'}`}
        style={{ 
          fontSize: '20px', 
          lineHeight: 1,
          minWidth: '32px',
          minHeight: '32px',
          border: i18n.language === 'fr' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.5)'
        }}
        title="Français"
      >
        🇫🇷
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`btn btn-sm p-1 ${i18n.language === 'en' ? 'btn-light' : 'btn-outline-light'}`}
        style={{ 
          fontSize: '20px', 
          lineHeight: 1,
          minWidth: '32px',
          minHeight: '32px',
          border: i18n.language === 'en' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.5)'
        }}
        title="English"
      >
        🇺🇸
      </button>
    </div>
  );
}
