"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ProgressBar, Modal } from "react-bootstrap";
import { useRouter } from 'next/navigation';
import { Elements, useStripe } from "@stripe/react-stripe-js";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { SubscriptionPaymentModal } from "../../components/SubscriptionPaymentModal";
import { AddonPackPaymentModal } from "../../components/AddonPackPaymentModal";
import { userService, educationUserService } from "../../services/userService";
import { subscriptionService } from "../../services/subscriptionService";
import type { SubscriptionStatus } from "../../types/subscription";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout, userPreferences, updateUserPreferences } = useAuth();
  const { status, usageView, plans, history, loading, changeTier, changeBillingPeriod, buyAddonPack, cancelSubscription, reactivateSubscription, refreshSubscription } = useSubscription();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"profile" | "subscription" | "support" | "admin">("profile");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile edit mode states
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [savedFields, setSavedFields] = useState<{level: boolean; theme: boolean; duration: boolean}>({level: false, theme: false, duration: false});
  const [savingField, setSavingField] = useState<'level' | 'theme' | 'duration' | null>(null);
  
  // Addon pack purchase state


  // Cancel/Reactivate confirmation modals
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  // Stripe payment modals state
  const [showStripeSubscriptionModal, setShowStripeSubscriptionModal] = useState(false);
  const [showStripeAddonModal, setShowStripeAddonModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<"standard" | "famille_plus" | null>(null);
  const [pendingBillingPeriod, setPendingBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  // Support form states
  const [supportForm, setSupportForm] = useState({
    type: 'bug',
    subject: '',
    message: ''
  });
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportMessage, setSupportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Console states (Admin)
  const [userConsoleEmail, setUserConsoleEmail] = useState('');
  const [userConsoleData, setUserConsoleData] = useState<any>(null);
  const [userConsoleSubscription, setUserConsoleSubscription] = useState<SubscriptionStatus | null>(null);
  const [userConsoleCredits, setUserConsoleCredits] = useState<any>(null);
  const [userConsoleLoading, setUserConsoleLoading] = useState(false);
  const [userConsoleMessage, setUserConsoleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingUserPrefs, setEditingUserPrefs] = useState(false);
  const [editedPrefs, setEditedPrefs] = useState({ default_level: '', default_domain: '', default_period: '' });
  
  // Quota update states
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaOperation, setQuotaOperation] = useState<'set' | 'add' | 'subtract'>('add');
  const [quotaAmount, setQuotaAmount] = useState<number>(0);
  const [quotaType, setQuotaType] = useState<'monthly' | 'addon'>('addon');
  const [quotaReason, setQuotaReason] = useState('');
  const [showQuotaConfirm, setShowQuotaConfirm] = useState(false);
  const [quotaUpdating, setQuotaUpdating] = useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === 'nicolas.pernot78@gmail.com';

  // Debug: log status changes
  useEffect(() => {
    if (status) {
      console.log("=== Current Subscription Status ===");
      console.log("Tier:", status.tier);
      console.log("Pending Tier:", status.pending_tier);
      console.log("Pending Billing Period:", status.pending_billing_period);
      console.log("Auto Renewal:", status.auto_renewal);
      console.log("===================================");
    }
  }, [status]);

  // Refresh subscription status when switching to subscription tab or on mount if already on subscription tab
  useEffect(() => {
    if (activeSection === "subscription" && user) {
      console.log("Subscription tab activated, refreshing status...");
      refreshSubscription();
    }
  }, [activeSection, user]); // Removed refreshSubscription from deps to avoid unnecessary re-runs

  // User Console: Search for user by email
  const handleUserConsoleSearch = async () => {
    if (!userConsoleEmail.trim()) {
      setUserConsoleMessage({ type: 'error', text: 'Veuillez saisir un email' });
      return;
    }

    setUserConsoleLoading(true);
    setUserConsoleMessage(null);
    setUserConsoleData(null);
    setUserConsoleSubscription(null);
    setUserConsoleCredits(null);

    try {
      // Fetch user data with preferences
      const userData = await userService.getUserWithPreferences(userConsoleEmail.trim());
      setUserConsoleData(userData);
      setEditedPrefs({
        default_level: userData.user_preferences?.default_level || 'CE2',
        default_domain: userData.user_preferences?.default_domain || 'tous',
        default_period: userData.user_preferences?.default_period || '20 min'
      });

      // Fetch subscription status
      try {
        const subscriptionData = await subscriptionService.getStatus(userConsoleEmail.trim());
        setUserConsoleSubscription(subscriptionData);
      } catch (subError) {
        console.warn('Subscription data not found for user');
      }

      // Fetch credits data
      try {
        const creditsData = await educationUserService.getAppData(userConsoleEmail.trim());
        setUserConsoleCredits(creditsData.user_credits);
      } catch (credError) {
        console.warn('Credits data not found for user');
      }

      setUserConsoleMessage({ type: 'success', text: 'Utilisateur trouvé' });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setUserConsoleMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Utilisateur non trouvé' 
      });
    } finally {
      setUserConsoleLoading(false);
    }
  };

  // User Console: Update user preferences
  const handleUpdateUserPreferences = async () => {
    if (!userConsoleData?.email) return;

    setUserConsoleLoading(true);
    setUserConsoleMessage(null);

    try {
      await userService.updateUserPreferences(userConsoleData.email, editedPrefs);
      setUserConsoleMessage({ type: 'success', text: 'Préférences mises à jour avec succès' });
      setEditingUserPrefs(false);
      // Refresh user data
      await handleUserConsoleSearch();
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setUserConsoleMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Erreur lors de la mise à jour' 
      });
    } finally {
      setUserConsoleLoading(false);
    }
  };

  // Quota Update: Open modal
  const handleOpenQuotaModal = () => {
    setQuotaOperation('add');
    setQuotaAmount(0);
    setQuotaType('addon');
    setQuotaReason('');
    setShowQuotaModal(true);
    setShowQuotaConfirm(false);
  };

  // Quota Update: First confirmation (show summary)
  const handleQuotaFirstConfirm = () => {
    if (!quotaReason.trim() || quotaReason.length < 10) {
      setUserConsoleMessage({ 
        type: 'error', 
        text: 'La raison doit contenir au moins 10 caractères' 
      });
      return;
    }
    if (quotaAmount < 0) {
      setUserConsoleMessage({ 
        type: 'error', 
        text: 'Le montant doit être positif' 
      });
      return;
    }
    setShowQuotaConfirm(true);
  };

  // Quota Update: Final confirmation and execution
  const handleQuotaFinalConfirm = async () => {
    if (!userConsoleData?.email) return;

    setQuotaUpdating(true);
    setUserConsoleMessage(null);

    try {
      console.log('🔧 Sending quota update request:', {
        email: userConsoleData.email,
        operation: quotaOperation,
        quota_amount: quotaAmount,
        quota_type: quotaType,
        reason: quotaReason,
        admin_email: user?.email
      });

      const result = await subscriptionService.adminUpdateQuota(userConsoleData.email, {
        operation: quotaOperation,
        quota_amount: quotaAmount,
        quota_type: quotaType,
        reason: quotaReason,
        admin_email: user?.email
      });

      console.log('✅ Quota update success:', result);

      setUserConsoleMessage({ 
        type: 'success', 
        text: `✅ ${result.message}\n${result.previous_value} → ${result.new_value} (${quotaType})` 
      });
      
      // Close modal and refresh data
      setShowQuotaModal(false);
      setShowQuotaConfirm(false);
      await handleUserConsoleSearch();
      
    } catch (error: any) {
      console.error('❌ Error updating quota:', error);
      
      // Create detailed error message
      let errorText = '❌ Erreur lors de la mise à jour du quota';
      
      if (error.message) {
        errorText += `:\n\n${error.message}`;
      }
      
      // Add suggestion if it's a backend error
      if (error.message?.includes('metadata') || error.message?.includes('attribute')) {
        errorText += '\n\n💡 Ceci semble être une erreur backend. Vérifiez que le modèle SubscriptionData a bien un champ "metadata" défini.';
      }
      
      setUserConsoleMessage({ 
        type: 'error', 
        text: errorText
      });
      
      // Keep modal open on error so user can see the error and try again
      setShowQuotaConfirm(false); // Go back to step 1
    } finally {
      setQuotaUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    // Redirect will be handled by the auth context
  };

  // Cancel a pending downgrade by re-selecting the current tier
  const handleCancelPendingChange = async () => {
    if (!status || !status.pending_tier) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      console.log(`Cancelling pending change from ${status.tier} to ${status.pending_tier}`);
      // Call change-tier with current tier to cancel the pending change
      const result = await changeTier(status.tier, status.billing_period);
      console.log('Cancel pending change result:', result);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Le changement vers ${getTierDisplayName(status.pending_tier)} a été annulé. Votre abonnement ${getTierDisplayName(status.tier)} continuera automatiquement.`
        });
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error: any) {
      console.error('Error cancelling pending change:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || "Erreur lors de l'annulation du changement"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTierChange = async (newTier: 'freemium' | 'standard' | 'famille_plus') => {
    if (!status) return;
    
    // Determine if this is an upgrade that requires payment
    const tierHierarchy = { 'freemium': 0, 'standard': 1, 'famille_plus': 2 };
    const currentTierLevel = tierHierarchy[status.tier];
    const newTierLevel = tierHierarchy[newTier];
    const isUpgrade = newTierLevel > currentTierLevel;
    
    // Check if Stripe payment is required (any upgrade to a paid tier)
    if (isUpgrade && (newTier === 'standard' || newTier === 'famille_plus')) {
      // Open Stripe payment modal for upgrades
      console.log(`Opening Stripe modal for upgrade from ${status.tier} to ${newTier}`);
      setPendingTier(newTier);
      setPendingBillingPeriod(status.billing_period || "monthly");
      setShowStripeSubscriptionModal(true);
      return;
    }
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      console.log(`Changing tier from ${status.tier} to ${newTier}`);
      const result = await changeTier(newTier);
      console.log('Change tier result:', result);
      
      if (result.success) {
        // Check if this is canceling a pending change (re-selecting current tier)
        if (status.tier === newTier && status.pending_tier) {
          setMessage({
            type: 'success',
            text: `Le changement vers ${getTierDisplayName(status.pending_tier)} a été annulé. Votre abonnement ${getTierDisplayName(newTier)} se renouvellera automatiquement.`
          });
        } else {
          // Determine if upgrade or downgrade based on tier hierarchy
          const tierHierarchy = { 'freemium': 0, 'standard': 1, 'famille_plus': 2 };
          const currentTierLevel = tierHierarchy[status.tier];
          const newTierLevel = tierHierarchy[newTier];
          
          if (newTierLevel > currentTierLevel) {
            // Upgrade - applied immediately
            setMessage({
              type: 'success',
              text: `Félicitations ! Votre plan a été mis à niveau vers ${getTierDisplayName(newTier)}. Vos quotas ont été réinitialisés.`
            });
          } else if (newTierLevel < currentTierLevel) {
            // Downgrade - deferred to renewal_date
            setMessage({
              type: 'success',
              text: `Votre changement de plan vers ${getTierDisplayName(newTier)} est programmé pour le ${formatDate(status.renewal_date)}. Vous conservez votre plan actuel et vos quotas jusqu'à cette date.`
            });
          } else {
            setMessage({
              type: 'success',
              text: result.message
            });
          }
        }
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error: any) {
      console.error('Error changing tier:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBillingPeriodChange = async (newPeriod: 'monthly' | 'yearly') => {
    if (!status) return;
    
    setActionLoading(true);
    setMessage(null);
    
    try {
      await changeBillingPeriod(newPeriod);
      setMessage({
        type: 'success',
        text: 'Période de facturation modifiée avec succès'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };



  // Stripe Subscription Payment Success Handler
  const handleStripeSubscriptionSuccess = () => {
    setShowStripeSubscriptionModal(false);
    setMessage({
      type: 'success',
      text: `Félicitations ! Votre abonnement ${getTierDisplayName(pendingTier!)} a été créé avec succès.`
    });
    setPendingTier(null);
    // Refresh subscription status
    refreshSubscription();
  };

  // Stripe Subscription Payment Error Handler
  const handleStripeSubscriptionError = (error: string) => {
    setShowStripeSubscriptionModal(false);
    setMessage({
      type: 'error',
      text: `Erreur lors du paiement: ${error}`
    });
    setPendingTier(null);
  };

  // Stripe Addon Pack Payment Success Handler
  const handleStripeAddonSuccess = (packsAdded: number, quotasAdded: number) => {
    setShowStripeAddonModal(false);
    // Only show message if we have valid data from backend
    if (packsAdded && quotasAdded) {
      setMessage({
        type: 'success',
        text: `${packsAdded} pack${packsAdded > 1 ? 's' : ''} acheté${packsAdded > 1 ? 's' : ''} avec succès ! ${quotasAdded} fiches ajoutées.`
      });
    }
    // Refresh subscription status
    refreshSubscription();
  };

  // Stripe Addon Pack Payment Error Handler
  const handleStripeAddonError = (error: string) => {
    setShowStripeAddonModal(false);
    setMessage({
      type: 'error',
      text: `Erreur lors du paiement: ${error}`
    });
  };

  const handleCancelSubscription = async () => {
    setShowCancelConfirm(false);
    setActionLoading(true);
    setMessage(null);
    
    try {
      const result = await cancelSubscription();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setShowReactivateConfirm(false);
    setActionLoading(true);
    setMessage(null);
    
    try {
      const result = await reactivateSubscription();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
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
    if (!status) return null;
    return plans.find(p => p.tier === status.tier);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'freemium': return 'Gratuit';
      case 'standard': return 'Standard';
      case 'famille_plus': return 'Famille+';
      default: return tier;
    }
  };

  // Translate backend feature keys to user-friendly French text
  const translateFeatures = (features: string[]): string[] => {
    const featureMap: Record<string, string> = {
      'basic_exercises': 'Exercices de base',
      'pdf_download': 'Téléchargement PDF',
      'advanced_exercises': 'Exercices avancés',
      'statistics': 'Statistiques',
      'multi_user': 'Multi-utilisateur',
      'priority_support': 'Support prioritaire'
    };

    return features.map(feature => featureMap[feature] || feature);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supportForm.subject.trim()) {
      setSupportMessage({
        type: 'error',
        text: 'Veuillez renseigner l\'objet de votre demande'
      });
      return;
    }

    setSupportSubmitting(true);
    setSupportMessage(null);

    try {
      // Get browser and device info
      const browserInfo = navigator.userAgent;
      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };

      // Simulate API call to support system
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, this would send to your support system
      console.log('Support ticket submitted:', {
        ...supportForm,
        user: user?.email,
        browserInfo,
        deviceInfo,
        timestamp: new Date().toISOString()
      });

      setSupportMessage({
        type: 'success',
        text: '✅ Votre demande a été envoyée avec succès ! Nous vous répondrons sous 24h en semaine.'
      });

      // Reset form
      setSupportForm({
        type: 'bug',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSupportMessage({
        type: 'error',
        text: 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.'
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row>
          <Col lg={10} className="mx-auto">

            {/* Navigation Tabs */}
            <div className="mb-4">
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveSection("profile"); window.scrollTo(0, 0); }}
                  style={{
                    backgroundColor: activeSection === "profile" ? '#eff6ff' : 'white',
                    color: activeSection === "profile" ? '#1e40af' : '#6b7280',
                    border: `2px solid ${activeSection === "profile" ? '#3b82f6' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "profile" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "profile" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "profile" ? '0 4px 8px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "profile") {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "profile") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-person me-1"></i>
                  Profil
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveSection("subscription"); window.scrollTo(0, 0); }}
                  style={{
                    backgroundColor: activeSection === "subscription" ? '#fef3c7' : 'white',
                    color: activeSection === "subscription" ? '#92400e' : '#6b7280',
                    border: `2px solid ${activeSection === "subscription" ? '#fbbf24' : '#e5e7eb'}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "subscription" ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "subscription" ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "subscription" ? '0 4px 8px rgba(251, 191, 36, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "subscription") {
                      e.currentTarget.style.backgroundColor = '#fef9e7';
                      e.currentTarget.style.borderColor = '#fcd34d';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "subscription") {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-star me-1"></i>
                  Abonnement
                </button>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (status?.tier === 'famille_plus') {
                      setActiveSection("support");
                      window.scrollTo(0, 0);
                    }
                  }}
                  disabled={status?.tier !== 'famille_plus'}
                  title={status?.tier !== 'famille_plus' ? "✨ Fonctionnalité Famille+\nDébloquez le support prioritaire\npour une assistance rapide et personnalisée." : ""}
                  style={{
                    backgroundColor: status?.tier !== 'famille_plus' ? '#f3f4f6' : (activeSection === "support" ? '#eff6ff' : 'white'),
                    color: status?.tier !== 'famille_plus' ? '#9ca3af' : (activeSection === "support" ? '#1e40af' : '#6b7280'),
                    border: `2px solid ${status?.tier !== 'famille_plus' ? '#e5e7eb' : (activeSection === "support" ? '#3b82f6' : '#e5e7eb')}`,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: activeSection === "support" ? '600' : '500',
                    cursor: status?.tier !== 'famille_plus' ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    transform: activeSection === "support" && status?.tier === 'famille_plus' ? 'translateY(-2px)' : 'none',
                    boxShadow: activeSection === "support" && status?.tier === 'famille_plus' ? '0 4px 8px rgba(59, 130, 246, 0.2)' : 'none',
                    opacity: status?.tier !== 'famille_plus' ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== "support" && status?.tier === 'famille_plus') {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#93c5fd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== "support" && status?.tier === 'famille_plus') {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <i className="bi bi-headset me-1"></i>
                  Support
                </button>
                {/* Section Admin - uniquement pour admin@exominutes.com */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setActiveSection("admin"); window.scrollTo(0, 0); }}
                    style={{
                      backgroundColor: activeSection === "admin" ? '#f8f9fa' : 'white',
                      color: activeSection === "admin" ? '#2c3e50' : '#6c757d',
                      border: `2px solid ${activeSection === "admin" ? '#dee2e6' : '#e9ecef'}`,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: activeSection === "admin" ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== "admin") {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== "admin") {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }
                    }}
                  >
                    <i className="bi bi-gear me-1"></i>
                    Administration
                  </button>
                )}
              </div>
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card style={{ 
                border: '2px solid #3b82f6', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#eff6ff',
                  borderBottom: '2px solid #93c5fd',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#1e40af' }}>
                    📄 Profil utilisateur
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {/* View-only mode */}
                  {!profileEditMode && (
                    <div className="mb-4">
                      <div className="mb-3">
                        <strong>Email :</strong>
                        <div className="ms-3" style={{ color: '#6b7280' }}>{user?.email || "N/A"}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Préférences :</strong>
                        <div className="ms-3" style={{ color: '#6b7280' }}>
                          <div>Niveau préféré : {userPreferences.default_level}</div>
                          <div>Durée par défaut : {userPreferences.default_period}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit mode */}
                  {profileEditMode && (
                    <div className="mb-4">
                      <div className="mb-3">
                        <strong>Email :</strong>
                        <div className="ms-3" style={{ color: '#6b7280' }}>{user?.email || "N/A"}</div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Niveau préféré :</strong>
                        <div className="d-flex align-items-center gap-2 ms-3">
                          <Form.Select
                            value={userPreferences.default_level}
                            disabled={savingField !== null}
                            onChange={async (e) => {
                              const newLevel = e.target.value;
                              setSavingField('level');
                              setSavedFields(prev => ({...prev, level: false}));
                              
                              try {
                                await updateUserPreferences({ default_level: newLevel });
                                console.log('✅ Level preference saved:', newLevel);
                                setSavedFields(prev => ({...prev, level: true}));
                                setTimeout(() => {
                                  setSavedFields(prev => ({...prev, level: false}));
                                }, 2000);
                              } catch (error) {
                                console.error('❌ Failed to save level preference:', error);
                              } finally {
                                setSavingField(null);
                              }
                            }}
                            style={{ maxWidth: '200px' }}
                          >
                            <option value="CP">CP</option>
                            <option value="CE1">CE1</option>
                            <option value="CE2">CE2</option>
                            <option value="CM1">CM1</option>
                            <option value="CM2">CM2</option>
                          </Form.Select>
                          {savingField === 'level' && (
                            <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Enregistrement...
                            </span>
                          )}
                          {savedFields.level && (
                            <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
                              ✔️ Enregistré
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <strong>Durée par défaut :</strong>
                        <div className="d-flex align-items-center gap-2 ms-3">
                          <Form.Select
                            value={userPreferences.default_period}
                            disabled={savingField !== null}
                            onChange={async (e) => {
                              const newDuration = e.target.value;
                              setSavingField('duration');
                              setSavedFields(prev => ({...prev, duration: false}));
                              
                              try {
                                await updateUserPreferences({ default_period: newDuration });
                                console.log('✅ Duration preference saved:', newDuration);
                                setSavedFields(prev => ({...prev, duration: true}));
                                setTimeout(() => {
                                  setSavedFields(prev => ({...prev, duration: false}));
                                }, 2000);
                              } catch (error) {
                                console.error('❌ Failed to save duration preference:', error);
                              } finally {
                                setSavingField(null);
                              }
                            }}
                            style={{ maxWidth: '200px' }}
                          >
                            <option value="10 min">10 min</option>
                            <option value="20 min">20 min</option>
                            <option value="30 min">30 min</option>
                          </Form.Select>
                          {savingField === 'duration' && (
                            <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Enregistrement...
                            </span>
                          )}
                          {savedFields.duration && (
                            <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
                              ✔️ Enregistré
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    variant={profileEditMode ? "outline-primary" : "primary"}
                    size="sm"
                    className="mb-4"
                    disabled={savingField !== null}
                    onClick={() => setProfileEditMode(!profileEditMode)}
                    style={{
                      backgroundColor: profileEditMode ? 'white' : '#3b82f6',
                      color: profileEditMode ? '#3b82f6' : 'white',
                      border: profileEditMode ? '2px solid #3b82f6' : 'none',
                      padding: '8px 16px'
                    }}
                  >
                    {profileEditMode ? '✔️ Terminer' : '🟦 Modifier mes informations'}
                  </Button>

                  <hr style={{ 
                    margin: '1.5rem 0',
                    border: 'none',
                    borderTop: '2px solid #e5e7eb'
                  }} />

                  <div style={{
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Gestion du compte
                    </div>
                    <Button 
                      variant="outline-danger"
                      onClick={() => setShowLogoutConfirm(true)}
                      style={{
                        padding: '8px 18px',
                        fontWeight: '500',
                        maxWidth: '200px'
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Se déconnecter
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Subscription Section */}
            {activeSection === "subscription" && (
              <Card style={{ 
                border: '2px solid #fbbf24', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#fef3c7',
                  borderBottom: '2px solid #fcd34d',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#92400e' }}>
                    <i className="bi bi-star-fill me-2" style={{ color: '#f59e0b' }}></i>
                    Mon abonnement
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {message && (
                    <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
                      {message.text}
                    </Alert>
                  )}

                {/* Current Subscription */}
                {status && (
                  <>
                    {/* Warning banner if auto_renewal is false */}
                    {status.tier !== 'freemium' && !status.auto_renewal && (
                      <Alert 
                        variant="warning" 
                        className="mb-4"
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #fbbf24',
                          backgroundColor: '#fef3c7'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.5rem', color: '#d97706' }}></i>
                          <div>
                            <h6 className="mb-2" style={{ fontWeight: '700', color: '#92400e' }}>
                              ⚠️ Renouvellement automatique désactivé
                            </h6>
                            <p className="mb-2" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                              Votre abonnement <strong>{getTierDisplayName(status.tier)}</strong> ne sera pas renouvelé automatiquement 
                              le <strong>{formatDate(status.renewal_date)}</strong>.
                            </p>
                            <p className="mb-0" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                              À partir de cette date, votre compte repassera automatiquement en <strong>Freemium</strong> avec 
                              un quota limité à <strong>3 fiches par mois</strong>.
                            </p>
                          </div>
                        </div>
                      </Alert>
                    )}

                    {/* Pending tier change banner (downgrade) */}
                    {status.pending_tier && (
                      <Alert 
                        className="mb-4"
                        style={{
                          borderRadius: '10px',
                          border: '2px solid #60a5fa',
                          backgroundColor: '#dbeafe'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className="bi bi-clock-history me-3" style={{ fontSize: '1.5rem', color: '#2563eb' }}></i>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 me-2" style={{ fontWeight: '700', color: '#1e40af' }}>
                                📅 Changement de plan programmé
                              </h6>
                              <Badge 
                                bg="primary" 
                                style={{ 
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}
                              >
                                En attente
                              </Badge>
                            </div>
                            <div className="mb-2">
                              <div className="d-flex align-items-center mb-1">
                                <strong style={{ fontSize: '0.9rem', color: '#1e40af', minWidth: '140px' }}>
                                  Plan actuel :
                                </strong>
                                <span style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
                                  {getTierDisplayName(status.tier)} ({status.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'}) 
                                  - {status.monthly_quota} fiches/mois
                                </span>
                              </div>
                              <div className="d-flex align-items-center">
                                <strong style={{ fontSize: '0.9rem', color: '#1e40af', minWidth: '140px' }}>
                                  Nouveau plan :
                                </strong>
                                <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '600' }}>
                                  {getTierDisplayName(status.pending_tier)} ({status.pending_billing_period === 'monthly' ? 'Mensuel' : 'Annuel'})
                                  {(() => {
                                    const pendingPlan = plans.find(p => p.tier === status.pending_tier);
                                    return pendingPlan ? ` - ${pendingPlan.monthly_quota} fiches/mois` : '';
                                  })()}
                                </span>
                              </div>
                            </div>
                            <p className="mb-0" style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                              <i className="bi bi-calendar-check me-1"></i>
                              Ce changement sera appliqué le <strong>{formatDate(status.renewal_date)}</strong>.
                              Vous conservez votre plan et vos quotas actuels jusqu'à cette date.
                            </p>
                          </div>
                        </div>
                      </Alert>
                    )}

                    <Card className="mb-4" style={{ 
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                    }}>
                      <Card.Header style={{ 
                        backgroundColor: '#eff6ff',
                        borderBottom: '2px solid #93c5fd',
                        borderRadius: '10px 10px 0 0',
                        padding: '16px 20px'
                      }}>
                        <h6 className="mb-0 d-flex align-items-center fw-semibold" style={{ color: '#1e40af' }}>
                          <i className="bi bi-star-fill me-2" style={{ color: '#fbbf24' }}></i>
                          Mon abonnement actuel
                        </h6>
                      </Card.Header>
                    <Card.Body className="p-4">
                      <Row>
                        <Col md={6} className="mb-3 mb-md-0">
                          <div className="d-flex align-items-center mb-3">
                            <div>
                              <h4 className="mb-1" style={{ color: '#1e40af', fontWeight: '700' }}>
                                {getTierDisplayName(status.tier)}
                              </h4>
                              <div className="d-flex align-items-baseline">
                                <span className="h3 mb-0" style={{ color: '#3b82f6', fontWeight: '700' }}>
                                  {getCurrentPlan()?.pricing[status.billing_period].price}€
                                </span>
                                <span className="text-muted ms-2" style={{ fontSize: '0.9rem' }}>
                                  /{status.billing_period === 'monthly' ? 'mois' : 'an'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4" style={{ 
                            backgroundColor: '#fef3c7', 
                            padding: '12px 16px', 
                            borderRadius: '10px',
                            border: '2px solid #fcd34d'
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400e' }}>
                                <i className="bi bi-graph-up me-2" style={{ color: '#f59e0b' }}></i>
                                Utilisation ce mois
                              </h6>
                              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#92400e' }}>
                                {status.monthly_used} / {status.monthly_quota}
                                {status.addon_quota_remaining > 0 && <> (+{status.addon_quota_remaining} addon)</>}
                                {status.welcome_pack?.active && status.welcome_pack.quota_remaining > 0 && status.welcome_pack.hours_remaining > 0 && <> (+{status.welcome_pack.quota_remaining} 🎁)</>}
                              </span>
                            </div>
                            <div className="progress mb-2" style={{ 
                              height: '14px', 
                              backgroundColor: '#fef9e7',
                              borderRadius: '8px',
                              border: '1px solid #fde68a'
                            }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{
                                  width: `${Math.min((status.monthly_used / status.monthly_quota) * 100, 100)}%`,
                                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                  borderRadius: '8px'
                                }}
                                aria-valuenow={status.monthly_used} 
                                aria-valuemin={0} 
                                aria-valuemax={status.monthly_quota}
                              ></div>
                            </div>
                            <div className="text-center">
                              <small style={{ 
                                color: status.monthly_remaining <= 0 && status.addon_quota_remaining <= 0 && (!status.welcome_pack?.active || status.welcome_pack.quota_remaining <= 0 || status.welcome_pack.hours_remaining <= 0) ? '#dc2626' : '#166534',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                              }}>
                                {status.monthly_remaining <= 0 && (!status.welcome_pack?.active || status.welcome_pack.quota_remaining <= 0 || !status.welcome_pack.hours_remaining || status.welcome_pack.hours_remaining <= 0)
                                  ? '⚠️ Limite atteinte' 
                                  : `✓ ${status.monthly_remaining + (status.welcome_pack?.active && status.welcome_pack.quota_remaining > 0 && status.welcome_pack.hours_remaining && status.welcome_pack.hours_remaining > 0 ? status.welcome_pack.quota_remaining : 0)} fiches restantes`}
                              </small>
                            </div>
                          </div>

                          {/* Addon Packs Section */}
                          {status.addon_quota_remaining > 0 && (
                            <div className="mb-3 p-3" style={{ 
                              backgroundColor: '#f0fdf4', 
                              borderRadius: '10px',
                              border: '1px solid #86efac'
                            }}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <small style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>
                                    Packs additionnels
                                  </small>
                                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#15803d' }}>
                                    {status.addon_quota_remaining} fiches disponibles
                                  </div>
                                </div>
                                <i className="bi bi-plus-circle-fill" style={{ fontSize: '1.5rem', color: '#22c55e' }}></i>
                              </div>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={6}>
                          <div className="mb-3 p-3" style={{ 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: '10px',
                            border: '1px solid #bae6fd'
                          }}>
                            <div className="mb-3">
                              <small style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>
                                Période de facturation
                              </small>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af' }}>
                                {status.billing_period === 'monthly' ? 'Mensuelle' : 'Annuelle'}
                              </div>
                            </div>
                            <div className="mb-3">
                              <small style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>
                                Début de l'abonnement
                              </small>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af' }}>
                                {formatDate(status.start_date)}
                              </div>
                            </div>
                            <div>
                              <small style={{ 
                                fontSize: '0.75rem', 
                                color: status.pending_tier ? '#2563eb' : (status.auto_renewal ? '#0369a1' : '#92400e'), 
                                fontWeight: '600', 
                                textTransform: 'uppercase' 
                              }}>
                                {status.pending_tier 
                                  ? 'Date du changement de plan' 
                                  : (status.auto_renewal ? 'Prochain renouvellement' : 'Date d\'expiration')
                                }
                              </small>
                              <div style={{ 
                                fontSize: '0.95rem', 
                                fontWeight: '600', 
                                color: status.pending_tier ? '#1e40af' : (status.auto_renewal ? '#1e40af' : '#d97706')
                              }}>
                                {formatDate(status.renewal_date)}
                              </div>
                              {status.pending_tier && (
                                <div className="mt-2 p-2" style={{
                                  backgroundColor: '#dbeafe',
                                  borderRadius: '6px',
                                  border: '1px solid #93c5fd'
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600', marginBottom: '2px' }}>
                                    → Passage au plan :
                                  </div>
                                  <div style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: '700' }}>
                                    {getTierDisplayName(status.pending_tier)} 
                                    <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                                      {' '}({status.pending_billing_period === 'monthly' ? 'Mensuel' : 'Annuel'})
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="d-grid gap-2 mt-3">
                            {/* Addon pack button - only for paid subscriptions */}
                            {status.tier !== 'freemium' && (
                              <Button 
                                variant="success"
                                size="sm"
                                onClick={() => setShowStripeAddonModal(true)}
                                style={{
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  padding: '8px 16px'
                                }}
                              >
                                <i className="bi bi-plus-circle me-2"></i>
                                Acheter des packs additionnels
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  </>
                )}

                {/* Available Plans - Detailed Comparison */}
                <Card className="mb-4" style={{ 
                  border: '2px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <Card.Header style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e9ecef',
                    padding: '12px 16px'
                  }}>
                    <h6 className="mb-0 fw-semibold" style={{ color: '#2c3e50' }}>
                      {status?.status === 'active' ? 'Changer d\'abonnement' : 'Choisir un abonnement'}
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    {/* Plans Cards */}
                    <Row className="mb-4">
                      {/* Free Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'freemium' ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'freemium' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                        }}>
                          <Card.Body className="text-center d-flex flex-column p-4">
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#6b7280' }}>Gratuit</h5>
                            <div className="display-6 mb-2" style={{ color: '#6b7280', fontWeight: '700' }}>0€</div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                              Pour découvrir l'application
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'freemium' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#eff6ff', 
                                  color: '#1e40af',
                                  border: '2px solid #3b82f6',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.pending_tier === 'freemium' ? (
                                <div>
                                  <span className="badge p-2 mb-2 d-block" style={{ 
                                    backgroundColor: '#fef3c7', 
                                    color: '#92400e',
                                    border: '2px solid #fbbf24',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                  }}>
                                    🕒 Retour prévu
                                  </span>
                                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                    Réactivez votre abonnement pour éviter le retour au Freemium
                                  </small>
                                </div>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Standard Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'standard' ? '3px solid #fbbf24' : '2px solid #fbbf24',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'standard' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : '0 2px 8px rgba(251, 191, 36, 0.15)',
                          transform: 'scale(1.02)'
                        }}>
                          <div className="position-absolute top-0 start-50 translate-middle">
                            <span className="badge text-dark px-3 py-2" style={{ 
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              borderRadius: '8px'
                            }}>
                              ⭐ Populaire
                            </span>
                          </div>
                          <Card.Body className="text-center d-flex flex-column p-4" style={{ paddingTop: '2.5rem !important' }}>
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#92400e' }}>Standard</h5>
                            <div className="display-6 mb-2" style={{ color: '#f59e0b', fontWeight: '700' }}>
                              {plans.find(p => p.tier === 'standard')?.pricing.monthly.price || '2.99'}€
                            </div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#78350f' }}>
                              Pour une utilisation régulière
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'standard' && !status?.pending_tier ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#fef3c7', 
                                  color: '#92400e',
                                  border: '2px solid #fbbf24',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.pending_tier === 'standard' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af',
                                  border: '2px solid #60a5fa',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  🕒 Changement prévu
                                </span>
                              ) : status?.tier === 'freemium' ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('standard')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Passer à Standard'}
                                </Button>
                              ) : status?.tier === 'famille_plus' ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('standard')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Changer vers Standard'}
                                </Button>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Family+ Plan */}
                      <Col md={4} className="mb-3">
                        <Card className={`h-100`} style={{ 
                          border: status?.tier === 'famille_plus' ? '3px solid #3b82f6' : '2px solid #3b82f6',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          boxShadow: status?.tier === 'famille_plus' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(59, 130, 246, 0.15)'
                        }}>
                          <Card.Body className="text-center d-flex flex-column p-4">
                            <h5 className="card-title fw-bold mb-2" style={{ color: '#1e40af' }}>Famille+</h5>
                            <div className="display-6 mb-2" style={{ color: '#3b82f6', fontWeight: '700' }}>
                              {plans.find(p => p.tier === 'famille_plus')?.pricing.monthly.price || '4.99'}€
                            </div>
                            <p className="text-muted small mb-3">par mois</p>
                            <p className="card-text mb-3" style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                              Pour une utilisation intensive
                            </p>
                            
                            <div className="mt-auto">
                              {status?.tier === 'famille_plus' && !status?.pending_tier ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#eff6ff', 
                                  color: '#1e40af',
                                  border: '2px solid #3b82f6',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  ✓ Plan actuel
                                </span>
                              ) : status?.tier === 'famille_plus' && status?.pending_tier ? (
                                <Button 
                                  size="sm"
                                  onClick={handleCancelPendingChange}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : '🔄 Annuler le changement'}
                                </Button>
                              ) : status?.pending_tier === 'famille_plus' ? (
                                <span className="badge p-2" style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af',
                                  border: '2px solid #60a5fa',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  🕒 Changement prévu
                                </span>
                              ) : (status?.tier === 'freemium' || status?.tier === 'standard') ? (
                                <Button 
                                  size="sm"
                                  onClick={() => handleTierChange('famille_plus')}
                                  disabled={actionLoading}
                                  style={{ 
                                    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    padding: '8px 16px',
                                    color: 'white'
                                  }}
                                >
                                  {actionLoading ? 'Chargement...' : 'Passer à Famille+'}
                                </Button>
                              ) : null}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Detailed Features Comparison Table */}
                    <div className="table-responsive">
                      <table className="table table-bordered" style={{ fontSize: '0.9rem', borderRadius: '10px', overflow: 'hidden' }}>
                        <thead>
                          <tr>
                            <th style={{ 
                              width: '25%', 
                              color: '#1e40af', 
                              fontWeight: '600',
                              backgroundColor: '#eff6ff',
                              borderBottom: '2px solid #93c5fd'
                            }}>Fonctionnalité</th>
                            <th className="text-center" style={{ 
                              color: '#6b7280', 
                              fontWeight: '600',
                              backgroundColor: '#f9fafb',
                              borderBottom: '2px solid #e5e7eb'
                            }}>Gratuit</th>
                            <th className="text-center" style={{ 
                              color: '#92400e', 
                              fontWeight: '600',
                              backgroundColor: '#fef3c7',
                              borderBottom: '2px solid #fcd34d'
                            }}>Standard ({plans.find(p => p.tier === 'standard')?.pricing.monthly.price || '2.99'}€)</th>
                            <th className="text-center" style={{ 
                              color: '#1e40af', 
                              fontWeight: '600',
                              backgroundColor: '#eff6ff',
                              borderBottom: '2px solid #93c5fd'
                            }}>Famille+ ({plans.find(p => p.tier === 'famille_plus')?.pricing.monthly.price || '4.99'}€)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Usage</strong></td>
                            <td className="text-center">1 fiche/jour<br/><small className="text-muted">+ 3 bonus/mois</small></td>
                            <td className="text-center"><strong>50 fiches/mois</strong><br/><small className="text-muted">(soft cap)</small></td>
                            <td className="text-center"><strong>150 fiches/mois</strong><br/><small className="text-muted">(soft cap)</small></td>
                          </tr>
                          <tr>
                            <td><strong>Historique</strong></td>
                            <td className="text-center">7 dernières</td>
                            <td className="text-center">90 jours</td>
                            <td className="text-center"><span style={{ color: '#10b981', fontWeight: '600' }}>illimité</span></td>
                          </tr>
                          <tr>
                            <td><strong>Tags</strong></td>
                            <td className="text-center">non</td>
                            <td className="text-center">non</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> création et filtrage</td>
                          </tr>
                          <tr>
                            <td><strong>Priorité de génération</strong></td>
                            <td className="text-center">standard</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> priorité</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> priorité</td>
                          </tr>
                          <tr>
                            <td><strong>Support</strong></td>
                            <td className="text-center">non</td>
                            <td className="text-center">non</td>
                            <td className="text-center"><span style={{ color: '#10b981' }}>✅</span> Support Client disponible</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Upsell Messages */}
                    {status?.tier === 'freemium' && (
                      <div className="mt-3 p-3" style={{ 
                        backgroundColor: '#fef3c7',
                        border: '2px solid #fbbf24',
                        borderRadius: '10px'
                      }}>
                        <strong style={{ color: '#92400e', fontSize: '1rem' }}>
                          <i className="bi bi-lightbulb me-2" style={{ color: '#f59e0b' }}></i>
                          Passez à Standard
                        </strong>
                        <p className="mb-0 mt-2" style={{ color: '#78350f', fontSize: '0.9rem' }}>
                          Générez jusqu'à 50 fiches par mois avec priorité de génération et conservez votre historique pendant 90 jours !
                        </p>
                      </div>
                    )}
                    {status?.tier === 'standard' && (
                      <div className="mt-3 p-3" style={{ 
                        backgroundColor: '#eff6ff',
                        border: '2px solid #3b82f6',
                        borderRadius: '10px'
                      }}>
                        <strong style={{ color: '#1e40af', fontSize: '1rem' }}>
                          <i className="bi bi-rocket-takeoff me-2" style={{ color: '#3b82f6' }}></i>
                          Passez à Famille+
                        </strong>
                        <p className="mb-0 mt-2" style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>
                          Tripler votre quota, taggez vos fiches et conservez toutes vos créations indéfiniment !
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="mb-2">💡 Informations importantes</h6>
                      <ul className="mb-0 small text-muted">
                        <li>Les changements d'abonnement prennent effet immédiatement</li>
                        <li>En cas de rétrogradation, le crédit restant est conservé jusqu'à la fin du mois</li>
                        <li>L'annulation prend effet à la fin de la période de facturation</li>
                        <li>Aucun engagement - vous pouvez modifier ou annuler à tout moment</li>
                      </ul>
                    </div>

                    {/* Cancel Subscription - Sensitive Zone */}
                    {status?.tier !== 'freemium' && status?.status === 'active' && (
                      <div className="mt-4" style={{
                        backgroundColor: '#fef2f2',
                        border: '2px solid #fecaca',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          color: '#991b1b',
                          fontSize: '0.9rem',
                          marginBottom: '12px',
                          lineHeight: '1.5'
                        }}>
                          <i className="bi bi-info-circle me-2"></i>
                          {status?.auto_renewal ? (
                            <>Vous conserverez l'accès à votre abonnement jusqu'à la fin de la période en cours.</>
                          ) : (
                            <>Réactivez votre abonnement pour continuer à profiter de tous les avantages de votre formule actuelle.</>
                          )}
                        </div>
                        {status?.auto_renewal ? (
                          <Button 
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={actionLoading}
                            style={{
                              borderWidth: '2px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              padding: '10px 24px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {actionLoading ? 'Chargement...' : 'Annuler l\'abonnement'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => setShowReactivateConfirm(true)}
                            disabled={actionLoading}
                            style={{
                              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              padding: '10px 24px',
                              color: 'white'
                            }}
                          >
                            {actionLoading ? 'Chargement...' : 'Réactiver l\'abonnement'}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
                </Card.Body>
              </Card>
            )}

            {/* Support Section */}
            {activeSection === "support" && (
              <>
              <Card style={{ 
                border: '2px solid #3b82f6', 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                backgroundColor: 'white'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#eff6ff',
                  borderBottom: '2px solid #93c5fd',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#1e40af' }}>
                    <i className="bi bi-telephone me-2" style={{ color: '#3b82f6' }}></i>
                    Besoin d'aide ?
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {supportMessage && (
                    <Alert variant={supportMessage.type === 'success' ? 'success' : 'danger'} className="mb-4">
                      {supportMessage.text}
                    </Alert>
                  )}

                  <div className="mb-4">
                    <p className="text-muted mb-3">
                      Nous sommes là pour vous aider.<br />
                      Choisissez l'option qui correspond à votre demande :
                    </p>
                  </div>

                  <Form onSubmit={handleSupportSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Type de demande</Form.Label>
                      <Form.Select
                        value={supportForm.type}
                        onChange={(e) => setSupportForm({ ...supportForm, type: e.target.value })}
                        required
                      >
                        <option value="bug">🐞 Signaler un bug</option>
                        <option value="question">❓ Poser une question</option>
                        <option value="feature">💡 Suggérer une amélioration</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        📝 Votre message
                      </Form.Label>
                      <Form.Label className="d-block fw-normal">Objet</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Décrivez brièvement votre demande..."
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        onFocus={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}
                        required
                        maxLength={80}
                      />
                      <Form.Text className="text-muted">
                        {supportForm.subject.length}/80 caractères
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-normal">Description <span className="text-muted">(optionnelle mais recommandée)</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder="Donnez-nous plus de détails sur votre demande..."
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        onFocus={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}
                        maxLength={2000}
                      />
                      <Form.Text className="text-muted">
                        {supportForm.message.length}/2000 caractères
                      </Form.Text>
                    </Form.Group>

                    <div className="alert alert-info mb-4" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>👉 Nous recevrons automatiquement</strong> votre email, votre navigateur et votre appareil : pas besoin de nous les donner.
                    </div>

                    <div className="d-grid">
                      <Button 
                        type="submit" 
                        variant="primary"
                        size="lg"
                        disabled={supportSubmitting || !supportForm.subject.trim()}
                      >
                        {supportSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            📤 Envoyer ma demande
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  <div className="mt-4 p-4 bg-light rounded">
                    <h6 className="mb-3" style={{ color: '#1e40af' }}>
                      <i className="bi bi-mailbox me-2"></i>
                      📬 Autres moyens de nous contacter
                    </h6>
                    <div className="mb-2">
                      <strong>📧 Email :</strong> <a href="mailto:support@exominutes.com" style={{ color: '#3b82f6' }}>support@exominutes.com</a>
                    </div>
                    <div className="mb-2">
                      <strong>⏱️ Réponse :</strong> Sous 24h en semaine
                    </div>
                    <div>
                      <strong>📅 Disponibilité :</strong> Lun–Ven : 9h–18h
                    </div>
                  </div>
                </Card.Body>
              </Card>
              </>
            )}

            {/* Admin Section - uniquement pour admin@exominutes.com */}
            {activeSection === "admin" && isAdmin && (
              <>
              <Card style={{ 
                border: '2px solid #ffc107', 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <Card.Header style={{ 
                  backgroundColor: '#fff9e6',
                  borderBottom: '2px solid #ffc107',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center" style={{ color: '#2c3e50' }}>
                    <i className="bi bi-gear me-2" style={{ color: '#ffc107' }}></i>
                    Administration
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <h5 className="text-warning">🔧 Outils d'administration</h5>
                    <p className="text-muted">
                      Accès réservé aux administrateurs pour la gestion et le débogage de l'application.
                    </p>
                  </div>

                  <div className="d-grid gap-3">
                    {/* User Console */}
                    <div className="border rounded p-3 bg-light">
                      <h6 className="mb-3">
                        <i className="bi bi-person-gear me-2" style={{ color: '#3b82f6' }}></i>
                        Console utilisateur
                      </h6>
                      <p className="text-muted small mb-3">
                        Rechercher et gérer les informations d'un utilisateur par email.
                      </p>

                      {userConsoleMessage && (
                        <Alert variant={userConsoleMessage.type === 'success' ? 'success' : 'danger'} className="mb-3">
                          {userConsoleMessage.text}
                        </Alert>
                      )}

                      <div className="mb-3">
                        <Form.Group className="mb-2">
                          <Form.Label className="small fw-semibold">Email utilisateur</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              type="email"
                              placeholder="exemple@email.com"
                              value={userConsoleEmail}
                              onChange={(e) => setUserConsoleEmail(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleUserConsoleSearch()}
                              onFocus={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}
                              disabled={userConsoleLoading}
                            />
                            <Button
                              variant="primary"
                              onClick={handleUserConsoleSearch}
                              disabled={userConsoleLoading || !userConsoleEmail.trim()}
                            >
                              {userConsoleLoading ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="bi bi-search"></i>
                              )}
                            </Button>
                          </div>
                        </Form.Group>
                      </div>

                      {userConsoleData && (
                        <div className="border rounded p-3 bg-white">
                          <h6 className="mb-3 text-primary">Informations utilisateur</h6>
                          
                          <div className="mb-3">
                            <strong className="d-block mb-1">Email:</strong>
                            <code>{userConsoleData.email}</code>
                          </div>

                          <div className="mb-3">
                            <strong className="d-block mb-1">User ID:</strong>
                            <code>{userConsoleData.user_id || 'N/A'}</code>
                          </div>

                          <hr />

                          {/* Subscription Information */}
                          {userConsoleSubscription && (
                            <div className="mb-3">
                              <h6 className="mb-2 text-success">
                                <i className="bi bi-credit-card me-2"></i>
                                Abonnement
                              </h6>
                              <div className="ps-3">
                                <div className="mb-1">
                                  <small className="text-muted">Formule:</small>{' '}
                                  <Badge bg={
                                    userConsoleSubscription.tier === 'freemium' ? 'secondary' :
                                    userConsoleSubscription.tier === 'standard' ? 'info' : 'warning'
                                  }>
                                    {userConsoleSubscription.tier === 'freemium' ? 'Freemium' :
                                     userConsoleSubscription.tier === 'standard' ? 'Standard' : 'Famille+'}
                                  </Badge>
                                  {' '}
                                  <small className="text-muted">
                                    ({userConsoleSubscription.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'})
                                  </small>
                                </div>
                                <div className="mb-1">
                                  <small className="text-muted">Statut:</small>{' '}
                                  <Badge bg={userConsoleSubscription.status === 'active' ? 'success' : 'danger'}>
                                    {userConsoleSubscription.status === 'active' ? 'Actif' : 
                                     userConsoleSubscription.status === 'cancelled' ? 'Annulé' : 'Expiré'}
                                  </Badge>
                                </div>
                                <div className="mb-1">
                                  <small className="text-muted">Quota mensuel:</small>{' '}
                                  <span className="fw-semibold">
                                    {userConsoleSubscription.monthly_used} / {userConsoleSubscription.monthly_quota}
                                  </span>
                                  {' '}
                                  <small className="text-muted">
                                    ({Math.round((userConsoleSubscription.monthly_used / userConsoleSubscription.monthly_quota) * 100)}%)
                                  </small>
                                </div>
                                {userConsoleSubscription.daily_quota && (
                                  <div className="mb-1">
                                    <small className="text-muted">Quota quotidien:</small>{' '}
                                    <span className="fw-semibold">
                                      {userConsoleSubscription.daily_used || 0} / {userConsoleSubscription.daily_quota}
                                    </span>
                                  </div>
                                )}
                                {userConsoleSubscription.addon_quota_remaining > 0 && (
                                  <div className="mb-1">
                                    <small className="text-muted">Packs addons restants:</small>{' '}
                                    <span className="fw-semibold text-success">
                                      {userConsoleSubscription.addon_quota_remaining}
                                    </span>
                                  </div>
                                )}
                                <div className="mb-1">
                                  <small className="text-muted">Date de renouvellement:</small>{' '}
                                  <span className="fw-semibold">
                                    {new Date(userConsoleSubscription.renewal_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                                <div className="mb-1">
                                  <small className="text-muted">Renouvellement automatique:</small>{' '}
                                  <Badge bg={userConsoleSubscription.auto_renewal ? 'success' : 'warning'}>
                                    {userConsoleSubscription.auto_renewal ? 'Oui' : 'Non'}
                                  </Badge>
                                </div>
                                {userConsoleSubscription.pending_tier && (
                                  <div className="mt-2">
                                    <Alert variant="info" className="py-2 px-3 mb-0">
                                      <small>
                                        <i className="bi bi-info-circle me-1"></i>
                                        Changement prévu: {userConsoleSubscription.pending_tier} au {new Date(userConsoleSubscription.renewal_date).toLocaleDateString('fr-FR')}
                                      </small>
                                    </Alert>
                                  </div>
                                )}
                              </div>
                              
                              {/* Quota Update Button */}
                              <div className="mt-3">
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={handleOpenQuotaModal}
                                  className="w-100"
                                >
                                  <i className="bi bi-gear-fill me-2"></i>
                                  Ajuster le quota
                                </Button>
                              </div>
                            </div>
                          )}

                          <hr />

                          {/* Préférences utilisateur */}
                          <div className="mb-3">
                            <h6 className="mb-2">
                              <i className="bi bi-sliders me-2"></i>
                              Préférences utilisateur
                            </h6>
                            <div className="ps-3">
                              <div className="mb-1">
                                <small className="text-muted">Niveau:</small>{' '}
                                <span className="fw-semibold">{userConsoleData.user_preferences?.default_level || 'Non défini'}</span>
                              </div>
                              <div>
                                <small className="text-muted">Durée:</small>{' '}
                                <span className="fw-semibold">{userConsoleData.user_preferences?.default_period || 'Non défini'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accès à la page d'administration */}
                    <div className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                              <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h9V.5a.5.5 0 0 1 1 0V1h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h2V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                            </svg>
                            Console d'administration
                          </h6>
                          <p className="text-muted small mb-0">
                            Accès complet aux outils de débogage, synchronisation OpenAPI, gestion des données et monitoring système.
                          </p>
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => router.push('/admin')}
                          className="ms-3"
                        >
                          <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                          </svg>
                          Accéder
                        </Button>
                      </div>
                    </div>

                    {/* Informations de sécurité */}
                    <Alert variant="info" className="mb-0">
                      <Alert.Heading as="h6">
                        <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                        Accès sécurisé
                      </Alert.Heading>
                      <p className="mb-0">
                        Cet accès est restreint aux comptes administrateurs autorisés. 
                        Toutes les actions sont journalisées pour des raisons de sécurité.
                      </p>
                    </Alert>
                  </div>
                </Card.Body>
              </Card>
              </>
            )}
          </Col>
        </Row>
      </Container>



      {/* Cancel Subscription Confirmation Modal */}
      <Modal 
        show={showCancelConfirm} 
        onHide={() => setShowCancelConfirm(false)}
        centered
      >
        <Modal.Header 
          closeButton
          style={{ 
            backgroundColor: '#fef3c7', 
            borderBottom: '2px solid #fbbf24' 
          }}
        >
          <Modal.Title style={{ color: '#92400e', fontWeight: '700' }}>
            <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#d97706' }}></i>
            Confirmer l'annulation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div className="mb-3">
            <h6 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Êtes-vous sûr de vouloir annuler le renouvellement automatique ?
            </h6>
            <div className="p-3 mb-3" style={{ 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #fbbf24'
            }}>
              <p className="mb-2" style={{ fontSize: '0.95rem', color: '#78350f' }}>
                <strong>Conséquences de l'annulation :</strong>
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#92400e', marginBottom: 0 }}>
                <li className="mb-2">
                  Votre abonnement <strong>{status && getTierDisplayName(status.tier)}</strong> restera actif jusqu'au{' '}
                  <strong>{status && formatDate(status.renewal_date)}</strong>
                </li>
                <li className="mb-2">
                  Vous conserverez votre quota actuel jusqu'à cette date
                </li>
                <li className="mb-2">
                  Après cette date, votre compte repassera automatiquement en{' '}
                  <strong>Freemium</strong>
                </li>
                <li>
                  Vous serez limité à <strong>3 fiches par mois</strong> en Freemium
                </li>
              </ul>
            </div>
            <div className="p-3" style={{ 
              backgroundColor: '#e0f2fe', 
              borderRadius: '8px',
              border: '1px solid #7dd3fc'
            }}>
              <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                <i className="bi bi-info-circle-fill me-2" style={{ color: '#0284c7' }}></i>
                Vous pourrez réactiver le renouvellement automatique à tout moment avant la date d'expiration.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowCancelConfirm(false)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            Annuler
          </Button>
          <Button 
            variant="danger"
            onClick={handleCancelSubscription}
            disabled={actionLoading}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Traitement...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Confirmer l'annulation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reactivate Subscription Confirmation Modal */}
      <Modal 
        show={showReactivateConfirm} 
        onHide={() => setShowReactivateConfirm(false)}
        centered
      >
        <Modal.Header 
          closeButton
          style={{ 
            backgroundColor: '#dbeafe', 
            borderBottom: '2px solid #60a5fa' 
          }}
        >
          <Modal.Title style={{ color: '#1e40af', fontWeight: '700' }}>
            <i className="bi bi-arrow-clockwise me-2" style={{ color: '#3b82f6' }}></i>
            Confirmer la réactivation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          <div className="mb-3">
            <h6 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Êtes-vous sûr de vouloir réactiver le renouvellement automatique ?
            </h6>
            <div className="p-3 mb-3" style={{ 
              backgroundColor: '#dcfce7', 
              borderRadius: '8px',
              border: '1px solid #86efac'
            }}>
              <p className="mb-2" style={{ fontSize: '0.95rem', color: '#14532d' }}>
                <strong>Effets de la réactivation :</strong>
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#166534', marginBottom: 0 }}>
                <li className="mb-2">
                  Votre abonnement <strong>{status && getTierDisplayName(status.tier)}</strong> se renouvellera automatiquement 
                  le <strong>{status && formatDate(status.renewal_date)}</strong>
                </li>
                <li className="mb-2">
                  Vous serez facturé <strong>{status && getCurrentPlan()?.pricing[status.billing_period].price}€</strong> à chaque renouvellement
                </li>
                <li className="mb-2">
                  Vous conserverez votre quota de <strong>{status && status.monthly_quota} fiches par mois</strong>
                </li>
                <li>
                  Le renouvellement se fera automatiquement sauf si vous l'annulez à nouveau
                </li>
              </ul>
            </div>
            <div className="p-3" style={{ 
              backgroundColor: '#e0f2fe', 
              borderRadius: '8px',
              border: '1px solid #7dd3fc'
            }}>
              <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                <i className="bi bi-info-circle-fill me-2" style={{ color: '#0284c7' }}></i>
                Vous éviterez ainsi le passage automatique au forfait Freemium limité à 3 fiches/mois.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowReactivateConfirm(false)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            Annuler
          </Button>
          <Button 
            style={{ 
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border: 'none',
              borderRadius: '8px', 
              fontWeight: '600',
              color: 'white'
            }}
            onClick={handleReactivateSubscription}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Traitement...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Confirmer la réactivation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Stripe Subscription Payment Modal */}
      {pendingTier && (
        <SubscriptionPaymentModal
          show={showStripeSubscriptionModal}
          onHide={() => {
            setShowStripeSubscriptionModal(false);
            setPendingTier(null);
          }}
          tier={pendingTier}
          billingPeriod={pendingBillingPeriod}
          onSuccess={handleStripeSubscriptionSuccess}
          onError={handleStripeSubscriptionError}
          tierDisplayName={getTierDisplayName(pendingTier)}
          price={plans.find(p => p.tier === pendingTier)?.pricing[pendingBillingPeriod].price || 0}
          features={translateFeatures(plans.find(p => p.tier === pendingTier)?.features || [])}
          currentTier={status?.tier || 'freemium'}
          hasStripeSubscription={!!status?.stripe_subscription_id}
        />
      )}

      {/* Stripe Addon Pack Payment Modal */}
      <AddonPackPaymentModal
        show={showStripeAddonModal}
        onHide={() => setShowStripeAddonModal(false)}
        onSuccess={handleStripeAddonSuccess}
        onError={handleStripeAddonError}
        packSize={15}
        packPrice={0.99}
        userEmail={user?.email || ''}
      />

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutConfirm} onHide={() => setShowLogoutConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-box-arrow-right me-2"></i>
            Confirmation de déconnexion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
          <p className="text-muted">
            Vous devrez vous reconnecter pour accéder à votre compte.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowLogoutConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Me déconnecter
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Admin Quota Update Modal - Double Confirmation */}
      <Modal 
        show={showQuotaModal} 
        onHide={() => {
          setShowQuotaModal(false);
          setShowQuotaConfirm(false);
        }} 
        centered
        size="lg"
      >
        <Modal.Header 
          closeButton
          style={{ 
            backgroundColor: '#fef3c7', 
            borderBottom: '2px solid #fbbf24' 
          }}
        >
          <Modal.Title style={{ color: '#92400e', fontWeight: '700' }}>
            <i className="bi bi-gear-fill me-2" style={{ color: '#d97706' }}></i>
            {!showQuotaConfirm ? 'Ajuster le quota utilisateur' : '⚠️ Confirmation requise'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {!showQuotaConfirm ? (
            <>
              {/* Step 1: Configuration Form */}
              <Alert variant="warning" className="mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Action critique :</strong> Cette opération modifie directement le quota de l'utilisateur.
              </Alert>

              {userConsoleMessage?.type === 'error' && (
                <Alert variant="danger" className="mb-3">
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                    {userConsoleMessage.text}
                  </div>
                </Alert>
              )}

              <div className="mb-3">
                <strong className="d-block mb-2">Utilisateur concerné :</strong>
                <code className="p-2 bg-light rounded d-block">{userConsoleData?.email}</code>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Type d'opération *</Form.Label>
                <Form.Select
                  value={quotaOperation}
                  onChange={(e) => setQuotaOperation(e.target.value as any)}
                >
                  <option value="add">➕ Ajouter au quota existant</option>
                  <option value="subtract">➖ Soustraire du quota existant</option>
                  <option value="set">🎯 Définir une valeur exacte</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {quotaOperation === 'add' && 'Ajoute le montant au quota actuel'}
                  {quotaOperation === 'subtract' && 'Soustrait le montant du quota actuel (minimum 0)'}
                  {quotaOperation === 'set' && 'Définit le quota à une valeur exacte'}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Type de quota *</Form.Label>
                <Form.Select
                  value={quotaType}
                  onChange={(e) => setQuotaType(e.target.value as any)}
                >
                  <option value="addon">📦 Packs addons (ne se réinitialise jamais)</option>
                  <option value="monthly">📅 Quota mensuel (se réinitialise chaque mois)</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {quotaType === 'addon' && 'Les packs addons persistent jusqu\'à utilisation complète'}
                  {quotaType === 'monthly' && 'Le quota mensuel se réinitialise à la date de renouvellement'}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Montant *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={quotaAmount}
                  onChange={(e) => setQuotaAmount(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 50"
                />
                <Form.Text className="text-muted">
                  Nombre de fiches à {quotaOperation === 'add' ? 'ajouter' : quotaOperation === 'subtract' ? 'soustraire' : 'définir'}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Raison * (minimum 10 caractères)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  placeholder="Ex: Compensation pour interruption de service - Ticket #12345"
                  minLength={10}
                />
                <Form.Text className="text-muted">
                  {quotaReason.length}/10 caractères minimum - Justification obligatoire pour traçabilité
                </Form.Text>
              </Form.Group>

              {userConsoleSubscription && (
                <div className="p-3 bg-light rounded">
                  <h6 className="mb-2">📊 État actuel</h6>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Quota mensuel:</span>
                    <strong>{userConsoleSubscription.monthly_used} / {userConsoleSubscription.monthly_quota}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Packs addons:</span>
                    <strong>{userConsoleSubscription.addon_quota_remaining}</strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Step 2: Double Confirmation */}
              <Alert variant="danger" className="mb-3">
                <Alert.Heading as="h6">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  Confirmation finale requise
                </Alert.Heading>
                <p className="mb-0">
                  Vous êtes sur le point de modifier le quota utilisateur. Cette action sera enregistrée dans l'audit trail.
                </p>
              </Alert>

              <div className="border rounded p-3 mb-3 bg-light">
                <h6 className="mb-3 fw-bold">Récapitulatif de l'opération</h6>
                
                <div className="mb-2">
                  <strong>Utilisateur :</strong>
                  <div className="ms-3 mt-1">
                    <code>{userConsoleData?.email}</code>
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Opération :</strong>
                  <div className="ms-3 mt-1">
                    <Badge bg={
                      quotaOperation === 'add' ? 'success' :
                      quotaOperation === 'subtract' ? 'danger' : 'warning'
                    }>
                      {quotaOperation === 'add' ? '➕ AJOUTER' :
                       quotaOperation === 'subtract' ? '➖ SOUSTRAIRE' : '🎯 DÉFINIR'}
                    </Badge>
                    {' '}
                    <span className="fw-bold">{quotaAmount} fiches</span>
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Type de quota :</strong>
                  <div className="ms-3 mt-1">
                    <Badge bg={quotaType === 'addon' ? 'info' : 'primary'}>
                      {quotaType === 'addon' ? '📦 PACKS ADDONS' : '📅 QUOTA MENSUEL'}
                    </Badge>
                  </div>
                </div>

                <div className="mb-2">
                  <strong>Raison :</strong>
                  <div className="ms-3 mt-1 p-2 bg-white rounded border">
                    <small>{quotaReason}</small>
                  </div>
                </div>

                <div className="mb-0">
                  <strong>Administrateur :</strong>
                  <div className="ms-3 mt-1">
                    <code>{user?.email}</code>
                  </div>
                </div>
              </div>

              <Alert variant="info" className="mb-0">
                <small>
                  <i className="bi bi-info-circle me-1"></i>
                  L'opération sera tracée avec horodatage, email admin et raison fournie.
                </small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowQuotaModal(false);
              setShowQuotaConfirm(false);
            }}
            disabled={quotaUpdating}
          >
            Annuler
          </Button>
          {!showQuotaConfirm ? (
            <Button 
              variant="warning" 
              onClick={handleQuotaFirstConfirm}
              disabled={!quotaReason.trim() || quotaReason.length < 10 || quotaAmount < 0}
            >
              <i className="bi bi-arrow-right-circle me-2"></i>
              Continuer
            </Button>
          ) : (
            <Button 
              variant="danger" 
              onClick={handleQuotaFinalConfirm}
              disabled={quotaUpdating}
            >
              {quotaUpdating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Mise à jour...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Confirmer la modification
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </ProtectedPage>
  );
}
