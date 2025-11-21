"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useStripe } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { stripeService } from '../services/stripeService';
import { SubscriptionTier, BillingPeriod } from '../types/subscription';
import { useAuth } from '../context/AuthContext';

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
  currentTier?: SubscriptionTier;
  hasStripeSubscription?: boolean;
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
  currentTier = 'freemium',
  hasStripeSubscription = false,
}) => {
  const stripe = useStripe();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prorationAmount, setProrationAmount] = useState<number | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);

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

  // Calculate proration when modal opens (only if user has existing Stripe subscription)
  useEffect(() => {
    if (!show) {
      setProrationAmount(null);
      return;
    }
    
    if (tier !== 'freemium' && hasStripeSubscription) {
      loadProration();
    } else {
      setProrationAmount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, tier, billingPeriod, hasStripeSubscription]);

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!stripe) return;

    console.log('💳 [Payment Modal] Processing payment:', {
      tier,
      billingPeriod,
      paymentMethodId: paymentMethodId ? `${paymentMethodId.substring(0, 10)}...` : 'NULL',
      hasStripeSubscription,
      currentTier
    });

    setLoading(true);
    try {
      if (!user?.email) {
        throw new Error('Email utilisateur non disponible');
      }
      
      // Create subscription via backend
      console.log('💳 [Payment Modal] Calling createSubscription...');
      const result = await stripeService.createSubscription(
        tier,
        billingPeriod,
        paymentMethodId,
        user.email
      );
      
      console.log('✅ [Payment Modal] Subscription created:', result);

      // Check subscription status
      if (result.status === 'incomplete') {
        console.warn('⚠️ [Payment Modal] Subscription status is incomplete');
        
        // If there's a client_secret, we need to confirm the payment
        if (result.client_secret) {
          console.log('🔐 [Payment Modal] Confirming payment with 3D Secure...');
          const { error: confirmError } = await stripe.confirmCardPayment(
            result.client_secret
          );

          if (confirmError) {
            throw new Error(confirmError.message || 'Échec de la confirmation du paiement');
          }
          console.log('✅ [Payment Modal] Payment confirmed successfully');
        } else {
          // Incomplete without client_secret means backend issue
          console.error('❌ [Payment Modal] Subscription incomplete but no client_secret provided');
          throw new Error('L\'abonnement n\'a pas pu être finalisé. Le paiement n\'a pas été traité correctement par le serveur.');
        }
      } else if (result.client_secret) {
        // Status is not incomplete but client_secret exists (shouldn't happen, but handle it)
        console.log('🔐 [Payment Modal] Confirming payment...');
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Échec de la confirmation du paiement');
        }
      }

      // Success!
      console.log('✅ [Payment Modal] Payment successful, closing modal');
      onSuccess();
      onHide();
    } catch (error: any) {
      console.error('❌ [Payment Modal] Payment failed:', {
        status: error.response?.status,
        detail: error.response?.data?.detail,
        detailStringified: JSON.stringify(error.response?.data?.detail, null, 2),
        data: error.response?.data,
        message: error.message
      });
      
      // Extract error message from detail array if present
      let errorMessage = 'Erreur lors de la création de l\'abonnement';
      const status = error.response?.status;
      
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        const firstError = error.response.data.detail[0];
        if (firstError?.msg) {
          errorMessage = firstError.msg;
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Provide user-friendly messages for common errors
      if (status === 500) {
        errorMessage = 'Erreur serveur lors de la création de l\'abonnement. Veuillez contacter le support si le problème persiste.';
      } else if (status === 422) {
        if (errorMessage.includes('user_email')) {
          errorMessage = 'Email utilisateur manquant. Veuillez vous reconnecter.';
        }
      } else if (status === 401 || status === 403) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      }
      
      console.error('❌ [Payment Modal] Error message:', errorMessage);
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
