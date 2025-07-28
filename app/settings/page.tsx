"use client";
import { useTranslation } from "react-i18next";
import ProtectedPage from "../../components/ProtectedPage";

export default function Settings() {
  const { t } = useTranslation();
  
  return (
    <ProtectedPage>
      <div className="container mt-3">
        {/* Enhanced Main Title */}
        <div className="text-center mb-4">
          <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
            <i className="bi bi-gear me-2"></i>
            {t('settings')}
          </h2>
          <hr className="w-25 mx-auto mt-3 mb-4" style={{ height: '2px', background: 'linear-gradient(90deg, #6c757d, #adb5bd)', border: 'none', borderRadius: '1px' }} />
        </div>
        <p>{t('pages.settings')}</p>
      </div>
    </ProtectedPage>
  );
}
