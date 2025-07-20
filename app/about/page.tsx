"use client";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  
  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t('about')}</h2>
      <p>{t('pages.about')}</p>
    </div>
  );
}
