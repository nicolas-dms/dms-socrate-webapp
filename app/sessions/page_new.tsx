"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";

export default function SessionsPage() {
  const { t } = useTranslation();

  return (
    <ProtectedPage>
      <Container className="py-4">
        <Row>
          <Col>
            <h1 className="text-center mb-4">{t('sessions.title', 'Mes fiches générées')}</h1>
            
            <Card>
              <Card.Body className="text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-clock-history" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                </div>
                <h3 className="text-muted mb-3">Historique des fiches</h3>
                <Alert variant="info">
                  <p className="mb-0">
                    <strong>Fonctionnalité en développement</strong>
                  </p>
                  <p className="mb-0">
                    L'historique de vos fiches générées sera bientôt disponible. Pour le moment, vous pouvez télécharger vos fiches directement après leur génération.
                  </p>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedPage>
  );
}
