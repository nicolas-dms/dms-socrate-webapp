"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { validators } from "../../utils/validators";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, sendMagicCode, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  // Email validation function
  const isValidEmail = (email: string): boolean => {
    return validators.isValidEmail(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError("");
    
    // Validate email format if not empty
    if (newEmail && !isValidEmail(newEmail)) {
      setEmailError(t('auth.invalidEmailFormat'));
    }
  };// Step 1: Ask for email and send magic code
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setEmailError("");
    
    // Validate email before sending
    if (!email) {
      setEmailError(t('auth.emailRequired'));
      return;
    }
    
    if (!isValidEmail(email)) {
      setEmailError(t('auth.invalidEmailFormat'));
      return;
    }
    
    try {
      const result = await sendMagicCode(email);
      if (result.success) {
        setSuccess(result.message || "Code sent successfully! Check your email.");
        setShowCodeModal(true);
      } else {
        setError(result.message || "Failed to send code. Please try again.");
      }
    } catch (err) {
      setError("Failed to send code. Please check your email address.");
    }
  };
  // Step 2: Verify code and login
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate verification code
    const codeValidation = validators.validateVerificationCode(code);
    if (!codeValidation.isValid) {
      setError(t('auth.invalidCodeFormat'));
      return;
    }
    
    try {
      const result = await login(email, code);
      if (result.success) {
        setShowCodeModal(false);
        // Show welcome message for new users
        if (result.isNewUser) {
          setSuccess(result.message || t('auth.welcomeNewUser'));
        } else {
          setSuccess(result.message || t('auth.welcomeBackUser'));
        }
        router.push("/generate"); // Redirect to exercise generation page
      } else {
        setError(result.message || "Invalid code. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please check your code.");
    }
  };

  // Helper for 6-digit code input
  const handleCodeBoxChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    if (!val && code.length > idx) {
      // Remove digit
      setCode(code.slice(0, idx) + code.slice(idx + 1));
      return;
    }
    let newCode = code.split("");
    newCode[idx] = val;
    setCode(newCode.join("").slice(0, 6));
    // Move focus to next box if filled
    if (val && idx < 5) {
      const next = document.getElementById(`code-box-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <input
          key={i}
          id={`code-box-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="form-control d-inline-block text-center mx-1 code-box"
          style={{ width: 40, fontSize: 24, borderRadius: 8, border: "1px solid #d6cbb3", background: "#f8f6f1" }}
          value={code[i] || ""}
          onChange={e => handleCodeBoxChange(e, i)}
          autoFocus={i === 0}
        />
      );
    }
    return (
      <div className="mb-3 d-flex justify-content-center">{boxes}</div>
    );
  };return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2 className="mb-4">{t('login')}</h2>
      
      {/* Show success message */}
      {success && <Alert variant="success">{success}</Alert>}
        <form onSubmit={handleEmailSubmit}>
        <div className="mb-3">
          <label className="form-label">{t('auth.email')}</label>
          <input
            type="email"
            className={`form-control ${emailError ? 'is-invalid' : email && isValidEmail(email) ? 'is-valid' : ''}`}
            value={email}
            onChange={handleEmailChange}
            placeholder="example@domain.com"
            required
            disabled={loading}
          />
          {emailError && (
            <div className="invalid-feedback">
              {emailError}
            </div>
          )}
          {email && isValidEmail(email) && (
            <div className="valid-feedback">
              {t('auth.validEmail')}
            </div>
          )}
        </div>
          {/* Show error message */}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Button 
          type="submit" 
          disabled={loading || !email || !isValidEmail(email) || !!emailError} 
          className="w-100"
          variant={email && isValidEmail(email) ? "primary" : "secondary"}
        >
          {loading ? t('auth.sending') : t('auth.sendMagicLink')}
        </Button>
        
        {/* Helper text */}
        <small className="text-muted mt-2 d-block">
          {t('auth.emailHelperText')}
        </small>
      </form>
      
      <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('auth.enterMagicCode')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCodeSubmit}>            <label className="form-label">{t('auth.code')}</label>
            {renderCodeBoxes()}
            {/* Hide the old input */}
            <input type="hidden" value={code} required minLength={6} maxLength={6} readOnly />
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <Button 
              type="submit" 
              disabled={loading || !validators.isValidVerificationCode(code)} 
              className="w-100 mt-3"
              variant={validators.isValidVerificationCode(code) ? "primary" : "secondary"}
            >
              {loading ? t('auth.verifying') : t('auth.verifyCodeLogin')}
            </Button>
            
            {/* Code validation feedback */}
            {code.length > 0 && code.length < 6 && (
              <small className="text-muted mt-2 d-block">
                {t('auth.codeProgress', { current: code.length, total: 6 })}
              </small>
            )}
          </form>        </Modal.Body>
      </Modal>
    </div>
  );
}
