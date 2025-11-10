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
              src="/ExoMinutesIncon.png"
              alt="ExoMinute"
              width={60}
              height={60}
              className="me-2"
            />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', letterSpacing: '-0.5px' }}>
              ExoMinute
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center">
              {user ? (
                <>
                  {/* Authenticated Menu Items */}
                  <Nav.Link as={Link} href="/generate" className="d-flex align-items-center mx-2">
                    <i className="bi bi-pencil-square me-2" style={{ fontSize: '1rem' }}></i>
                    Générer
                  </Nav.Link>

                  <Nav.Link as={Link} href="/sessions" className="d-flex align-items-center mx-2">
                    <i className="bi bi-folder2-open me-2" style={{ fontSize: '1rem' }}></i>
                    Mes fiches
                  </Nav.Link>

                  {/* Feedback Link */}
                  <Nav.Link 
                    href="#" 
                    className="d-flex align-items-center mx-2"
                    onClick={(e) => {
                      e.preventDefault();
                      // Reset feedback state when opening modal
                      setFeedback({ type: 'general', rating: 5, message: '' });
                      setSubmitStatus(null);
                      setShowFeedbackModal(true);
                    }}
                    title="Donner votre avis"
                  >
                    <i className="bi bi-chat-dots me-2" style={{ fontSize: '1rem' }}></i>
                    Votre Avis
                  </Nav.Link>

                  {/* Account Button with User Email */}
                  <Nav.Link as={Link} href="/account" className="d-flex align-items-center mx-2 account-link">
                    <i className="bi bi-person-circle me-2" style={{ fontSize: '1rem' }}></i>
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
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', color: '#2c3e50' }}>
            <i className="bi bi-chat-dots me-2" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
            Votre avis nous intéresse
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
                setShowFeedbackModal(false);
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
    </div>
  );
}
