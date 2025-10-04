"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, Container, Row, Col } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";

export default function GeneratePage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ProtectedPage>
      <Container className="py-5" style={{ maxWidth: 900 }}>
        {/* Enhanced Main Title */}
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3" style={{ 
            color: '#2c3e50',
            fontSize: '2.5rem',
            letterSpacing: '-0.5px'
          }}>
            <i className="bi bi-pen-fill me-3" style={{ color: '#3498db' }}></i>
            {t('generate.title')}
          </h1>
          <p className="text-muted fs-5 mb-0" style={{ maxWidth: 600, margin: '0 auto' }}>
            Sélectionnez la matière pour laquelle vous souhaitez générer des exercices
          </p>
        </div>
        
        <Row className="g-4 justify-content-center">
          {/* French Card */}
          <Col md={6} lg={5}>
            <Card 
              className="h-100 shadow-sm border-0 overflow-hidden"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '16px'
              }}
              onClick={() => router.push("/generate/french")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(52, 152, 219, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}
              >
                <i className="bi bi-book-fill" style={{ 
                  fontSize: '3.5rem',
                  color: 'white',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                }}></i>
              </div>
              <Card.Body className="text-center p-4">
                <Card.Title className="fw-bold mb-3" style={{ 
                  fontSize: '1.5rem',
                  color: '#2c3e50'
                }}>
                  {t('generate.french')}
                </Card.Title>
                <Card.Text className="text-muted mb-3" style={{ fontSize: '0.95rem' }}>
                  Grammaire, conjugaison, orthographe, vocabulaire et lecture
                </Card.Text>
                <div className="d-flex justify-content-center align-items-center gap-2 text-primary" style={{ fontSize: '0.9rem' }}>
                  <span className="fw-semibold">Commencer</span>
                  <i className="bi bi-arrow-right-circle-fill"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Math Card */}
          <Col md={6} lg={5}>
            <Card 
              className="h-100 shadow-sm border-0 overflow-hidden"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '16px'
              }}
              onClick={() => router.push("/generate/math")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(241, 196, 15, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}
              >
                <i className="bi bi-calculator-fill" style={{ 
                  fontSize: '3.5rem',
                  color: 'white',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                }}></i>
              </div>
              <Card.Body className="text-center p-4">
                <Card.Title className="fw-bold mb-3" style={{ 
                  fontSize: '1.5rem',
                  color: '#2c3e50'
                }}>
                  {t('generate.math')}
                </Card.Title>
                <Card.Text className="text-muted mb-3" style={{ fontSize: '0.95rem' }}>
                  Nombres, calculs, géométrie, grandeurs et mesures
                </Card.Text>
                <div className="d-flex justify-content-center align-items-center gap-2 text-primary" style={{ fontSize: '0.9rem' }}>
                  <span className="fw-semibold">Commencer</span>
                  <i className="bi bi-arrow-right-circle-fill"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedPage>
  );
}
