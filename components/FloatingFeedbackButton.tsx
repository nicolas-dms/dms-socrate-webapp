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
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
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
        setHoveredRating(null);
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
        onClick={() => {
          setFeedback({ type: 'general', rating: 5, message: '' });
          setHoveredRating(null);
          setSubmitStatus(null);
          setShowModal(true);
        }}
        className="feedback-float-btn"
        title="Donner votre avis"
      >
        <i className="bi bi-chat-dots me-2"></i>
        Votre Avis
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', color: '#2c3e50' }}>
            <i className="bi bi-chat-dots me-2" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
            Votre avis nous intéresse
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
                <Form.Label style={{ color: '#2c3e50', fontWeight: '500' }}>Type de retour</Form.Label>
                <Form.Select
                  value={feedback.type}
                  onChange={(e) => setFeedback({ ...feedback, type: e.target.value as FeedbackSubmission['type'] })}
                  style={{ borderColor: '#dee2e6', borderRadius: '8px' }}
                >
                  <option value="general">Commentaire général</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="feature">Suggérer une fonctionnalité</option>
                  <option value="improvement">Amélioration</option>
                </Form.Select>
              </Col>
              
              <Col md={6}>
                <Form.Label style={{ color: '#2c3e50', fontWeight: '500' }}>Note (1-5 étoiles)</Form.Label>
                <div className="d-flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = hoveredRating !== null ? hoveredRating : (feedback.rating || 0);
                    const isActive = star <= currentRating;
                    
                    return (
                      <Button
                        key={star}
                        variant="link"
                        className="p-0"
                        style={{
                          fontSize: '1.8rem',
                          color: isActive ? '#ffc107' : '#dee2e6',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                          textShadow: isActive ? '0 2px 4px rgba(255, 193, 7, 0.3)' : 'none',
                          filter: isActive ? 'none' : 'grayscale(1) brightness(1.5)'
                        }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => setFeedback({ ...feedback, rating: star })}
                        type="button"
                        title={`${star} étoile${star > 1 ? 's' : ''}`}
                      >
                        ⭐
                      </Button>
                    );
                  })}
                </div>
                <small className="text-muted">Note: {feedback.rating || 0}/5</small>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#2c3e50', fontWeight: '500' }}>Votre message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Décrivez votre expérience, signalez un problème ou suggérez une amélioration..."
                value={feedback.message}
                onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                required
                style={{ borderColor: '#dee2e6', borderRadius: '8px' }}
              />
            </Form.Group>

            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Votre retour est anonyme et nous aide à améliorer l'application.
            </small>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: 'none', paddingTop: '0' }}>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setHoveredRating(null);
                setShowModal(false);
              }}
              style={{ borderRadius: '8px' }}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !feedback.message?.trim()}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '8px 20px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && feedback.message?.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
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
                  <i className="bi bi-send me-2"></i>
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
