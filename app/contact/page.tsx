"use client";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  
  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t('contact')}</h2>
      <p>{t('pages.contact')}</p>
    </div>
  );
}
