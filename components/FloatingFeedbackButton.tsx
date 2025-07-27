"use client";
import React, { useState } from 'react';
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { feedbackService, FeedbackSubmission } from '../services/feedbackService';

interface FloatingFeedbackButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingFeedbackButton: React.FC<FloatingFeedbackButtonProps> = ({ 
  position = 'bottom-right' 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<Partial<FeedbackSubmission>>({
    type: 'general',
    rating: 5,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.message?.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const submission: FeedbackSubmission = {
      type: feedback.type as FeedbackSubmission['type'],
      rating: feedback.rating,
      message: feedback.message,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const success = await feedbackService.submitFeedback(submission);
    
    setIsSubmitting(false);
    setSubmitStatus(success ? 'success' : 'error');

    if (success) {
      // Reset form and close modal after delay
      setTimeout(() => {
        setFeedback({ type: 'general', rating: 5, message: '' });
        setShowModal(false);
        setSubmitStatus(null);
      }, 2000);
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1050,
      borderRadius: '50px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: 'none',
      padding: '12px 20px',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'all 0.3s ease'
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '30px', right: '30px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '30px', left: '30px' };
      case 'top-right':
        return { ...baseStyles, top: '100px', right: '30px' };
      case 'top-left':
        return { ...baseStyles, top: '100px', left: '30px' };
      default:
        return { ...baseStyles, bottom: '30px', right: '30px' };
    }
  };

  return (
    <>
      <Button
        variant="primary"
        style={getPositionStyles()}
        onClick={() => setShowModal(true)}
        className="feedback-float-btn"
        title="Donner votre avis"
      >
        💬 Votre Avis
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            💬 Votre avis nous intéresse
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {submitStatus === 'success' && (
              <Alert variant="success">
                <i className="fas fa-check-circle me-2"></i>
                Merci pour votre retour ! Votre avis a été envoyé avec succès.
              </Alert>
            )}
            
            {submitStatus === 'error' && (
              <Alert variant="danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                Erreur lors de l'envoi. Veuillez réessayer.
              </Alert>
            )}

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Type de retour</Form.Label>
                <Form.Select
                  value={feedback.type}
                  onChange={(e) => setFeedback({ ...feedback, type: e.target.value as FeedbackSubmission['type'] })}
                >
                  <option value="general">Commentaire général</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="feature">Suggérer une fonctionnalité</option>
                  <option value="improvement">Amélioration</option>
                </Form.Select>
              </Col>
              
              <Col md={6}>
                <Form.Label>Note (1-5 étoiles)</Form.Label>
                <div className="d-flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="link"
                      className="p-0"
                      style={{
                        fontSize: '1.5rem',
                        color: star <= (feedback.rating || 0) ? '#ffc107' : '#dee2e6',
                        textDecoration: 'none'
                      }}
                      onClick={() => setFeedback({ ...feedback, rating: star })}
                      type="button"
                    >
                      ⭐
                    </Button>
                  ))}
                </div>
                <small className="text-muted">Note: {feedback.rating}/5</small>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Votre message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Décrivez votre expérience, signalez un problème ou suggérez une amélioration..."
                value={feedback.message}
                onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                required
              />
            </Form.Group>

            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Votre retour est anonyme et nous aide à améliorer l'application.
            </small>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting || !feedback.message?.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Envoi...</span>
                  </div>
                  Envoi...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Envoyer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx>{`
        .feedback-float-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </>
  );
};

export default FloatingFeedbackButton;
