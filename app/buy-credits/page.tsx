"use client";
import { useCredits } from "../../context/CreditsContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ProtectedPage from "../../components/ProtectedPage";

export default function BuyCreditsPage() {const { credits, packages, loading: creditsLoading, purchaseCredits } = useCredits();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<{id: string, credits: number, price: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBuy = (pkg: {id: string, credits: number, price: number}) => {
    setSelected(pkg);
    setShowModal(true);
    setSuccess(false);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    
    setLoading(true);
    try {
      // Mock payment data - in real implementation, integrate with Stripe
      const paymentData = {
        payment_method: 'stripe',
        transaction_id: `mock_${Date.now()}`,
      };
      
      const success = await purchaseCredits(selected.id, paymentData);
      if (success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while credits are being fetched
  if (creditsLoading && !credits) {
    return (
      <ProtectedPage>
        <div className="container mt-5" style={{maxWidth: 500}}>
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
          </div>
        </div>
      </ProtectedPage>
    );
  }
  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 500}}>
        <h2 className="mb-4">{t('credits.title')}</h2>
        <div className="mb-3">
          {t('credits.currentBalance')}: <b>{credits?.current_balance || 0}</b> {t('credits.credits')}
        </div>
        <div className="d-flex flex-column gap-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="d-flex justify-content-between align-items-center border rounded p-3 bg-white">
              <div>
                <div><b>{pkg.credits} {t('credits.credits')}</b></div>
                <div className="text-muted">{pkg.price} {pkg.currency || '€'}</div>
              </div>
              <Button onClick={() => handleBuy(pkg)}>{t('credits.buy')}</Button>
            </div>
          ))}
        </div>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('credits.confirmPurchase')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {success ? (
              <div className="alert alert-success">{t('credits.purchaseSuccessful')}</div>
            ) : (
              <>
                <div>{t('credits.package')}: <b>{selected?.credits}</b> {t('credits.credits')}</div>
                <div>{t('credits.price')}: <b>{selected?.price} €</b></div>
                <Button className="mt-3 w-100" onClick={handleConfirm} disabled={loading}>
                  {loading ? t('credits.processing') : t('credits.payMockStripe')}
                </Button>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </ProtectedPage>
  );
}
