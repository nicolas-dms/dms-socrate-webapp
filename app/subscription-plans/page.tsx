"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Modal, Alert } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

export default function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, plans, loading, upgradePlan, cancelSubscription, createCheckoutSession } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowModal(true);
    setMessage(null);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      // In a real implementation, this would redirect to Stripe Checkout
      const checkoutSession = await createCheckoutSession(selectedPlan.id);
      // For now, we'll just simulate the subscription upgrade
      if (subscription?.planId !== selectedPlan.id) {
        const result = await upgradePlan(selectedPlan.id);
        setMessage({
          type: result.success ? 'success' : 'error',
          text: result.message
        });
        if (result.success) {
          setShowModal(false);
        }
      }
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

  if (loading) {
    return (
      <ProtectedPage>
        <Container className="mt-5" style={{maxWidth: 500}}>
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-3">Chargement des abonnements...</p>
          </div>
        </Container>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <Container className="py-5">
        <Row>
          <Col lg={10} className="mx-auto">
            <div className="text-center mb-5">
              <h1 className="h2 mb-3">Choisissez votre abonnement</h1>
              <p className="lead text-muted">
                Générez autant de fiches que vous voulez avec nos plans flexibles
              </p>
            </div>

            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
                {message.text}
              </Alert>
            )}

            {/* Current Subscription Info */}
            {subscription && (
              <Card className="mb-5 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Votre abonnement actuel</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h6>{getCurrentPlan()?.name}</h6>
                      <p className="mb-2">{getCurrentPlan()?.description}</p>
                      <p className="mb-0">
                        <strong>{subscription.usageThisMonth || 0} / {getCurrentPlan()?.monthlyLimit}</strong> fiches utilisées ce mois
                      </p>
                    </Col>
                    <Col md={4} className="text-md-end">
                      <div className="h4 text-primary">{getCurrentPlan()?.price}€<small className="text-muted">/mois</small></div>
                      <span className={`badge ${subscription.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {subscription.status === 'active' ? 'Actif' : 'Annulé'}
                      </span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Subscription Plans */}
            <Row>
              {plans.map((plan, index) => {
                const isCurrentPlan = subscription?.planId === plan.id;
                const currentPlan = getCurrentPlan();
                const isUpgrade = subscription && currentPlan && plan.price > currentPlan.price;
                const isDowngrade = subscription && currentPlan && plan.price < currentPlan.price;
                
                return (
                  <Col key={plan.id} lg={4} md={6} className="mb-4">
                    <Card className={`h-100 position-relative ${isCurrentPlan ? 'border-primary shadow' : ''} ${plan.id === 'standard' ? 'border-warning' : ''}`}>
                      {plan.id === 'standard' && !isCurrentPlan && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <span className="badge bg-warning text-dark">Plus populaire</span>
                        </div>
                      )}
                      {isCurrentPlan && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <span className="badge bg-primary">Plan actuel</span>
                        </div>
                      )}
                      
                      <Card.Body className="d-flex flex-column text-center p-4">
                        <h5 className="card-title mb-3">{plan.name}</h5>
                        
                        <div className="mb-3">
                          <div className="display-4 text-primary mb-2">{plan.price}€</div>
                          <p className="text-muted">par mois</p>
                        </div>
                        
                        <p className="card-text mb-4">{plan.description}</p>
                        
                        <ul className="list-unstyled mb-4 flex-grow-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="mb-2">
                              <span className="text-success me-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-auto">
                          {isCurrentPlan ? (
                            <Button variant="outline-primary" disabled>
                              Plan actuel
                            </Button>
                          ) : (
                            <Button 
                              variant={plan.id === 'standard' ? 'warning' : isUpgrade ? 'primary' : 'outline-primary'}
                              onClick={() => handleSelectPlan(plan)}
                              className="w-100"
                            >
                              {!subscription ? 'Choisir ce plan' : 
                               isUpgrade ? 'Passer à ce plan' : 
                               isDowngrade ? 'Rétrograder' : 'Changer de plan'}
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Additional Information */}
            <Row className="mt-5">
              <Col lg={8} className="mx-auto">
                <Card className="bg-light">
                  <Card.Body>
                    <h5 className="mb-3">💡 Informations importantes</h5>
                    <ul className="mb-0">
                      <li className="mb-2">Aucun engagement - vous pouvez modifier ou annuler votre abonnement à tout moment</li>
                      <li className="mb-2">Les changements prennent effet immédiatement</li>
                      <li className="mb-2">En cas de rétrogradation, vos fiches restantes sont conservées jusqu'à la fin du mois</li>
                      <li className="mb-2">Paiement sécurisé par Stripe</li>
                      <li>Support client disponible pour tous les plans</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Confirmation Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {subscription ? 'Changer d\'abonnement' : 'Confirmer votre abonnement'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPlan && (
              <div>
                <h6>Plan sélectionné : {selectedPlan.name}</h6>
                <p className="text-muted mb-3">{selectedPlan.description}</p>
                
                <div className="bg-light p-3 rounded mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Prix mensuel :</span>
                    <strong>{selectedPlan.price}€</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Fiches incluses :</span>
                    <strong>{selectedPlan.monthlyLimit} par mois</strong>
                  </div>
                </div>

                <p className="small text-muted mb-0">
                  {subscription 
                    ? "Votre abonnement sera modifié immédiatement. La facturation sera ajustée au prorata."
                    : "Vous serez redirigé vers notre page de paiement sécurisée pour finaliser votre abonnement."
                  }
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? 'Traitement...' : subscription ? 'Confirmer le changement' : 'Procéder au paiement'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
