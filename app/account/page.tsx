"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ProgressBar } from "react-bootstrap";
import { useRouter } from 'next/navigation';
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { subscription, usage, plans, loading, upgradePlan, downgradePlan, cancelSubscription, reactivateSubscription } = useSubscription();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("subscription");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleLogout = () => {
    logout();
    // Redirect will be handled by the auth context
  };

  const handlePlanChange = async (newPlanId: string, isUpgrade: boolean) => {
    if (!subscription) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      const result = isUpgrade 
        ? await upgradePlan(newPlanId)
        : await downgradePlan(newPlanId);
      
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

  const handleCancelSubscription = async () => {
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
    if (!subscription) return null;
    return plans.find(p => p.id === subscription.planId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
      <Container className="mt-4">
        <Row>
          <Col lg={10} className="mx-auto">
            <h2 className="mb-4 d-flex align-items-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 714 4v2"/>
              </svg>
              Mon compte
            </h2>

            {/* Navigation Tabs */}
            <div className="mb-4">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  className={`account-nav-button ${activeSection === "profile" ? "active" : ""}`}
                  onClick={() => setActiveSection("profile")}
                >
                  Profil utilisateur
                </Button>
                <Button
                  className={`account-nav-button ${activeSection === "subscription" ? "active" : ""}`}
                  onClick={() => setActiveSection("subscription")}
                >
                  Mon abonnement
                </Button>
                <Button
                  className={`account-nav-button ${activeSection === "settings" ? "active" : ""}`}
                  onClick={() => setActiveSection("settings")}
                >
                  Paramètres
                </Button>
                <Button
                  className={`account-nav-button ${activeSection === "support" ? "active" : ""}`}
                  onClick={() => setActiveSection("support")}
                >
                  <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                    <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12V6a5 5 0 0 0-5-5z"/>
                  </svg>
                  Support
                </Button>
                {/* Section Admin - uniquement pour admin@exominutes.com */}
                {isAdmin && (
                  <Button
                    className={`account-nav-button admin-btn ${activeSection === "admin" ? "active" : ""}`}
                    onClick={() => setActiveSection("admin")}
                  >
                    <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                    </svg>
                    Administration
                  </Button>
                )}
                <Button
                  className={`account-nav-button logout-btn ${activeSection === "logout" ? "active" : ""}`}
                  onClick={() => setActiveSection("logout")}
                >
                  Se déconnecter
                </Button>
              </div>
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0">Profil utilisateur</h4>
                </Card.Header>
                <Card.Body>
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
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0 d-flex align-items-center">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4l3 3"/>
                    </svg>
                    Mon abonnement
                  </h4>
                </Card.Header>
                <Card.Body>
                  {message && (
                    <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
                      {message.text}
                    </Alert>
                  )}

                {/* Current Subscription */}
                {subscription && (
                  <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0 d-flex align-items-center">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 8v4l3 3"/>
                        </svg>
                        Mon abonnement actuel
                      </h4>
                      <span className={`badge ${subscription.status === 'active' ? 'bg-success' : 
                        subscription.status === 'cancelled' ? 'bg-danger' : 'bg-warning'}`}>
                        {subscription.status === 'active' ? 'Actif' : 
                         subscription.status === 'cancelled' ? 'Annulé' : 'Suspendu'}
                      </span>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <h5>{getCurrentPlan()?.name}</h5>
                          <div className="h4 text-primary mb-2">{getCurrentPlan()?.price}€<small className="text-muted">/mois</small></div>
                          <p className="mb-3">{getCurrentPlan()?.description}</p>
                          
                          <div className="mb-4">
                            <h6>Utilisation ce mois</h6>
                            <div className="progress mb-2" style={{height: '12px'}}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{width: `${Math.min(((subscription.usageThisMonth || 0) / (getCurrentPlan()?.monthlyLimit || 1)) * 100, 100)}%`}}
                                aria-valuenow={subscription.usageThisMonth || 0} 
                                aria-valuemin={0} 
                                aria-valuemax={getCurrentPlan()?.monthlyLimit}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {subscription.usageThisMonth || 0} / {getCurrentPlan()?.monthlyLimit} fiches générées
                              </small>
                              <small className={`${(subscription.usageThisMonth || 0) >= (getCurrentPlan()?.monthlyLimit || 0) ? 'text-danger' : 'text-success'}`}>
                                {(getCurrentPlan()?.monthlyLimit || 0) - (subscription.usageThisMonth || 0)} restantes
                              </small>
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={6}>
                          <div className="mb-3">
                            <strong>Début de l'abonnement :</strong><br />
                            <span className="text-muted">{formatDate(subscription.currentPeriodStart)}</span>
                          </div>
                          <div className="mb-3">
                            <strong>Prochaine facturation :</strong><br />
                            <span className="text-muted">{formatDate(subscription.currentPeriodEnd)}</span>
                          </div>
                          
                          <div className="mt-4">
                            {subscription.status === 'active' ? (
                              <Button 
                                variant="outline-danger"
                                size="sm"
                                onClick={handleCancelSubscription}
                                disabled={actionLoading}
                              >
                                {actionLoading ? 'Chargement...' : 'Annuler l\'abonnement'}
                              </Button>
                            ) : subscription.status === 'cancelled' && (
                              <Button 
                                variant="primary"
                                size="sm"
                                onClick={handleReactivateSubscription}
                                disabled={actionLoading}
                              >
                                {actionLoading ? 'Chargement...' : 'Réactiver l\'abonnement'}
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Available Plans */}
                <Card className="mb-4">
                  <Card.Header>
                    <h4 className="mb-0">
                      {subscription?.status === 'active' ? 'Changer d\'abonnement' : 'Choisir un abonnement'}
                    </h4>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {plans.map((plan) => {
                        const isCurrentPlan = subscription?.planId === plan.id;
                        const currentPlan = getCurrentPlan();
                        const isUpgrade = subscription && currentPlan && plan.price > currentPlan.price;
                        
                        return (
                          <Col key={plan.id} md={4} className="mb-3">
                            <Card className={`h-100 ${isCurrentPlan ? 'border-primary' : ''} ${plan.id === 'standard' ? 'border-warning' : ''}`}>
                              {plan.id === 'standard' && (
                                <div className="position-absolute top-0 start-50 translate-middle">
                                  <span className="badge bg-warning text-dark">Populaire</span>
                                </div>
                              )}
                              <Card.Body className="text-center d-flex flex-column">
                                <h6 className="card-title">{plan.name}</h6>
                                <div className="display-6 text-primary mb-2">{plan.price}€</div>
                                <p className="text-muted small mb-3">par mois</p>
                                <p className="card-text mb-4">{plan.description}</p>
                                
                                <ul className="list-unstyled mb-4 flex-grow-1">
                                  <li className="mb-2">✓ <strong>{plan.monthlyLimit} fiches</strong> par mois</li>
                                  <li className="mb-2">✓ Tous les types d'exercices</li>
                                  <li className="mb-2">✓ Export PDF</li>
                                  <li className="mb-2">✓ Support client</li>
                                </ul>
                                
                                <div className="mt-auto">
                                  {isCurrentPlan ? (
                                    <span className="badge bg-primary p-2">Plan actuel</span>
                                  ) : subscription?.status === 'active' ? (
                                    <Button 
                                      variant={isUpgrade ? 'primary' : 'outline-primary'}
                                      size="sm"
                                      onClick={() => handlePlanChange(plan.id, isUpgrade || false)}
                                      disabled={actionLoading}
                                    >
                                      {actionLoading ? 'Chargement...' : 
                                       isUpgrade ? 'Passer à ce plan' : 'Rétrograder'}
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant={plan.id === 'standard' ? 'warning' : 'outline-primary'}
                                      size="sm"
                                      onClick={() => handlePlanChange(plan.id, true)}
                                      disabled={actionLoading}
                                    >
                                      {actionLoading ? 'Chargement...' : 'Choisir ce plan'}
                                    </Button>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                    
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
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0">Paramètres de l'application</h4>
                </Card.Header>
                <Card.Body>
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
                      <option value="20 min">20 minutes</option>
                      <option value="30 min">30 minutes</option>
                      <option value="40 min">40 minutes</option>
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
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0 d-flex align-items-center">
                    <svg width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12V6a5 5 0 0 0-5-5z"/>
                    </svg>
                    Support Technique
                  </h4>
                </Card.Header>
                <Card.Body>
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
              <Card className="mb-4 border-warning">
                <Card.Header className="bg-warning text-dark">
                  <h4 className="mb-0 d-flex align-items-center">
                    <svg width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                    </svg>
                    Administration
                  </h4>
                </Card.Header>
                <Card.Body>
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
              <Card className="mb-4 border-danger">
                <Card.Header className="bg-danger text-white">
                  <h4 className="mb-0">Se déconnecter</h4>
                </Card.Header>
                <Card.Body>
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
    </ProtectedPage>
  );
}
