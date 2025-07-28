"use client";
import { useState } from 'react';
import { Card, Badge, ProgressBar, Button, Modal, ListGroup, Alert } from 'react-bootstrap';
import { Parcours, ParcoursSession } from '../services/parcoursService';

interface ParcoursStatusCardProps {
  parcours: Parcours;
  onDownloadZip?: (parcoursId: string) => void;
  onViewDetails?: (parcoursId: string) => void;
  onCancel?: (parcoursId: string) => void;
}

export default function ParcoursStatusCard({
  parcours,
  onDownloadZip,
  onViewDetails,
  onCancel
}: ParcoursStatusCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = () => {
    switch (parcours.status) {
      case 'completed':
        return <Badge bg="success">Terminé</Badge>;
      case 'generating':
        return <Badge bg="primary">En cours</Badge>;
      case 'pending':
        return <Badge bg="warning">En attente</Badge>;
      case 'failed':
        return <Badge bg="danger">Échec</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  const getProgressVariant = () => {
    switch (parcours.status) {
      case 'completed':
        return 'success';
      case 'generating':
        return 'primary';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedCompletion = () => {
    if (!parcours.estimated_completion) return null;
    
    const completion = new Date(parcours.estimated_completion);
    const now = new Date();
    const diffMinutes = Math.ceil((completion.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) {
      return "Bientôt terminé";
    } else if (diffMinutes < 60) {
      return `Environ ${diffMinutes} min restantes`;
    } else {
      const hours = Math.ceil(diffMinutes / 60);
      return `Environ ${hours}h restantes`;
    }
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <Card.Title className="mb-1">
                <i className="bi bi-collection me-2"></i>
                {parcours.name}
              </Card.Title>
              <div className="d-flex gap-2 align-items-center">
                {getStatusBadge()}
                <Badge bg="secondary">{parcours.level}</Badge>
                <small className="text-muted">
                  Créé le {formatDate(parcours.created_at)}
                </small>
              </div>
            </div>
            <div className="text-end">
              <div className="fw-bold text-primary fs-5">
                {parcours.progress.completed}/{parcours.progress.total}
              </div>
              <small className="text-muted">fiches</small>
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small>Progression</small>
              <small>{parcours.progress.percentage}%</small>
            </div>
            <ProgressBar 
              variant={getProgressVariant()}
              now={parcours.progress.percentage}
              animated={parcours.status === 'generating'}
            />
          </div>

          <div className="row text-center mb-3">
            <div className="col">
              <div className="fw-bold">{parcours.totalWeeks}</div>
              <small className="text-muted">semaines</small>
            </div>
            <div className="col">
              <div className="fw-bold">{parcours.fichesPerWeek}</div>
              <small className="text-muted">fiches/sem.</small>
            </div>
            <div className="col">
              <div className="fw-bold">{parcours.totalFiches}</div>
              <small className="text-muted">total</small>
            </div>
          </div>

          {parcours.status === 'generating' && parcours.estimated_completion && (
            <Alert variant="info" className="small mb-3">
              <i className="bi bi-clock me-1"></i>
              {getEstimatedCompletion()}
            </Alert>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              <i className="bi bi-eye me-1"></i>
              Voir détails
            </Button>

            {parcours.status === 'completed' && parcours.zip_url && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onDownloadZip?.(parcours.id)}
              >
                <i className="bi bi-download me-1"></i>
                Télécharger ZIP
              </Button>
            )}

            {(parcours.status === 'generating' || parcours.status === 'pending') && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onCancel?.(parcours.id)}
              >
                <i className="bi bi-x-circle me-1"></i>
                Annuler
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-collection me-2"></i>
            {parcours.name} - Détails
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-4">
            <div className="col-md-6">
              <h6>Informations générales</h6>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Niveau:</span>
                  <Badge bg="secondary">{parcours.level}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Matière:</span>
                  <span>{parcours.subject === 'french' ? 'Français' : 'Mathématiques'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Statut:</span>
                  {getStatusBadge()}
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Créé le:</span>
                  <span>{formatDate(parcours.created_at)}</span>
                </ListGroup.Item>
              </ListGroup>
            </div>
            <div className="col-md-6">
              <h6>Progression</h6>
              <div className="text-center p-3 bg-light rounded">
                <div className="display-6 fw-bold text-primary">
                  {parcours.progress.percentage}%
                </div>
                <div className="text-muted">
                  {parcours.progress.completed} sur {parcours.progress.total} fiches
                </div>
                <ProgressBar 
                  variant={getProgressVariant()}
                  now={parcours.progress.percentage}
                  className="mt-2"
                  animated={parcours.status === 'generating'}
                />
              </div>
            </div>
          </div>

          {parcours.sessions.length > 0 && (
            <div>
              <h6>Détail des fiches</h6>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ListGroup>
                  {parcours.sessions.map((session: ParcoursSession) => (
                    <ListGroup.Item
                      key={session.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold">{session.title}</div>
                        <small className="text-muted">{session.theme}</small>
                      </div>
                      <div className="text-end">
                        <Badge 
                          bg={session.status === 'completed' ? 'success' : 
                              session.status === 'generating' ? 'primary' : 
                              session.status === 'failed' ? 'danger' : 'secondary'}
                        >
                          {session.status === 'completed' ? 'Terminé' :
                           session.status === 'generating' ? 'En cours' :
                           session.status === 'failed' ? 'Échec' : 'En attente'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Fermer
          </Button>
          {parcours.status === 'completed' && parcours.zip_url && (
            <Button
              variant="success"
              onClick={() => {
                onDownloadZip?.(parcours.id);
                setShowDetails(false);
              }}
            >
              <i className="bi bi-download me-1"></i>
              Télécharger ZIP
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
