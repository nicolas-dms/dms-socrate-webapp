"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Modal, Alert } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

export default function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status, plans, loading, changeTier, cancelSubscription, refreshSubscription } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Refresh subscription status when component mounts or when returning to page
  useEffect(() => {
    if (user) {
      console.log("Subscription plans page loaded, refreshing status...");
      refreshSubscription();
    }
  }, [user]); // Removed refreshSubscription from deps - it's a stable function

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
      // Change subscription tier using new backend method
      if (status?.tier !== selectedPlan.tier) {
        await changeTier(selectedPlan.tier);
        setMessage({
          type: 'success',
          text: `Abonnement changé avec succès vers ${selectedPlan.name}!`
        });
        setShowModal(false);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!status) return null;
    return plans.find(p => p.tier === status.tier);
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
            {status && (
              <Card className="mb-5 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Votre abonnement actuel</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h6>{getCurrentPlan()?.display_name}</h6>
                      <p className="mb-2">{getCurrentPlan()?.description}</p>
                      <p className="mb-0">
                        <strong>{status.monthly_used} / {status.monthly_quota}</strong> fiches utilisées ce mois
                        {status.addon_quota_remaining > 0 && (
                          <span className="text-success ms-2">
                            (+{status.addon_quota_remaining} packs additionnels)
                          </span>
                        )}
                      </p>
                    </Col>
                    <Col md={4} className="text-md-end">
                      <div className="h4 text-primary">
                        {getCurrentPlan()?.pricing[status.billing_period].price}€
                        <small className="text-muted">/{status.billing_period === 'monthly' ? 'mois' : 'an'}</small>
                      </div>
                      <span className={`badge ${status.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {status.status === 'active' ? 'Actif' : 'Annulé'}
                      </span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Subscription Plans */}
            <Row>
              {plans.map((plan, index) => {
                const isCurrentPlan = status?.tier === plan.tier;
                const currentPlan = getCurrentPlan();
                const currentPrice = currentPlan?.pricing[status?.billing_period || 'monthly'].price || 0;
                const planPrice = plan.pricing[status?.billing_period || 'monthly'].price;
                const isUpgrade = status && currentPlan && planPrice > currentPrice;
                const isDowngrade = status && currentPlan && planPrice < currentPrice;
                
                return (
                  <Col key={plan.tier} lg={4} md={6} className="mb-4">
                    <Card className={`h-100 position-relative ${isCurrentPlan ? 'border-primary shadow' : ''} ${plan.tier === 'standard' ? 'border-warning' : ''}`}>
                      {plan.tier === 'standard' && !isCurrentPlan && (
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
                        <h5 className="card-title mb-3">{plan.display_name}</h5>
                        
                        <div className="mb-3">
                          <div className="display-4 text-primary mb-2">
                            {plan.pricing[status?.billing_period || 'monthly'].price}€
                          </div>
                          <p className="text-muted">par {status?.billing_period === 'yearly' ? 'an' : 'mois'}</p>
                          {plan.pricing.yearly.price < plan.pricing.monthly.price * 12 && (
                            <small className="text-success">
                              Économisez {((plan.pricing.monthly.price * 12 - plan.pricing.yearly.price) / (plan.pricing.monthly.price * 12) * 100).toFixed(0)}% avec l'annuel
                            </small>
                          )}
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
                              variant={plan.tier === 'standard' ? 'warning' : isUpgrade ? 'primary' : 'outline-primary'}
                              onClick={() => handleSelectPlan(plan)}
                              className="w-100"
                            >
                              {!status ? 'Choisir ce plan' : 
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
              {status ? 'Changer d\'abonnement' : 'Confirmer votre abonnement'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPlan && (
              <div>
                <h6>Plan sélectionné : {selectedPlan.display_name}</h6>
                <p className="text-muted mb-3">{selectedPlan.description}</p>
                
                <div className="bg-light p-3 rounded mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Prix {status?.billing_period === 'yearly' ? 'annuel' : 'mensuel'} :</span>
                    <strong>{selectedPlan.pricing[status?.billing_period || 'monthly'].price}€</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Quota mensuel :</span>
                    <strong>{selectedPlan.monthly_quota} fiches/mois</strong>
                  </div>
                </div>

                <p className="small text-muted mb-0">
                  {status 
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
              {actionLoading ? 'Traitement...' : status ? 'Confirmer le changement' : 'Procéder au paiement'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
