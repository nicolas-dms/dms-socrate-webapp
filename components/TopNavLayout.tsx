"use client";
import '../i18n/i18n';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, Nav, Navbar, Button, Modal, Form, Row, Col, Alert } from "react-bootstrap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { feedbackService, FeedbackSubmission } from "../services/feedbackService";

export default function TopNavLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState<Partial<FeedbackSubmission>>({
    type: 'general',
    rating: 5,
    message: ''
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  // Always show navigation now
  const isHomePage = pathname === '/';

  // Debug effect for tracking feedback state changes
  useEffect(() => {
    console.log('Feedback state changed:', feedback);
  }, [feedback]);

  useEffect(() => {
    console.log('Hovered rating changed:', hoveredRating);
  }, [hoveredRating]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
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
        setShowFeedbackModal(false);
        setSubmitStatus(null);
      }, 2000);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navigation Bar */}
      <Navbar bg="light" expand="lg" className="border-bottom" style={{ background: '#f8f6f1' }}>
        <Container>
          {/* Logo */}
          <Navbar.Brand as={Link} href="/" className="d-flex align-items-center">
            <Image
              src="/pen-icon.svg"
              alt="ExoMinutes"
              width={32}
              height={32}
              className="me-2"
            />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50' }}>
              ExoMinutes
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center">
              {user ? (
                <>
                  {/* Authenticated Menu Items */}
                  <Nav.Link as={Link} href="/generate" className="d-flex align-items-center mx-2">
                    <Image src="/pen-icon.svg" alt="" width={18} height={18} className="me-1" />
                    Générer
                  </Nav.Link>

                  <Nav.Link as={Link} href="/sessions" className="d-flex align-items-center mx-2">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Mes fiches
                  </Nav.Link>

                  {/* Feedback Link */}
                  <Nav.Link 
                    href="#" 
                    className="d-flex align-items-center mx-2 text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      // Reset feedback state when opening modal
                      setFeedback({ type: 'general', rating: 5, message: '' });
                      setSubmitStatus(null);
                      setShowFeedbackModal(true);
                    }}
                    title="Donner votre avis"
                  >
                    💬 Votre Avis
                  </Nav.Link>

                  {/* Account Button with User Email */}
                  <Nav.Link as={Link} href="/account" className="d-flex align-items-center mx-2 account-link">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 714 4v2"/>
                    </svg>
                    <div className="d-flex flex-column align-items-start">
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Mon compte</span>
                      <small className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                        {user?.email}
                      </small>
                    </div>
                  </Nav.Link>
                </>
              ) : (
                <>
                  {/* Non-authenticated Menu Items - Show on all pages */}
                  <Nav.Link as={Link} href="/login" className="mx-2">
                    Connexion
                  </Nav.Link>
                  <Link href="/generate" className="ms-2">
                    <Button variant="primary">
                      Essayez gratuitement
                    </Button>
                  </Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>

      {/* Feedback Modal */}
      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            💬 Votre avis nous intéresse
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleFeedbackSubmit}>
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
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = hoveredRating !== null ? hoveredRating : (feedback.rating || 0);
                    const isActive = star <= currentRating;
                    
                    return (
                      <Button
                        key={star}
                        variant="link"
                        className="p-0 star-rating-btn"
                        style={{
                          fontSize: '1.5rem',
                          color: isActive ? '#ffc107' : '#dee2e6',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={() => {
                          console.log('Mouse enter star:', star);
                          setHoveredRating(star);
                        }}
                        onMouseLeave={() => {
                          console.log('Mouse leave star:', star);
                          setHoveredRating(null);
                        }}
                        onClick={() => {
                          console.log('Star clicked:', star, 'Previous rating:', feedback.rating);
                          const newFeedback = { ...feedback, rating: star };
                          setFeedback(newFeedback);
                          console.log('New feedback:', newFeedback);
                        }}
                        type="button"
                        title={`${star} étoile${star > 1 ? 's' : ''}`}
                      >
                        ⭐
                      </Button>
                    );
                  })}
                </div>
                <small className="text-muted">
                  Note: {feedback.rating || 0}/5
                  {process.env.NODE_ENV === 'development' && (
                    <span className="ms-2 text-info">
                      (Debug: rating={feedback.rating}, hovered={hoveredRating})
                    </span>
                  )}
                </small>
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
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setHoveredRating(null);
                setShowFeedbackModal(false);
              }}
            >
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
    </div>
  );
}
