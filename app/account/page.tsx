"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ProgressBar, Modal } from "react-bootstrap";
import { useRouter } from 'next/navigation';
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { status, usageView, plans, history, loading, changeTier, changeBillingPeriod, buyAddonPack, cancelSubscription, reactivateSubscription, refreshSubscription } = useSubscription();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("subscription");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Addon pack purchase state
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonQuantity, setAddonQuantity] = useState(1);

  // Cancel/Reactivate confirmation modals
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  // Support form states
  const [supportForm, setSupportForm] = useState({
    type: 'bug',
    priority: 'medium',
    subject: '',
    message: ''
  });
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportMessage, setSupportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === 'admin@exominutes.com';

  // Refresh subscription status when switching to subscription tab or on mount if already on subscription tab
  useEffect(() => {
    if (activeSection === "subscription" && user) {
      console.log("Subscription tab activated, refreshing status...");
      refreshSubscription();
    }
  }, [activeSection, user]); // Removed refreshSubscription from deps to avoid unnecessary re-runs

  const handleLogout = () => {
    logout();
    // Redirect will be handled by the auth context
  };

  const handleTierChange = async (newTier: 'freemium' | 'standard' | 'famille_plus') => {
    if (!status) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      console.log(`Changing tier from ${status.tier} to ${newTier}`);
      const result = await changeTier(newTier);
      console.log('Change tier result:', result);
      
      if (result.success) {
        // Check if this is canceling a pending change (re-selecting current tier)
        if (status.tier === newTier && status.pending_tier) {
          setMessage({
            type: 'success',
            text: `Le changement vers ${getTierDisplayName(status.pending_tier)} a été annulé. Votre abonnement ${getTierDisplayName(newTier)} se renouvellera automatiquement.`
          });
        } else {
          // Determine if upgrade or downgrade based on tier hierarchy
          const tierHierarchy = { 'freemium': 0, 'standard': 1, 'famille_plus': 2 };
          const currentTierLevel = tierHierarchy[status.tier];
          const newTierLevel = tierHierarchy[newTier];
          
          if (newTierLevel > currentTierLevel) {
            // Upgrade - applied immediately
            setMessage({
              type: 'success',
              text: `Félicitations ! Votre plan a été mis à niveau vers ${getTierDisplayName(newTier)}. Vos quotas ont été réinitialisés.`
            });
          } else if (newTierLevel < currentTierLevel) {
            // Downgrade - deferred to renewal_date
            setMessage({
              type: 'success',
              text: `Votre changement de plan vers ${getTierDisplayName(newTier)} est programmé pour le ${formatDate(status.renewal_date)}. Vous conservez votre plan actuel et vos quotas jusqu'à cette date.`
            });
          } else {
            setMessage({
              type: 'success',
              text: result.message
            });
          }
        }
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error: any) {
      console.error('Error changing tier:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBillingPeriodChange = async (newPeriod: 'monthly' | 'yearly') => {
    if (!status) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      await changeBillingPeriod(newPeriod);
      setMessage({
        type: 'success',
        text: 'Période de facturation modifiée avec succès'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyAddonPack = async () => {
    if (!status) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      await buyAddonPack(addonQuantity);
      setMessage({
        type: 'success',
        text: `${addonQuantity} pack${addonQuantity > 1 ? 's' : ''} additionnel${addonQuantity > 1 ? 's' : ''} acheté${addonQuantity > 1 ? 's' : ''} avec succès`
      });
      setShowAddonModal(false);
      setAddonQuantity(1);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelConfirm(false);
    setActionLoading(true);
    setMessage(null);
    
    try {
      const result = await cancelSubscription();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setShowReactivateConfirm(false);
    setActionLoading(true);
    setMessage(null);
    
    try {
      const result = await reactivateSubscription();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!status) return null;
    return plans.find(p => p.tier === status.tier);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'freemium': return 'Gratuit';
      case 'standard': return 'Standard';
      case 'famille_plus': return 'Family+';
      default: return tier;
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      setSupportMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    setSupportSubmitting(true);
    setSupportMessage(null);

    try {
      // Simulate API call to support system
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, this would send to your support system
      console.log('Support ticket submitted:', {
        ...supportForm,
        user: user?.email,
        timestamp: new Date().toISOString()
      });

      setSupportMessage({
        type: 'success',
        text: 'Votre demande de support a été envoyée avec succès. Nous vous répondrons dans les plus brefs délais.'
      });

      // Reset form
      setSupportForm({
        type: 'bug',
        priority: 'medium',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSupportMessage({
        type: 'error',
        text: 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.'
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row>
          <Col lg={10} className="mx-auto">
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ color: '#1e40af' }}>
                <i className="bi bi-person-circle me-2" style={{ color: '#fbbf24' }}></i>
                Mon compte
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Gérez votre profil, abonnement et préférences
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-4">
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <button
                  onClick={() => setActiveSection("profile")}
                  style={{
                    backgroundColor: activeSection === "profile" ? '#eff6ff' : 'white',
                    color: activeSection === "profile" ? '#1e40af' : '#6b7280',
                    border: `2px solid ${activeSection === "profile" ? '#3b82f6' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "profile" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "profile" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "profile" ? '0 4px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "profile") {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "profile") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-person me-1"></i>
                  Profil utilisateur
                </button>
                <button
                  onClick={() => setActiveSection("subscription")}
                  style={{
                    backgroundColor: activeSection === "subscription" ? '#fef3c7' : 'white',
                    color: activeSection === "subscription" ? '#92400e' : '#6b7280',
                    border: `2px solid ${activeSection === "subscription" ? '#fbbf24' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "subscription" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "subscription" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "subscription" ? '0 4px 8px rgba(251, 191, 36, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "subscription") {
                      e.currentTarget.style.backgroundColor = '#fef9e7';
                      e.currentTarget.style.borderColor = '#fcd34d';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "subscription") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-star me-1"></i>
                  Mon abonnement
                </button>
                <button
                  onClick={() => setActiveSection("settings")}
                  style={{
                    backgroundColor: activeSection === "settings" ? '#eff6ff' : 'white',
                    color: activeSection === "settings" ? '#1e40af' : '#6b7280',
                    border: `2px solid ${activeSection === "settings" ? '#3b82f6' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "settings" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "settings" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "settings" ? '0 4px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "settings") {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "settings") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-sliders me-1"></i>
                  Paramètres
                </button>
                <button
                  onClick={() => setActiveSection("support")}
                  style={{
                    backgroundColor: activeSection === "support" ? '#eff6ff' : 'white',
                    color: activeSection === "support" ? '#1e40af' : '#6b7280',
                    border: `2px solid ${activeSection === "support" ? '#3b82f6' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "support" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "support" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "support" ? '0 4px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "support") {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "support") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-headset me-1"></i>
                  Support
                </button>
                {/* Section Admin - uniquement pour admin@exominutes.com */}
                {isAdmin && (
                  <button
                    onClick={() => setActiveSection("admin")}
                    style={{
                      backgroundColor: activeSection === "admin" ? '#f8f9fa' : 'white',
                      color: activeSection === "admin" ? '#2c3e50' : '#6c757d',
                      border: `2px solid ${activeSection === "admin" ? '#dee2e6' : '#e9ecef'}`,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: activeSection === "admin" ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== "admin") {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== "admin") {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }
                    }}
                  >
                    <i className="bi bi-gear me-1"></i>
                    Administration
                  </button>
                )}
                <button
                  onClick={() => setActiveSection("logout")}
                  style={{
                    backgroundColor: activeSection === "logout" ? '#fff5f5' : 'white',
                    color: activeSection === "logout" ? '#dc3545' : '#6c757d',
                    border: `2px solid ${activeSection === "logout" ? '#f8d7da' : '#e9ecef'}`,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "logout" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "logout") {
                      e.currentTarget.style.backgroundColor = '#fff5f5';
                      e.currentTarget.style.borderColor = '#f8d7da';
                      e.currentTarget.style.color = '#dc3545';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "logout") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.color = '#6c757d';
                    }
                  }}
                >
                  Se déconnecter
                </button>
              </div>
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card style={{ 
                border: '2px solid #3b82f6', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#eff6ff',
                  borderBottom: '2px solid #93c5fd',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#1e40af' }}>
                    <i className="bi bi-person me-2" style={{ color: '#3b82f6' }}></i>
                    Profil utilisateur
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={user?.email || ""}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom d'utilisateur</Form.Label>
                        <Form.Control
                          type="text"
                          value={user?.username || ""}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="mt-4">
                    <small className="text-muted">
                      Compte créé récemment
                    </small>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Subscription Section */}
            {activeSection === "subscription" && (
              <Card style={{ 
                border: '2px solid #fbbf24', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#fef3c7',
                  borderBottom: '2px solid #fcd34d',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#92400e' }}>
                    <i className="bi bi-star-fill me-2" style={{ color: '#f59e0b' }}></i>
                    Mon abonnement
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {message && (
                    <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
                      {message.text}
                    </Alert>
                  )}

                {/* Current Subscription */}
                {status && (
                  <>
                    {/* Warning banner if auto_renewal is false */}
                    {status.tier !== 'freemium' && !status.auto_renewal && (
                      <Alert 
                        variant="warning" 
                        className="mb-4"
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #fbbf24',
                          backgroundColor: '#fef3c7'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem', color: '#d97706' }}></i>
                          <div>
                            <h6 className="mb-2" style={{ fontWeight: '700', color: '#92400e' }}>
                              ⚠️ Renouvellement automatique désactivé
                            </h6>
                            <p className="mb-2" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                              Votre abonnement <strong>{getTierDisplayName(status.tier)}</strong> ne sera pas renouvelé automatiquement 
                              le <strong>{formatDate(status.renewal_date)}</strong>.
                            </p>
                            <p className="mb-0" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                              À partir de cette date, votre compte repassera automatiquement en <strong>Freemium</strong> avec 
                              un quota limité à <strong>3 fiches par mois</strong>.
                            </p>
                          </div>
                        </div>
                      </Alert>
                    )}

                    {/* Pending tier change banner (downgrade) */}
                    {status.pending_tier && (
                      <Alert 
                        className="mb-4"
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #60a5fa',
                          backgroundColor: '#dbeafe'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className="bi bi-clock-history me-3" style={{ fontSize: '1.5rem', color: '#2563eb' }}></i>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 me-2" style={{ fontWeight: '700', color: '#1e40af' }}>
                                📅 Changement de plan programmé
                              </h6>
                              <Badge 
                                bg="primary" 
                                style={{ 
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}
                              >
                                En attente
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <div className="d-flex align-items-center mb-1">
                                <strong style={{ fontSize: '0.9rem', color: '#1e40af', minWidth: '140px' }}>
                                  Plan actuel :
                                </strong>
                                <span style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
                                  {getTierDisplayName(status.tier)} ({status.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'}) 
                                  - {status.monthly_quota} fiches/mois
                                </span>
                              </div>
                              <div className="d-flex align-items-center">
                                <strong style={{ fontSize: '0.9rem', color: '#1e40af', minWidth: '140px' }}>
                                  Nouveau plan :
                                </strong>
                                <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '600' }}>
                                  {getTierDisplayName(status.pending_tier)} ({status.pending_billing_period === 'monthly' ? 'Mensuel' : 'Annuel'})
                                  {(() => {
                                    const pendingPlan = plans.find(p => p.tier === status.pending_tier);
                                    return pendingPlan ? ` - ${pendingPlan.monthly_quota} fiches/mois` : '';
                                  })()}
                                </span>
                              </div>
                            </div>
                            <p className="mb-0" style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                              <i className="bi bi-calendar-check me-1"></i>
                              Ce changement sera appliqué le <strong>{formatDate(status.renewal_date)}</strong>.
                              Vous conservez votre plan et vos quotas actuels jusqu'à cette date.
                            </p>
                          </div>
                        </div>
                      </Alert>
                    )}

                    <Card className="mb-4" style={{ 
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                    }}>
                      <Card.Header className="d-flex justify-content-between align-items-center" style={{ 
                        backgroundColor: '#eff6ff',
                        borderBottom: '2px solid #93c5fd',
                        borderRadius: '10px 10px 0 0',
                        padding: '16px 20px'
                      }}>
                        <h6 className="mb-0 d-flex align-items-center fw-semibold" style={{ color: '#1e40af' }}>
                          <i className="bi bi-star-fill me-2" style={{ color: '#fbbf24' }}></i>
                          Mon abonnement actuel
                        </h6>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: status.status === 'active' ? '#dcfce7' : 
                            status.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                          color: status.status === 'active' ? '#166534' : 
                            status.status === 'cancelled' ? '#991b1b' : '#92400e',
                          border: `2px solid ${status.status === 'active' ? '#86efac' : 
                            status.status === 'cancelled' ? '#fca5a5' : '#fcd34d'}`
                        }}>
                          {status.status === 'active' ? '✓ Actif' : 
                           status.status === 'cancelled' ? '✕ Annulé' : '⚠ Suspendu'}
                        </span>
                      </Card.Header>
                    <Card.Body className="p-4">
                      <Row>
                        <Col md={6} className="mb-3 mb-md-0">
                          <div className="d-flex align-items-center mb-3">
                            <div>
                              <h4 className="mb-1" style={{ color: '#1e40af', fontWeight: '700' }}>
                                {getTierDisplayName(status.tier)}
                              </h4>
                              <div className="d-flex align-items-baseline">
                                <span className="h3 mb-0" style={{ color: '#3b82f6', fontWeight: '700' }}>
                                  {getCurrentPlan()?.pricing[status.billing_period].price}€
                                </span>
                                <span className="text-muted ms-2" style={{ fontSize: '0.9rem' }}>
                                  /{status.billing_period === 'monthly' ? 'mois' : 'an'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4" style={{ 
                            backgroundColor: '#fef3c7', 
                            padding: '12px 16px', 
                            borderRadius: '10px',
                            border: '2px solid #fcd34d'
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400e' }}>
                                <i className="bi bi-graph-up me-2" style={{ color: '#f59e0b' }}></i>
                                Utilisation ce mois
                              </h6>
                              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#92400e' }}>
                                {status.monthly_used} / {status.monthly_quota}
                                {status.addon_quota_remaining > 0 && <> (+{status.addon_quota_remaining})</>}
                              </span>
                            </div>
                            <div className="progress mb-2" style={{ 
                              height: '14px', 
                              backgroundColor: '#fef9e7',
                              borderRadius: '8px',
                              border: '1px solid #fde68a'
                            }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{
                                  width: `${Math.min((status.monthly_used / status.monthly_quota) * 100, 100)}%`,
                                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                  borderRadius: '8px'
                                }}
                                aria-valuenow={status.monthly_used} 
                                aria-valuemin={0} 
                                aria-valuemax={status.monthly_quota}
                              ></div>
                            </div>
                            <div className="text-center">
                              <small style={{ 
                                color: status.monthly_remaining <= 0 && status.addon_quota_remaining <= 0 ? '#dc2626' : '#166534',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                              }}>
                                {status.monthly_remaining <= 0 && status.addon_quota_remaining <= 0
                                  ? '⚠️ Limite atteinte' 
                                  : `✓ ${status.monthly_remaining + status.addon_quota_remaining} fiches restantes`}
                              </small>
                            </div>
                          </div>

                          {/* Addon Packs Section */}
                          {status.addon_quota_remaining > 0 && (
                            <div className="mb-3 p-3" style={{ 
                              backgroundColor: '#f0fdf4', 
                              borderRadius: '10px',
                              border: '1px solid #86efac'
                            }}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <small style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>
                                    Packs additionnels
                                  </small>
                                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#15803d' }}>
                                    {status.addon_quota_remaining} fiches disponibles
                                  </div>
                                </div>
                                <i className="bi bi-plus-circle-fill" style={{ fontSize: '1.5rem', color: '#22c55e' }}></i>
                              </div>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={6}>
                          <div className="mb-3 p-3" style={{ 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: '10px',
                            border: '1px solid #bae6fd'
                          }}>
                            <div className="mb-3">
                              <small style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>
                                Période de facturation
                              </small>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af' }}>
                                {status.billing_period === 'monthly' ? 'Mensuelle' : 'Annuelle'}
                              </div>
                            </div>
                            <div className="mb-3">
                              <small style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>
                                Début de l'abonnement
                              </small>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af' }}>
                                {formatDate(status.start_date)}
                              </div>
                            </div>
                            <div>
                              <small style={{ 
                                fontSize: '0.75rem', 
                                color: status.pending_tier ? '#2563eb' : (status.auto_renewal ? '#0369a1' : '#92400e'), 
                                fontWeight: '600', 
                                textTransform: 'uppercase' 
                              }}>
                                {status.pending_tier 
                                  ? 'Date du changement de plan' 
                                  : (status.auto_renewal ? 'Prochain renouvellement' : 'Date d\'expiration')
                                }
                              </small>
                              <div style={{ 
                                fontSize: '0.95rem', 
                                fontWeight: '600', 
                                color: status.pending_tier ? '#1e40af' : (status.auto_renewal ? '#1e40af' : '#d97706')
                              }}>
                                {formatDate(status.renewal_date)}
                              </div>
                              {status.pending_tier && (
                                <div className="mt-2 p-2" style={{
                                  backgroundColor: '#dbeafe',
                                  borderRadius: '6px',
                                  border: '1px solid #93c5fd'
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600', marginBottom: '2px' }}>
                                    → Passage au plan :
                                  </div>
                                  <div style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: '700' }}>
                                    {getTierDisplayName(status.pending_tier)} 
                                    <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                                      {' '}({status.pending_billing_period === 'monthly' ? 'Mensuel' : 'Annuel'})
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="d-grid gap-2 mt-3">
                            {/* Addon pack button - only for paid subscriptions */}
                            {status.tier !== 'freemium' && (
                              <Button 
                                variant="success"
                                size="sm"
                                onClick={() => setShowAddonModal(true)}
                                style={{
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  padding: '8px 16px'
                                }}
                              >
                                <i className="bi bi-plus-circle me-2"></i>
                                Acheter des packs additionnels
                              </Button>
                            )}
                            
                            {/* Cancel/Reactivate button - only for paid subscriptions */}
                            {status.tier !== 'freemium' && (
                              status.auto_renewal ? (
                                <Button 
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => setShowCancelConfirm(true)}
                                  disabled={actionLoading}
                                  style={{
                                    borderWidth: '2px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Annuler l\'abonnement'}
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => setShowReactivateConfirm(true)}
                                  disabled={actionLoading}
                                  style={{
                                    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Réactiver l\'abonnement'}
                                </Button>
                              )
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  </>
                )}

                {/* Available Plans - Detailed Comparison */}
                <Card className="mb-4" style={{ 
                  border: '2px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <Card.Header style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e9ecef',
                    padding: '12px 16px'
                  }}>
                    <h6 className="mb-0 fw-semibold" style={{ color: '#2c3e50' }}>
                      {status?.status === 'active' ? 'Changer d\'abonnement' : 'Choisir un abonnement'}
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    {/* Plans Cards */}
                    <Row className="mb-4">
                      {/* Free Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'freemium' ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'freemium' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                        }}>
                          <Card.Body className="text-center d-flex flex-column p-4">
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#6b7280' }}>Gratuit</h5>
                            <div className="display-6 mb-2" style={{ color: '#6b7280', fontWeight: '700' }}>0€</div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              Pour découvrir l'application
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'freemium' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#eff6ff', 
                                  color: '#1e40af',
                                  border: '2px solid #3b82f6',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.pending_tier === 'freemium' ? (
                                <div>
                                  <span className="badge p-2 mb-2 d-block" style={{ 
                                    backgroundColor: '#fef3c7', 
                                    color: '#92400e',
                                    border: '2px solid #fbbf24',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                  }}>
                                    🕒 Retour prévu
                                  </span>
                                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                    Réactivez votre abonnement pour éviter le retour au Freemium
                                  </small>
                                </div>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Standard Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'standard' ? '3px solid #fbbf24' : '2px solid #fbbf24',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'standard' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : '0 2px 8px rgba(251, 191, 36, 0.15)',
                          transform: 'scale(1.02)'
                        }}>
                          <div className="position-absolute top-0 start-50 translate-middle">
                            <span className="badge text-dark px-3 py-2" style={{ 
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              borderRadius: '8px'
                            }}>
                              ⭐ Populaire
                            </span>
                          </div>
                          <Card.Body className="text-center d-flex flex-column p-4" style={{ paddingTop: '2.5rem !important' }}>
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#92400e' }}>Standard</h5>
                            <div className="display-6 mb-2" style={{ color: '#f59e0b', fontWeight: '700' }}>
                              {plans.find(p => p.tier === 'standard')?.pricing.monthly.price || '1.99'}€
                            </div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#78350f' }}>
                              Pour une utilisation régulière
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'standard' && !status?.pending_tier ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#fef3c7', 
                                  color: '#92400e',
                                  border: '2px solid #fbbf24',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.pending_tier === 'standard' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af',
                                  border: '2px solid #60a5fa',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  🕒 Changement prévu
                                </span>
                              ) : status?.tier === 'freemium' ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('standard')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Passer à Standard'}
                                </Button>
                              ) : status?.tier === 'famille_plus' ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('standard')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Changer vers Standard'}
                                </Button>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Family+ Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'famille_plus' ? '3px solid #3b82f6' : '2px solid #3b82f6',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'famille_plus' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(59, 130, 246, 0.15)'
                        }}>
                          <Card.Body className="text-center d-flex flex-column p-4">
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#1e40af' }}>Family+</h5>
                            <div className="display-6 mb-2" style={{ color: '#3b82f6', fontWeight: '700' }}>
                              {plans.find(p => p.tier === 'famille_plus')?.pricing.monthly.price || '3.99'}€
                            </div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                              Pour une utilisation intensive
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'famille_plus' && !status?.pending_tier ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#eff6ff', 
                                  color: '#1e40af',
                                  border: '2px solid #3b82f6',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.tier === 'famille_plus' && status?.pending_tier ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('famille_plus')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : '🔄 Annuler le changement'}
                                </Button>
                              ) : status?.pending_tier === 'famille_plus' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af',
                                  border: '2px solid #60a5fa',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  🕒 Changement prévu
                                </span>
                              ) : (status?.tier === 'freemium' || status?.tier === 'standard') ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('famille_plus')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Passer à Family+'}
                                </Button>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Detailed Features Comparison Table */}
                    <div className="table-responsive">
                      <table className="table table-bordered" style={{ fontSize: '0.9rem', borderRadius: '10px', overflow: 'hidden' }}>
                        <thead>
                          <tr>
                            <th style={{ 
                              width: '25%', 
                              color: '#1e40af', 
                              fontWeight: '600',
                              backgroundColor: '#eff6ff',
                              borderBottom: '2px solid #93c5fd'
                            }}>Fonctionnalité</th>
                            <th className="text-center" style={{ 
                              color: '#6b7280', 
                              fontWeight: '600',
                              backgroundColor: '#f9fafb',
                              borderBottom: '2px solid #e5e7eb'
                            }}>Gratuit</th>
                            <th className="text-center" style={{ 
                              color: '#92400e', 
                              fontWeight: '600',
                              backgroundColor: '#fef3c7',
                              borderBottom: '2px solid #fcd34d'
                            }}>Standard ({plans.find(p => p.tier === 'standard')?.pricing.monthly.price || '1.99'}€)</th>
                            <th className="text-center" style={{ 
                              color: '#1e40af', 
                              fontWeight: '600',
                              backgroundColor: '#eff6ff',
                              borderBottom: '2px solid #93c5fd'
                            }}>Family+ ({plans.find(p => p.tier === 'famille_plus')?.pricing.monthly.price || '3.99'}€)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Usage</strong></td>
                            <td className="text-center">1 fiche/jour<br/><small className="text-muted">+ 3 bonus/mois</small></td>
                            <td className="text-center"><strong>60 fiches/mois</strong><br/><small className="text-muted">(soft cap)</small></td>
                            <td className="text-center"><strong>120 fiches/mois</strong><br/><small className="text-muted">(soft cap)</small></td>
                          </tr>
                          <tr>
                            <td><strong>Historique</strong></td>
                            <td className="text-center">7 dernières</td>
                            <td className="text-center">90 jours</td>
                            <td className="text-center"><span style={{ color: '#10b981', fontWeight: '600' }}>illimité</span></td>
                          </tr>
                          <tr>
                            <td><strong>Tags</strong></td>
                            <td className="text-center">non</td>
                            <td className="text-center">non</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> création et filtrage</td>
                          </tr>
                          <tr>
                            <td><strong>Priorité de génération</strong></td>
                            <td className="text-center">standard</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> priorité</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> priorité</td>
                          </tr>
                          <tr>
                            <td><strong>Thèmes personnalisés</strong></td>
                            <td className="text-center">basiques</td>
                            <td className="text-center">basiques</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> premium</td>
                          </tr>
                          <tr>
                            <td><strong>Accès web / mobile</strong></td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span></td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span></td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span></td>
                          </tr>
                          <tr>
                            <td><strong>Support PDF</strong></td>
                            <td className="text-center">standard</td>
                            <td className="text-center">standard</td>
                            <td className="text-center">standard+</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Upsell Messages */}
                    {status?.tier === 'freemium' && (
                      <div className="mt-3 p-3" style={{ 
                        backgroundColor: '#fef3c7',
                        border: '2px solid #fbbf24',
                        borderRadius: '10px'
                      }}>
                        <strong style={{ color: '#92400e', fontSize: '1rem' }}>
                          <i className="bi bi-lightbulb me-2" style={{ color: '#f59e0b' }}></i>
                          Passez à Standard
                        </strong>
                        <p className="mb-0 mt-2" style={{ color: '#78350f', fontSize: '0.9rem' }}>
                          Générez jusqu'à 60 fiches par mois avec priorité de génération et conservez votre historique pendant 90 jours !
                        </p>
                      </div>
                    )}
                    {status?.tier === 'standard' && (
                      <div className="mt-3 p-3" style={{ 
                        backgroundColor: '#eff6ff',
                        border: '2px solid #3b82f6',
                        borderRadius: '10px'
                      }}>
                        <strong style={{ color: '#1e40af', fontSize: '1rem' }}>
                          <i className="bi bi-rocket-takeoff me-2" style={{ color: '#3b82f6' }}></i>
                          Passez à Family+
                        </strong>
                        <p className="mb-0 mt-2" style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>
                          Doublez votre quota, taggez vos fiches et conservez toutes vos créations indéfiniment !
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="mb-2">💡 Informations importantes</h6>
                      <ul className="mb-0 small text-muted">
                        <li>Les changements d'abonnement prennent effet immédiatement</li>
                        <li>En cas de rétrogradation, le crédit restant est conservé jusqu'à la fin du mois</li>
                        <li>L'annulation prend effet à la fin de la période de facturation</li>
                        <li>Aucun engagement - vous pouvez modifier ou annuler à tout moment</li>
                      </ul>
                    </div>
                  </Card.Body>
                </Card>
                </Card.Body>
              </Card>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <Card style={{ 
                border: '2px solid #3b82f6', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#eff6ff',
                  borderBottom: '2px solid #93c5fd',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#1e40af' }}>
                    <i className="bi bi-sliders me-2" style={{ color: '#3b82f6' }}></i>
                    Paramètres de l'application
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Niveau par défaut</Form.Label>
                    <Form.Select defaultValue="CE1">
                      <option value="CP">CP</option>
                      <option value="CE1">CE1</option>
                      <option value="CE2">CE2</option>
                      <option value="CM1">CM1</option>
                      <option value="CM2">CM2</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Durée de séance par défaut</Form.Label>
                    <Form.Select defaultValue="30 min">
                      <option value="10 min">10 minutes</option>
                      <option value="20 min">20 minutes</option>
                      <option value="30 min">30 minutes</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="notifications"
                      label="Recevoir des notifications par email"
                      defaultChecked={true}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="newsletter"
                      label="S'abonner à la newsletter"
                      defaultChecked={false}
                    />
                  </Form.Group>

                  <Button variant="primary" className="mt-3">
                    Sauvegarder les paramètres
                  </Button>
                </Card.Body>
              </Card>
            )}

            {/* Support Section */}
            {activeSection === "support" && (
              <Card style={{ 
                border: '2px solid #3b82f6', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#eff6ff',
                  borderBottom: '2px solid #93c5fd',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#1e40af' }}>
                    <i className="bi bi-headset me-2" style={{ color: '#3b82f6' }}></i>
                    Support Technique
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {supportMessage && (
                    <Alert variant={supportMessage.type === 'success' ? 'success' : 'danger'} className="mb-4">
                      {supportMessage.text}
                    </Alert>
                  )}

                  <div className="mb-4">
                    <p className="text-muted">
                      Une question, un problème, ou besoin d'aide ? Notre équipe support est là pour vous aider.
                      Décrivez votre problème et nous vous répondrons dans les plus brefs délais.
                    </p>
                  </div>

                  <Form onSubmit={handleSupportSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Type de demande</Form.Label>
                          <Form.Select
                            value={supportForm.type}
                            onChange={(e) => setSupportForm({ ...supportForm, type: e.target.value })}
                            required
                          >
                            <option value="bug">🐛 Signaler un bug</option>
                            <option value="billing">💳 Problème de facturation</option>
                            <option value="feature">💡 Demande de fonctionnalité</option>
                            <option value="account">👤 Problème de compte</option>
                            <option value="performance">⚡ Problème de performance</option>
                            <option value="other">❓ Autre</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Priorité</Form.Label>
                          <Form.Select
                            value={supportForm.priority}
                            onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                            required
                          >
                            <option value="low">🟢 Basse - Question générale</option>
                            <option value="medium">🟡 Moyenne - Problème gênant</option>
                            <option value="high">🟠 Haute - Problème bloquant</option>
                            <option value="urgent">🔴 Urgente - Service inutilisable</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Objet</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Résumez votre problème en quelques mots..."
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        required
                        maxLength={100}
                      />
                      <Form.Text className="text-muted">
                        {supportForm.subject.length}/100 caractères
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Description détaillée</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="Décrivez votre problème en détail. Plus vous serez précis, plus nous pourrons vous aider efficacement.

Informations utiles :
- Quelles étapes avez-vous suivies ?
- Quel était le résultat attendu ?
- Que s'est-il passé à la place ?
- Avez-vous des messages d'erreur ?
- Sur quel appareil/navigateur ?"
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        required
                        maxLength={2000}
                      />
                      <Form.Text className="text-muted">
                        {supportForm.message.length}/2000 caractères
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted small">
                        📧 Connecté en tant que: <strong>{user?.email}</strong>
                      </div>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={supportSubmitting || !supportForm.subject.trim() || !supportForm.message.trim()}
                      >
                        {supportSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            📤 Envoyer la demande
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  <div className="mt-4 p-3 bg-light rounded">
                    <h6>📞 Autres moyens de nous contacter :</h6>
                    <ul className="mb-0">
                      <li>Email : support@exominutes.com</li>
                      <li>Temps de réponse moyen : 24h en semaine</li>
                      <li>Disponibilité : Lundi-Vendredi, 9h-18h</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Admin Section - uniquement pour admin@exominutes.com */}
            {activeSection === "admin" && isAdmin && (
              <Card style={{ 
                border: '2px solid #ffc107', 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#fff9e6',
                  borderBottom: '2px solid #ffc107',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-gear me-2" style={{ color: '#ffc107' }}></i>
                    Administration
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <h5 className="text-warning">🔧 Outils d'administration</h5>
                    <p className="text-muted">
                      Accès réservé aux administrateurs pour la gestion et le débogage de l'application.
                    </p>
                  </div>

                  <div className="d-grid gap-3">
                    {/* Accès à la page d'administration */}
                    <div className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                              <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h9V.5a.5.5 0 0 1 1 0V1h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h2V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                            </svg>
                            Console d'administration
                          </h6>
                          <p className="text-muted small mb-0">
                            Accès complet aux outils de débogage, synchronisation OpenAPI, gestion des données et monitoring système.
                          </p>
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => router.push('/admin')}
                          className="ms-3"
                        >
                          <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                          </svg>
                          Accéder
                        </Button>
                      </div>
                    </div>

                    {/* Informations de sécurité */}
                    <Alert variant="info" className="mb-0">
                      <Alert.Heading as="h6">
                        <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                        Accès sécurisé
                      </Alert.Heading>
                      <p className="mb-0">
                        Cet accès est restreint aux comptes administrateurs autorisés. 
                        Toutes les actions sont journalisées pour des raisons de sécurité.
                      </p>
                    </Alert>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Logout Section */}
            {activeSection === "logout" && (
              <Card style={{ 
                border: '2px solid #f8d7da', 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#fff5f5',
                  borderBottom: '2px solid #f8d7da',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#dc3545' }}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Se déconnecter
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {!showLogoutConfirm ? (
                    <div>
                      <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
                      <p className="text-muted">
                        Vous devrez vous reconnecter pour accéder à votre compte.
                      </p>
                      <Button
                        variant="danger"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="me-2"
                      >
                        Oui, me déconnecter
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setActiveSection("profile")}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <Alert variant="warning">
                      <Alert.Heading>Confirmation de déconnexion</Alert.Heading>
                      <p>Cliquez sur "Confirmer" pour vous déconnecter définitivement.</p>
                      <hr />
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="outline-warning"
                          onClick={() => setShowLogoutConfirm(false)}
                        >
                          Annuler
                        </Button>
                        <Button variant="danger" onClick={handleLogout}>
                          Confirmer la déconnexion
                        </Button>
                      </div>
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Addon Pack Purchase Modal */}
      <Modal show={showAddonModal} onHide={() => setShowAddonModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #86efac' }}>
          <Modal.Title style={{ color: '#166534', fontWeight: '700' }}>
            <i className="bi bi-plus-circle-fill me-2" style={{ color: '#22c55e' }}></i>
            Acheter des packs additionnels
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-4 p-3" style={{ 
            backgroundColor: '#f0f9ff', 
            borderRadius: '10px',
            border: '1px solid #bae6fd'
          }}>
            <h6 style={{ color: '#0369a1', fontWeight: '600' }}>
              <i className="bi bi-info-circle me-2"></i>
              À propos des packs additionnels
            </h6>
            <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
              Les packs additionnels vous permettent d'augmenter votre quota de fiches au-delà de votre limite mensuelle. 
              Ces fiches n'expirent pas et sont utilisées en priorité.
            </p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '600', color: '#1e40af' }}>
              Nombre de packs à acheter
            </Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="20"
              value={addonQuantity}
              onChange={(e) => setAddonQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ 
                borderWidth: '2px',
                borderColor: '#93c5fd',
                borderRadius: '8px'
              }}
            />
            <Form.Text className="text-muted">
              Chaque pack contient 10 fiches supplémentaires
            </Form.Text>
          </Form.Group>

          <div className="p-3 mb-3" style={{ 
            backgroundColor: '#fef3c7', 
            borderRadius: '10px',
            border: '2px solid #fcd34d'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600' }}>
                  Total de fiches
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#b45309' }}>
                  {addonQuantity * 10} fiches
                </div>
              </div>
              <div className="text-end">
                <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600' }}>
                  Prix total
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#b45309' }}>
                  {(addonQuantity * 2.99).toFixed(2)}€
                </div>
              </div>
            </div>
          </div>

          {status && status.addon_quota_remaining > 0 && (
            <Alert variant="success" className="mb-0">
              <small>
                <i className="bi bi-check-circle-fill me-2"></i>
                Vous avez actuellement <strong>{status.addon_quota_remaining} fiches</strong> de packs additionnels disponibles.
              </small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowAddonModal(false)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            Annuler
          </Button>
          <Button 
            variant="success"
            onClick={handleBuyAddonPack}
            disabled={actionLoading}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Achat en cours...
              </>
            ) : (
              <>
                <i className="bi bi-cart-check me-2"></i>
                Confirmer l'achat
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Subscription Confirmation Modal */}
      <Modal 
        show={showCancelConfirm} 
        onHide={() => setShowCancelConfirm(false)}
        centered
      >
        <Modal.Header 
          closeButton
          style={{ 
            backgroundColor: '#fef3c7', 
            borderBottom: '2px solid #fbbf24' 
          }}
        >
          <Modal.Title style={{ color: '#92400e', fontWeight: '700' }}>
            <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#d97706' }}></i>
            Confirmer l'annulation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div className="mb-3">
            <h6 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Êtes-vous sûr de vouloir annuler le renouvellement automatique ?
            </h6>
            <div className="p-3 mb-3" style={{ 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #fbbf24'
            }}>
              <p className="mb-2" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                <strong>Conséquences de l'annulation :</strong>
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#92400e', marginBottom: 0 }}>
                <li className="mb-2">
                  Votre abonnement <strong>{status && getTierDisplayName(status.tier)}</strong> restera actif jusqu'au{' '}
                  <strong>{status && formatDate(status.renewal_date)}</strong>
                </li>
                <li className="mb-2">
                  Vous conserverez votre quota actuel jusqu'à cette date
                </li>
                <li className="mb-2">
                  Après cette date, votre compte repassera automatiquement en{' '}
                  <strong>Freemium</strong>
                </li>
                <li>
                  Vous serez limité à <strong>3 fiches par mois</strong> en Freemium
                </li>
              </ul>
            </div>
            <div className="p-3" style={{ 
              backgroundColor: '#e0f2fe', 
              borderRadius: '8px',
              border: '1px solid #7dd3fc'
            }}>
              <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                <i className="bi bi-info-circle-fill me-2" style={{ color: '#0284c7' }}></i>
                Vous pourrez réactiver le renouvellement automatique à tout moment avant la date d'expiration.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowCancelConfirm(false)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            Annuler
          </Button>
          <Button 
            variant="danger"
            onClick={handleCancelSubscription}
            disabled={actionLoading}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Traitement...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Confirmer l'annulation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reactivate Subscription Confirmation Modal */}
      <Modal 
        show={showReactivateConfirm} 
        onHide={() => setShowReactivateConfirm(false)}
        centered
      >
        <Modal.Header 
          closeButton
          style={{ 
            backgroundColor: '#dbeafe', 
            borderBottom: '2px solid #60a5fa' 
          }}
        >
          <Modal.Title style={{ color: '#1e40af', fontWeight: '700' }}>
            <i className="bi bi-arrow-clockwise me-2" style={{ color: '#3b82f6' }}></i>
            Confirmer la réactivation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div className="mb-3">
            <h6 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Êtes-vous sûr de vouloir réactiver le renouvellement automatique ?
            </h6>
            <div className="p-3 mb-3" style={{ 
              backgroundColor: '#dcfce7', 
              borderRadius: '8px',
              border: '1px solid #86efac'
            }}>
              <p className="mb-2" style={{ fontSize: '0.95rem', color: '#14532d' }}>
                <strong>Effets de la réactivation :</strong>
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#166534', marginBottom: 0 }}>
                <li className="mb-2">
                  Votre abonnement <strong>{status && getTierDisplayName(status.tier)}</strong> se renouvellera automatiquement 
                  le <strong>{status && formatDate(status.renewal_date)}</strong>
                </li>
                <li className="mb-2">
                  Vous serez facturé <strong>{status && getCurrentPlan()?.pricing[status.billing_period].price}€</strong> à chaque renouvellement
                </li>
                <li className="mb-2">
                  Vous conserverez votre quota de <strong>{status && status.monthly_quota} fiches par mois</strong>
                </li>
                <li>
                  Le renouvellement se fera automatiquement sauf si vous l'annulez à nouveau
                </li>
              </ul>
            </div>
            <div className="p-3" style={{ 
              backgroundColor: '#e0f2fe', 
              borderRadius: '8px',
              border: '1px solid #7dd3fc'
            }}>
              <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                <i className="bi bi-info-circle-fill me-2" style={{ color: '#0284c7' }}></i>
                Vous éviterez ainsi le passage automatique au forfait Freemium limité à 3 fiches/mois.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowReactivateConfirm(false)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            Annuler
          </Button>
          <Button 
            style={{ 
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border: 'none',
              borderRadius: '8px', 
              fontWeight: '600',
              color: 'white'
            }}
            onClick={handleReactivateSubscription}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Traitement...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Confirmer la réactivation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </ProtectedPage>
  );
}
