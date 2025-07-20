"use client";
import { useTranslation } from "react-i18next";
import ProtectedPage from "../../components/ProtectedPage";

export default function Settings() {
  const { t } = useTranslation();
  
  return (
    <ProtectedPage>
      <div className="container mt-5">
        <h2 className="mb-4">{t('settings')}</h2>
        <p>{t('pages.settings')}</p>
      </div>
    </ProtectedPage>
  );
}
