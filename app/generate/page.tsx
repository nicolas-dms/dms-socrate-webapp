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
      <div className="container mt-5" style={{ maxWidth: 500 }}>
        <h2 className="mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-pen"></i>
          {t('generate.title')}
        </h2>
        <div className="d-flex flex-column gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/generate/math")}
          >
            {t('generate.math')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/generate/french")}
          >
            {t('generate.french')}
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
