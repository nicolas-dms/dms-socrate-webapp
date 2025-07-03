"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Step 1: Ask for email and "send" magic link (mocked)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Mock sending magic link
    setShowCodeModal(true);
  };

  // Step 2: Ask for code and "verify" (mocked)
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Mock code verification: always succeed
    await login(email, code); // code is not used in mock
    setShowCodeModal(false);
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleEmailSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-100">
          {loading ? "Sending..." : "Send Magic Link"}
        </Button>
      </form>
      <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enter Magic Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCodeSubmit}>
            <div className="mb-3">
              <label className="form-label">Code</label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <Button type="submit" disabled={loading} className="w-100">
              {loading ? "Verifying..." : "Verify Code & Login"}
            </Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
