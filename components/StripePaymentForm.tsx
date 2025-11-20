"use client";

import React, { useState, FormEvent } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { stripeService } from '../services/stripeService';

// CardElement styling options
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  loading?: boolean;
  buttonText?: string;
  showCardElement?: boolean;
}

/**
 * StripePaymentForm - Reusable payment form component with Stripe CardElement
 * 
 * Handles:
 * - Card input via Stripe CardElement
 * - Payment method creation
 * - Error handling
 * - Loading states
 * 
 * Usage:
 * <StripePaymentForm
 *   onSuccess={(paymentMethodId) => { ... }}
 *   onError={(error) => { ... }}
 *   buttonText="Payer"
 * />
 */
export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
  loading: externalLoading = false,
  buttonText = 'Confirmer le paiement',
  showCardElement = true,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const loading = externalLoading || internalLoading;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe n\'est pas encore chargé. Veuillez réessayer.');
      return;
    }

    setInternalLoading(true);
    setError(null);

    try {
      // Get CardElement
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Élément de carte non trouvé');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message || 'Erreur lors de la création du moyen de paiement');
      }

      if (!paymentMethod) {
        throw new Error('Aucun moyen de paiement créé');
      }

      // Success! Return payment method ID to parent
      onSuccess(paymentMethod.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Une erreur est survenue lors du paiement';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      {showCardElement && (
        <div className="card-element-container">
          <label className="card-element-label">
            Informations de carte bancaire
          </label>
          <div className="card-element-wrapper">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="stripe-error-message" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || (showCardElement && !cardComplete)}
        className="stripe-submit-button"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Traitement en cours...
          </>
        ) : (
          buttonText
        )}
      </button>

      <div className="stripe-secure-badge">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 0L2 3v4c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V3l-6-3z" fill="#00D924"/>
          <path d="M7 10L4.5 7.5l1-1L7 8l3.5-3.5 1 1L7 10z" fill="white"/>
        </svg>
        Paiement sécurisé par Stripe
      </div>
    </form>
  );
};
