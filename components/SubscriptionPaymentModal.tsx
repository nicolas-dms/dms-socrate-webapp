"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useStripe } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { stripeService } from '../services/stripeService';
import { SubscriptionTier, BillingPeriod } from '../types/subscription';

interface SubscriptionPaymentModalProps {
  show: boolean;
  onHide: () => void;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  onSuccess: () => void;
  onError: (error: string) => void;
  tierDisplayName: string;
  price: number;
  features: string[];
}

/**
 * SubscriptionPaymentModal - Modal for subscription payment
 * 
 * Handles:
 * - Display of subscription details
 * - Proration calculation for upgrades
 * - Payment form
 * - Payment confirmation with 3D Secure
 * - Success/error callbacks
 */
export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  show,
  onHide,
  tier,
  billingPeriod,
  onSuccess,
  onError,
  tierDisplayName,
  price,
  features,
}) => {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [prorationAmount, setProrationAmount] = useState<number | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);

  // Calculate proration when modal opens
  useEffect(() => {
    if (show && tier !== 'freemium') {
      loadProration();
    }
  }, [show, tier, billingPeriod]);

  const loadProration = async () => {
    setLoadingProration(true);
    try {
      const proration = await stripeService.calculateProration(tier, billingPeriod);
      setProrationAmount(proration.amount);
    } catch (error) {
      // Proration might fail if no existing subscription, that's ok
      console.log('Proration calculation skipped:', error);
      setProrationAmount(null);
    } finally {
      setLoadingProration(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!stripe) return;

    setLoading(true);
    try {
      // Create subscription via backend
      const result = await stripeService.createSubscription(
        tier,
        billingPeriod,
        paymentMethodId
      );

      // Handle 3D Secure if needed
      if (result.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Échec de la confirmation du paiement');
        }
      }

      // Success!
      onSuccess();
      onHide();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la création de l\'abonnement';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    onError(error);
  };

  const formatPrice = (amount: number) => {
    return amount.toFixed(2).replace('.', ',');
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ color: '#0070f3' }}>🔒</span> Paiement sécurisé
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="subscription-payment-summary">
          <h5 className="mb-3">Récapitulatif de votre abonnement</h5>

          <div className="plan-details">
            <div className="plan-header">
              <h4>{tierDisplayName}</h4>
              <div className="plan-price">
                {formatPrice(price)}€
                <span className="price-period">
                  /{billingPeriod === 'monthly' ? 'mois' : 'an'}
                </span>
              </div>
            </div>

            <div className="plan-features">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-checkmark">✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {loadingProration && (
            <div className="proration-loading">
              Calcul du montant...
            </div>
          )}

          {prorationAmount !== null && prorationAmount > 0 && (
            <div className="proration-info">
              <div className="proration-badge">
                <strong>Montant à payer aujourd'hui :</strong>
                <span className="proration-amount">
                  {formatPrice(prorationAmount)}€
                </span>
              </div>
              <p className="proration-explanation">
                Montant calculé au prorata de votre période actuelle
              </p>
            </div>
          )}

          <hr />

          <StripePaymentForm
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            loading={loading}
            buttonText={`Payer ${prorationAmount !== null && prorationAmount > 0 ? formatPrice(prorationAmount) : formatPrice(price)}€`}
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Annuler
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
