"use client";

import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useStripe } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { stripeService } from '../services/stripeService';

interface AddonPackPaymentModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: (packsAdded: number, quotasAdded: number) => void;
  onError: (error: string) => void;
  packSize: number;
  packPrice: number;
}

/**
 * AddonPackPaymentModal - Modal for purchasing addon packs
 * 
 * Allows users to:
 * - Select number of packs (1-10)
 * - See total cost and total fiches
 * - Complete payment
 * - Handle 3D Secure confirmation
 */
export const AddonPackPaymentModal: React.FC<AddonPackPaymentModalProps> = ({
  show,
  onHide,
  onSuccess,
  onError,
  packSize = 15,
  packPrice = 0.99,
}) => {
  const stripe = useStripe();
  const [numPacks, setNumPacks] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPrice = numPacks * packPrice;
  const totalQuotas = numPacks * packSize;

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!stripe) return;

    setLoading(true);
    try {
      // Purchase addon packs via backend
      const result = await stripeService.purchaseAddonPacks(numPacks, paymentMethodId);

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
      onSuccess(result.packs_purchased, result.quotas_added);
      onHide();
      
      // Reset form
      setNumPacks(1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de l\'achat des packs';
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

  const handleNumPacksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setNumPacks(Math.max(1, Math.min(10, value)));
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ color: '#0070f3' }}>🎁</span> Acheter des fiches supplémentaires
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="addon-pack-payment">
          <div className="pack-info-card">
            <h5 className="mb-3">Pack de fiches</h5>
            <p className="pack-description">
              Chaque pack contient <strong>{packSize} fiches supplémentaires</strong> qui
              s'ajoutent à votre compte et sont consommées en priorité avant vos quotas mensuels.
            </p>
          </div>

          <div className="pack-selector">
            <Form.Group className="mb-4">
              <Form.Label>
                <strong>Nombre de packs</strong>
              </Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-primary"
                  onClick={() => setNumPacks(Math.max(1, numPacks - 1))}
                  disabled={numPacks <= 1 || loading}
                >
                  −
                </Button>
                <Form.Control
                  type="number"
                  min={1}
                  max={10}
                  value={numPacks}
                  onChange={handleNumPacksChange}
                  disabled={loading}
                  style={{ width: '100px', textAlign: 'center' }}
                />
                <Button
                  variant="outline-primary"
                  onClick={() => setNumPacks(Math.min(10, numPacks + 1))}
                  disabled={numPacks >= 10 || loading}
                >
                  +
                </Button>
              </div>
              <Form.Text className="text-muted">
                Maximum 10 packs par achat
              </Form.Text>
            </Form.Group>

            <div className="pack-summary">
              <div className="summary-row">
                <span>Prix unitaire :</span>
                <strong>{formatPrice(packPrice)}€</strong>
              </div>
              <div className="summary-row">
                <span>{numPacks} pack{numPacks > 1 ? 's' : ''} × {packSize} fiches :</span>
                <strong className="text-primary">{totalQuotas} fiches</strong>
              </div>
              <hr />
              <div className="summary-row total">
                <span className="total-label">Total à payer :</span>
                <strong className="total-amount">{formatPrice(totalPrice)}€</strong>
              </div>
            </div>
          </div>

          <hr />

          <StripePaymentForm
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            loading={loading}
            buttonText={`Payer ${formatPrice(totalPrice)}€`}
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
