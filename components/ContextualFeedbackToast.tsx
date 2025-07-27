"use client";
import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer, Button } from 'react-bootstrap';
import { feedbackService, ContextualFeedback } from '../services/feedbackService';

interface ContextualFeedbackProps {
  context: string;
  action: string;
  trigger?: boolean; // When true, shows the feedback toast
  onComplete?: () => void;
}

const ContextualFeedbackToast: React.FC<ContextualFeedbackProps> = ({
  context,
  action,
  trigger = false,
  onComplete
}) => {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Show feedback toast after a short delay
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const handleRatingSubmit = async (selectedRating: number) => {
    setRating(selectedRating);
    setIsSubmitting(true);

    const feedback: ContextualFeedback = {
      context,
      action,
      rating: selectedRating,
      page: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    await feedbackService.submitContextualFeedback(feedback);
    
    setIsSubmitting(false);
    
    // Auto-hide after rating submission
    setTimeout(() => {
      setShow(false);
      setRating(null);
      onComplete?.();
    }, 2000);
  };

  const handleClose = () => {
    setShow(false);
    setRating(null);
    setHoveredRating(null);
    onComplete?.();
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
      <Toast show={show} onClose={handleClose} autohide={false}>
        <Toast.Header>
          <strong className="me-auto">
            {rating ? '✅ Merci !' : '💡 Comment s\'est passée cette action ?'}
          </strong>
        </Toast.Header>
        <Toast.Body>
          {rating ? (
            <div className="text-center">
              <div className="mb-2">
                Votre avis a été pris en compte ({rating}/5 ⭐)
              </div>
              <small className="text-muted">
                Merci de nous aider à améliorer l'expérience !
              </small>
            </div>
          ) : isSubmitting ? (
            <div className="text-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Envoi...</span>
              </div>
              Envoi en cours...
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-3">
                <small className="text-muted">
                  Évaluez rapidement cette fonctionnalité :
                </small>
              </div>
              <div className="d-flex justify-content-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentRating = hoveredRating !== null ? hoveredRating : 0;
                  return (
                    <Button
                      key={star}
                      variant="link"
                      className="p-1"
                      style={{
                        fontSize: '1.3rem',
                        color: star <= currentRating ? '#ffc107' : '#dee2e6',
                        textDecoration: 'none',
                        lineHeight: 1,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      onClick={() => handleRatingSubmit(star)}
                      title={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                      ⭐
                    </Button>
                  );
                })}
              </div>
              <small className="text-muted d-block mt-2">
                Cliquez sur une étoile pour noter
              </small>
            </div>
          )}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ContextualFeedbackToast;
