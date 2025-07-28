"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import ProtectedPage from "../../components/ProtectedPage";

export default function GeneratePage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ProtectedPage>
      <div className="container mt-3" style={{ maxWidth: 600 }}>
        {/* Enhanced Main Title */}
        <div className="text-center mb-4">
          <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
            <i className="bi bi-pen me-2"></i>
            {t('generate.title')}
          </h2>
          <hr className="w-25 mx-auto mt-3 mb-4" style={{ height: '2px', background: 'linear-gradient(90deg, #6c757d, #adb5bd)', border: 'none', borderRadius: '1px' }} />
        </div>
        
        <div className="d-flex flex-column gap-3">
            <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/generate/french")}
          >
            {t('generate.french')}
          </Button>          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/generate/math")} 
            disabled
            className="position-relative"
          >
            {t('generate.math')}
            <small className="d-block text-muted" style={{ fontSize: '0.8rem' }}>
              Bientôt disponible
            </small>
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
