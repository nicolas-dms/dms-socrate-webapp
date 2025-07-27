"use client";
import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { ExerciseSession } from '../services/exerciseService';

interface PDFViewerModalProps {
  show: boolean;
  onHide: () => void;
  session: ExerciseSession | null;
}

export default function PDFViewerModal({ show, onHide, session }: PDFViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Erreur lors du chargement du PDF');
  };

  const handlePrint = () => {
    if (session?.pdf_url) {
      // Open PDF in new window for printing
      const printWindow = window.open(session.pdf_url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownload = () => {
    if (session?.pdf_url) {
      const link = document.createElement('a');
      link.href = session.pdf_url;
      link.download = `session-${session.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetState = () => {
    setLoading(true);
    setError(null);
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl"
      centered
      onShow={resetState}
      className="pdf-modal"
      style={{ zIndex: 9999 }}
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          📄 Aperçu de la fiche d'exercices
          {session && (
            <small className="text-muted ms-2">
              {session.subject === 'french' ? 'Français' : 'Math'} - {session.level} - {session.duration}
            </small>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ height: '80vh' }}>
        {session?.pdf_url ? (
          <div className="position-relative h-100">
            {loading && (
              <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
                <div className="text-center">
                  <Spinner animation="border" role="status" className="mb-2" />
                  <div>Chargement du PDF...</div>
                </div>
              </div>
            )}
            
            {error ? (
              <Alert variant="danger" className="m-3">
                <Alert.Heading>Erreur</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={resetState}>
                  Réessayer
                </Button>
              </Alert>
            ) : (
              <iframe
                src={session.pdf_url}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                onLoad={handleLoad}
                onError={handleError}
                title={`PDF Session ${session.id}`}
              />
            )}
          </div>
        ) : (
          <Alert variant="warning" className="m-3">
            Aucun PDF disponible pour cette session.
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            {session?.pdf_url && !error && (
              <>
                <Button 
                  variant="outline-primary" 
                  onClick={handlePrint}
                  className="me-2"
                  disabled={loading}
                >
                  🖨️ Imprimer
                </Button>
                <Button 
                  variant="outline-success" 
                  onClick={handleDownload}
                  disabled={loading}
                >
                  ⬇️ Télécharger
                </Button>
              </>
            )}
          </div>
          <Button variant="secondary" onClick={onHide}>
            Fermer
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
