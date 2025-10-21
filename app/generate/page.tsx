"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";

export default function GeneratePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isNewUser } = useAuth();

  return (
    <ProtectedPage>
      <Container className="mt-4 mb-5">
        {/* Simple Welcome Message for New Users */}
        {isNewUser && (
          <div className="text-center mb-3">
            <h4 className="fw-normal" style={{ color: '#495057' }}>
              👋 Bienvenue !
            </h4>
          </div>
        )}

        {/* Enhanced Main Title */}
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '2rem' }}>
            <i className="bi bi-pencil-square me-3" style={{ color: '#495057' }}></i>
            {t('generate.title')}
          </h1>
          <p className="text-muted" style={{ fontSize: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            Choisissez la matière pour créer des exercices personnalisés adaptés au niveau de votre enfant
          </p>
        </div>

        {/* Subject Cards */}
        <Row className="justify-content-center g-4">
          {/* French Card */}
          <Col lg={5} md={6}>
            <Card 
              className="h-100 border-0 shadow-sm" 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
              onClick={() => router.push("/generate/french")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <Card.Body className="p-4 text-center">
                {/* Icon */}
                <div 
                  className="mb-3 mx-auto"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)'
                  }}
                >
                  <i className="bi bi-book" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>

                {/* Title */}
                <h3 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                  {t('generate.french')}
                </h3>

                {/* Description */}
                <p className="text-muted mb-4" style={{ lineHeight: '1.5', fontSize: '0.95rem' }}>
                  Lecture, grammaire, conjugaison, vocabulaire et orthographe. Exercices adaptés du CP au CM2.
                </p>

                {/* Button */}
                <Button
                  size="lg"
                  className="w-100"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '0.8rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(251, 191, 36, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(251, 191, 36, 0.3)';
                  }}
                >
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Générer des exercices de Français
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Math Card */}
          <Col lg={5} md={6}>
            <Card 
              className="h-100 border-0 shadow-sm" 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0f6ff 100%)',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
              onClick={() => router.push("/generate/math")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <Card.Body className="p-4 text-center">
                {/* Icon */}
                <div 
                  className="mb-3 mx-auto"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #87ceeb, #70b8d6)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(135, 206, 235, 0.3)'
                  }}
                >
                  <i className="bi bi-calculator" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>

                {/* Title */}
                <h3 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                  {t('generate.math')}
                </h3>

                {/* Description */}
                <p className="text-muted mb-4" style={{ lineHeight: '1.5', fontSize: '0.95rem' }}>
                  Nombres, calcul, géométrie, mesures et problèmes. Exercices progressifs du CP au CM2.
                </p>

                {/* Button */}
                <Button
                  size="lg"
                  className="w-100"
                  style={{
                    background: 'linear-gradient(135deg, #87ceeb, #70b8d6)',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '0.8rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(135, 206, 235, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(135, 206, 235, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(135, 206, 235, 0.3)';
                  }}
                >
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Générer des exercices de Maths
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Neutral Instructional Banner for New Users */}
        {isNewUser && (
          <Alert 
            variant="light" 
            className="mt-4 mb-4 border"
            style={{
              backgroundColor: '#f8f9fa',
              borderColor: '#dee2e6',
              borderRadius: '10px',
              borderLeft: '4px solid #6c757d'
            }}
          >
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle me-3" style={{ fontSize: '1.3rem', color: '#6c757d' }}></i>
              <div style={{ flex: 1 }}>
                <h6 className="fw-semibold mb-2" style={{ color: '#495057' }}>
                  Comment créer votre première fiche d'exercices
                </h6>
                <div className="small" style={{ color: '#6c757d', lineHeight: '1.7' }}>
                  <p className="mb-2">
                    <strong>Étape 1 :</strong> Sélectionnez une matière (Français ou Mathématiques) en cliquant sur l'une des cartes ci-dessus.
                  </p>
                  <p className="mb-2">
                    <strong>Étape 2 :</strong> Choisissez le niveau scolaire de votre enfant (CP, CE1, CE2, CM1 ou CM2) et les types d'exercices souhaités.
                  </p>
                  <p className="mb-0">
                    <strong>Étape 3 :</strong> Générez votre fiche personnalisée et téléchargez-la au format PDF pour l'imprimer ou la consulter directement.
                  </p>
                </div>
              </div>
            </div>
          </Alert>
        )}

        {/* Help Section */}
        <div className="text-center mt-5">
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-info-circle me-2"></i>
            Les exercices sont générés instantanément et adaptés au niveau sélectionné
          </p>
        </div>
      </Container>
    </ProtectedPage>
  );
}
