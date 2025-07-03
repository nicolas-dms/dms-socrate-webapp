"use client";
import { useCredits } from "../../context/CreditsContext";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ProtectedPage from "../../components/ProtectedPage";

const PACKAGES = [
  { credits: 50, price: 5 },
  { credits: 200, price: 15 },
  { credits: 500, price: 30 },
];

export default function BuyCreditsPage() {
  const { credits, buyCredits } = useCredits();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<{credits: number, price: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBuy = (pkg: {credits: number, price: number}) => {
    setSelected(pkg);
    setShowModal(true);
    setSuccess(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await buyCredits(selected!.credits); // mock
    setLoading(false);
    setSuccess(true);
  };

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 500}}>
        <h2 className="mb-4">Buy Credits</h2>
        <div className="mb-3">Current balance: <b>{credits}</b> credits</div>
        <div className="d-flex flex-column gap-3">
          {PACKAGES.map(pkg => (
            <div key={pkg.credits} className="d-flex justify-content-between align-items-center border rounded p-3 bg-white">
              <div>
                <div><b>{pkg.credits} credits</b></div>
                <div className="text-muted">{pkg.price} €</div>
              </div>
              <Button onClick={() => handleBuy(pkg)}>Buy</Button>
            </div>
          ))}
        </div>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Purchase</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {success ? (
              <div className="alert alert-success">Purchase successful! Your credits have been updated.</div>
            ) : (
              <>
                <div>Package: <b>{selected?.credits}</b> credits</div>
                <div>Price: <b>{selected?.price} €</b></div>
                <Button className="mt-3 w-100" onClick={handleConfirm} disabled={loading}>
                  {loading ? "Processing..." : "Pay (mock Stripe)"}
                </Button>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </ProtectedPage>
  );
}
