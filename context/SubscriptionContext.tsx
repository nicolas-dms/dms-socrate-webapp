"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  subscriptionService,
  computeRemainingForToday,
  canGenerateMoreFromStatus,
  toUsageView
} from "../services/subscriptionService";
import { stripeService } from "../services/stripeService";
import initializationService from "../services/initializationService";
import { 
  SubscriptionStatus, 
  SubscriptionUsageView,
  SubscriptionPlansResponse,
  SubscriptionPlan,
  HistoryItem,
  HistoryResponse,
  InitializeFreemiumResponse
} from "../types/subscription";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  // Core state
  status: SubscriptionStatus | null;
  usageView: SubscriptionUsageView | null;
  plans: SubscriptionPlan[];
  history: HistoryItem[];
  loading: boolean;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  refreshQuotaAfterGeneration: () => Promise<void>;
  updateStatusFromQuotaInfo: (quotaInfo: SubscriptionStatus) => void;
  changeTier: (newTier: "freemium" | "standard" | "famille_plus", billingPeriod?: "monthly" | "yearly") => Promise<{ success: boolean; message: string }>;
  changeBillingPeriod: (newPeriod: "monthly" | "yearly") => Promise<{ success: boolean; message: string }>;
  buyAddonPack: (quantity: number) => Promise<{ success: boolean; message: string }>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
  
  // Stripe payment methods
  buyAddonPackWithStripe: (quantity: number, paymentMethodId: string) => Promise<{ success: boolean; message: string; quotasAdded?: number }>;
  createStripeSubscription: (tier: "standard" | "famille_plus", billingPeriod: "monthly" | "yearly", paymentMethodId: string) => Promise<{ success: boolean; message: string; requiresConfirmation?: boolean; clientSecret?: string }>;
  updateStripeSubscription: (newTier: "standard" | "famille_plus", newBillingPeriod: "monthly" | "yearly") => Promise<{ success: boolean; message: string }>;
  calculateProration: (newTier: "standard" | "famille_plus", newBillingPeriod: "monthly" | "yearly") => Promise<{ amount: number } | null>;
  
  // Helpers
  canGenerateMore: () => boolean;
  getRemainingFiches: () => number;
  hasStripeSubscription: () => boolean;
  requiresStripePayment: (targetTier: "freemium" | "standard" | "famille_plus") => boolean;
  
  // Legacy compatibility (deprecated - will be removed in Phase 3)
  upgradePlan: (planId: string) => Promise<{ success: boolean; message: string }>;
  downgradePlan: (planId: string) => Promise<{ success: boolean; message: string }>;
  reactivateSubscription: () => Promise<{ success: boolean; message: string }>;
  useCredit: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<{ url: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [usageView, setUsageView] = useState<SubscriptionUsageView | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Load subscription data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptionData();
    } else {
      setStatus(null);
      setUsageView(null);
      setHistory([]);
    }
  }, [isAuthenticated, user]);

  const loadSubscriptionData = async () => {
    if (!user?.user_id && !user?.email) return;
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      
      // FIRST: Try to use cached initialization data from login/session
      const cachedInit = initializationService.getCachedInitData();
      
      if (cachedInit) {
        console.log('✅ [SubscriptionContext] Using cached initialization data');
        setStatus(cachedInit.data.subscription as any);
        setUsageView(toUsageView(cachedInit.data.subscription as any));
        setPlans(cachedInit.data.plans as any);
        
        // Load history in background (non-critical)
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to load history:", err));
        
        setLoading(false);
        return;
      }
      
      // FALLBACK: No cache - fetch fresh data
      console.log('🔄 [SubscriptionContext] No cached data, fetching fresh subscription data');
      const [statusData, plansData] = await Promise.all([
        subscriptionService.getStatus(userId),
        subscriptionService.getPlans()
      ]);
      
      setStatus(statusData);
      setUsageView(toUsageView(statusData));
      setPlans(plansData.plans);
      
      // Load history in background (non-critical)
      subscriptionService.getHistory(userId, 10)
        .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
        .catch(err => console.error("Failed to load history:", err));
      
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      
      // If user has no subscription (404), initialize freemium in background
      // Don't block the UI - set default freemium state immediately
      if ((error as any)?.response?.status === 404) {
        console.log('⚠️ No subscription found, initializing freemium...');
        
        // Set optimistic default freemium state immediately
        const defaultFreemiumStatus: SubscriptionStatus = {
          tier: "freemium",
          status: "active",
          billing_period: "monthly",
          renewal_type: "calendar",
          monthly_quota: 1,
          monthly_used: 0,
          monthly_remaining: 1,
          daily_quota: 1,
          daily_used: 0,
          daily_remaining: 1,
          addon_quota_remaining: 0,
          addon_packs_purchased: 0,
          renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          start_date: new Date().toISOString(),
          features: [],
          auto_renewal: true,
          pending_tier: null,
          pending_billing_period: null,
          welcome_pack: null
        };
        setStatus(defaultFreemiumStatus);
        setUsageView(toUsageView(defaultFreemiumStatus));
        
        // Initialize freemium in background
        subscriptionService.initializeFreemium(userId)
          .then((initResponse: InitializeFreemiumResponse) => {
            console.log('✅ Freemium initialized successfully');
            const initStatus: SubscriptionStatus = {
              tier: initResponse.subscription.tier,
              status: initResponse.subscription.status,
              billing_period: "monthly",
              renewal_type: "calendar",
              monthly_quota: initResponse.subscription.monthly_quota,
              monthly_used: 0,
              monthly_remaining: initResponse.subscription.monthly_quota,
              daily_quota: initResponse.subscription.daily_quota,
              daily_used: 0,
              daily_remaining: initResponse.subscription.daily_quota,
              addon_quota_remaining: 0,
              addon_packs_purchased: 0,
              renewal_date: initResponse.subscription.renewal_date,
              start_date: new Date().toISOString(),
              features: [],
              auto_renewal: false,
              pending_tier: null,
              pending_billing_period: null,
              welcome_pack: null
            };
            setStatus(initStatus);
            setUsageView(toUsageView(initStatus));
          })
          .catch(initError => {
            console.error("Failed to initialize freemium in background:", initError);
            // Keep the optimistic default state
          });
      } else {
        setStatus(null);
        setUsageView(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user?.user_id && !user?.email) {
      console.error("User ID not available for subscription refresh");
      return;
    }
    
    const userId = user.user_id || user.email;
    
    try {
      const statusData = await subscriptionService.getStatus(userId);
      setStatus(statusData);
      setUsageView(toUsageView(statusData));
      
      // Refresh history in background
      subscriptionService.getHistory(userId, 10)
        .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
        .catch(err => console.error("Failed to refresh history:", err));
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  };

  // NEW: Refresh quota after generation (lightweight, no history reload)
  const refreshQuotaAfterGeneration = async (): Promise<void> => {
    if (!user?.user_id && !user?.email) return;
    
    const userId = user.user_id || user.email;
    
    try {
      const statusData = await subscriptionService.getStatus(userId);
      setStatus(statusData);
      setUsageView(toUsageView(statusData));
      console.log('✅ [SubscriptionContext] Quota refreshed after generation');
    } catch (error) {
      console.error("Failed to refresh quota after generation:", error);
    }
  };

  // Update status from quota_info returned by exercise generation API
  const updateStatusFromQuotaInfo = (quotaInfo: SubscriptionStatus): void => {
    console.log("Updating subscription status from quota_info:", quotaInfo);
    setStatus(quotaInfo);
    setUsageView(toUsageView(quotaInfo));
  };

  // NEW: Change subscription tier
  const changeTier = async (
    newTier: "freemium" | "standard" | "famille_plus",
    billingPeriod?: "monthly" | "yearly"
  ): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.changeTier(userId, { 
        new_tier: newTier,
        new_billing_period: billingPeriod || status?.billing_period || "monthly"
      });
      
      if (result.success) {
        // Clear cached initialization data
        initializationService.clearInitCache();
        
        // Targeted refresh of subscription status only
        console.log("Tier change successful, refreshing subscription status...");
        const updatedStatus = await subscriptionService.getStatus(userId);
        console.log("Updated status received:", updatedStatus);
        console.log("Pending tier:", updatedStatus.pending_tier);
        console.log("Pending billing period:", updatedStatus.pending_billing_period);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));
        
        // Refresh history in background
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }
      
      return result;
    } catch (error) {
      console.error("Failed to change tier:", error);
      return { 
        success: false, 
        message: (error as any)?.response?.data?.detail || "Erreur lors du changement d'abonnement" 
      };
    } finally {
      setLoading(false);
    }
  };

  // NEW: Change billing period
  const changeBillingPeriod = async (newPeriod: "monthly" | "yearly"): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.changeBillingPeriod(userId, { 
        new_period: newPeriod 
      });
      
      if (result.success) {
        // Clear cached initialization data
        initializationService.clearInitCache();
        
        // Targeted refresh of subscription status
        console.log("Billing period change successful, refreshing subscription status...");
        const updatedStatus = await subscriptionService.getStatus(userId);
        console.log("Updated status received:", updatedStatus);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));
        
        // Refresh history in background
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }
      
      return result;
    } catch (error) {
      console.error("Failed to change billing period:", error);
      return { 
        success: false, 
        message: (error as any)?.response?.data?.detail || "Erreur lors du changement de période" 
      };
    } finally {
      setLoading(false);
    }
  };

  // NEW: Buy addon pack
  const buyAddonPack = async (quantity: number): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.buyAddonPack(userId, { 
        pack_count: quantity 
      });
      
      if (result.success) {
        // Clear cached initialization data
        initializationService.clearInitCache();
        
        // Targeted refresh of subscription status
        console.log("Addon pack purchase successful, refreshing subscription status...");
        const updatedStatus = await subscriptionService.getStatus(userId);
        console.log("Updated status received:", updatedStatus);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));
        
        // Refresh history in background
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }
      
      return { 
        success: result.success, 
        message: result.message || `Pack de ${quantity} fiches acheté avec succès` 
      };
    } catch (error) {
      console.error("Failed to buy addon pack:", error);
      return { 
        success: false, 
        message: (error as any)?.response?.data?.detail || "Erreur lors de l'achat du pack" 
      };
    } finally {
      setLoading(false);
    }
  };

  // ========== STRIPE PAYMENT METHODS ==========

  // Helper: Check if user has active Stripe subscription
  const hasStripeSubscription = (): boolean => {
    return !!(status?.stripe_subscription_id);
  };

  // Helper: Check if target tier requires Stripe payment
  const requiresStripePayment = (targetTier: "freemium" | "standard" | "famille_plus"): boolean => {
    // Freemium never requires payment
    if (targetTier === "freemium") return false;
    
    // If current is freemium, target is paid -> requires payment
    if (status?.tier === "freemium") return true;
    
    // If already has Stripe subscription, will use updateSubscription
    return false;
  };

  // Calculate proration for subscription upgrade/downgrade
  const calculateProration = async (
    newTier: "standard" | "famille_plus",
    newBillingPeriod: "monthly" | "yearly"
  ): Promise<{ amount: number } | null> => {
    if (!user?.user_id && !user?.email) {
      console.error("User not authenticated");
      return null;
    }

    try {
      const result = await stripeService.calculateProration(newTier, newBillingPeriod);
      return { amount: result.amount };
    } catch (error) {
      console.error("Failed to calculate proration:", error);
      return null;
    }
  };

  // Create new Stripe subscription (freemium -> paid tier)
  const createStripeSubscription = async (
    tier: "standard" | "famille_plus",
    billingPeriod: "monthly" | "yearly",
    paymentMethodId: string
  ): Promise<{ 
    success: boolean; 
    message: string; 
    requiresConfirmation?: boolean; 
    clientSecret?: string 
  }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }

    const userId = user.user_id || user.email;

    try {
      setLoading(true);

      if (!user.email) {
        return {
          success: false,
          message: "Email utilisateur non disponible"
        };
      }

      // Create Stripe subscription
      const stripeResult = await stripeService.createSubscription(
        tier,
        billingPeriod,
        paymentMethodId,
        user.email
      );

      if (!stripeResult.subscription_id) {
        return {
          success: false,
          message: "Erreur lors de la création de l'abonnement Stripe"
        };
      }

      // Check if 3D Secure confirmation needed
      if (stripeResult.client_secret) {
        return {
          success: true,
          message: "Confirmation de paiement requise",
          requiresConfirmation: true,
          clientSecret: stripeResult.client_secret
        };
      }

      // Subscription created successfully, now update backend
      const result = await subscriptionService.changeTier(userId, {
        new_tier: tier,
        new_billing_period: billingPeriod
      });

      if (result.success) {
        // Refresh subscription status
        const updatedStatus = await subscriptionService.getStatus(userId);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));

        // Refresh history
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }

      return {
        success: true,
        message: result.message || "Abonnement créé avec succès"
      };
    } catch (error) {
      console.error("Failed to create Stripe subscription:", error);
      return {
        success: false,
        message: (error as any)?.response?.data?.detail || "Erreur lors de la création de l'abonnement"
      };
    } finally {
      setLoading(false);
    }
  };

  // Update existing Stripe subscription (paid -> paid tier change)
  const updateStripeSubscription = async (
    newTier: "standard" | "famille_plus",
    newBillingPeriod: "monthly" | "yearly"
  ): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }

    if (!hasStripeSubscription()) {
      return { success: false, message: "No active Stripe subscription" };
    }

    const userId = user.user_id || user.email;

    try {
      setLoading(true);

      // Update Stripe subscription
      const stripeResult = await stripeService.updateSubscription(newTier, newBillingPeriod);

      if (!stripeResult.success) {
        return {
          success: false,
          message: stripeResult.message || "Erreur lors de la mise à jour de l'abonnement Stripe"
        };
      }

      // Update backend
      const result = await subscriptionService.changeTier(userId, {
        new_tier: newTier,
        new_billing_period: newBillingPeriod
      });

      if (result.success) {
        // Refresh subscription status
        const updatedStatus = await subscriptionService.getStatus(userId);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));

        // Refresh history
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }

      return {
        success: true,
        message: result.message || "Abonnement mis à jour avec succès"
      };
    } catch (error) {
      console.error("Failed to update Stripe subscription:", error);
      return {
        success: false,
        message: (error as any)?.response?.data?.detail || "Erreur lors de la mise à jour de l'abonnement"
      };
    } finally {
      setLoading(false);
    }
  };

  // Buy addon packs with Stripe payment
  const buyAddonPackWithStripe = async (
    quantity: number,
    paymentMethodId: string
  ): Promise<{ success: boolean; message: string; quotasAdded?: number }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }

    const userId = user.user_id || user.email;

    try {
      setLoading(true);

      if (!user.email) {
        return {
          success: false,
          message: "Email utilisateur non disponible"
        };
      }

      // Purchase addon packs via Stripe
      const stripeResult = await stripeService.purchaseAddonPacks(quantity, paymentMethodId, user.email);

      if (!stripeResult.success) {
        return {
          success: false,
          message: stripeResult.message || "Erreur lors de l'achat du pack"
        };
      }

      // Update backend subscription with new quotas
      const result = await subscriptionService.buyAddonPack(userId, {
        pack_count: quantity
      });

      if (result.success) {
        // Refresh subscription status
        const updatedStatus = await subscriptionService.getStatus(userId);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));

        // Refresh history
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }

      return {
        success: true,
        message: result.message || `${quantity} pack(s) acheté(s) avec succès`,
        quotasAdded: stripeResult.quotas_added
      };
    } catch (error) {
      console.error("Failed to buy addon pack with Stripe:", error);
      return {
        success: false,
        message: (error as any)?.response?.data?.detail || "Erreur lors de l'achat du pack"
      };
    } finally {
      setLoading(false);
    }
  };

  // ========== END STRIPE PAYMENT METHODS ==========

  // LEGACY: Upgrade plan (maps to changeTier)
  const upgradePlan = async (planId: string): Promise<{ success: boolean; message: string }> => {
    // Map legacy planId to tier
    const tierMap: Record<string, "freemium" | "standard" | "famille_plus"> = {
      "free": "freemium",
      "standard": "standard",
      "famille_plus": "famille_plus",
      "family": "famille_plus"
    };
    
    const newTier = tierMap[planId.toLowerCase()] || "standard";
    return changeTier(newTier);
  };

  // LEGACY: Downgrade plan (maps to changeTier)
  const downgradePlan = async (planId: string): Promise<{ success: boolean; message: string }> => {
    const tierMap: Record<string, "freemium" | "standard" | "famille_plus"> = {
      "free": "freemium",
      "standard": "standard",
      "famille_plus": "famille_plus",
      "family": "famille_plus"
    };
    
    const newTier = tierMap[planId.toLowerCase()] || "freemium";
    return changeTier(newTier);
  };

  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    if (!status) {
      return { success: false, message: "No active subscription" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.cancelAutoRenewal(userId);
      
      if (result.success) {
        // Clear cached initialization data
        initializationService.clearInitCache();
        
        // Refresh subscription status to get updated auto_renewal flag
        console.log("Auto-renewal cancelled, refreshing subscription status...");
        const updatedStatus = await subscriptionService.getStatus(userId);
        console.log("Updated status received:", updatedStatus);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));
        
        // Refresh history in background
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }
      
      return result;
    } catch (error) {
      console.error("Failed to cancel auto-renewal:", error);
      return { 
        success: false, 
        message: (error as any)?.response?.data?.detail || "Erreur lors de l'annulation du renouvellement" 
      };
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    if (!status) {
      return { success: false, message: "No subscription to reactivate" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.reactivateAutoRenewal(userId);
      
      if (result.success) {
        // Refresh subscription status to get updated auto_renewal flag
        console.log("Auto-renewal reactivated, refreshing subscription status...");
        const updatedStatus = await subscriptionService.getStatus(userId);
        console.log("Updated status received:", updatedStatus);
        setStatus(updatedStatus);
        setUsageView(toUsageView(updatedStatus));
        
        // Refresh history in background
        subscriptionService.getHistory(userId, 10)
          .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
          .catch(err => console.error("Failed to refresh history:", err));
      }
      
      return result;
    } catch (error) {
      console.error("Failed to reactivate auto-renewal:", error);
      return { 
        success: false, 
        message: (error as any)?.response?.data?.detail || "Erreur lors de la réactivation du renouvellement" 
      };
    } finally {
      setLoading(false);
    }
  };

  const canGenerateMore = (): boolean => {
    if (!status) return false;
    return canGenerateMoreFromStatus(status);
  };

  const getRemainingFiches = (): number => {
    if (!status) return 0;
    return computeRemainingForToday(status).totalRemainingForToday;
  };

  // LEGACY: useCredit - now relies on backend refresh after generation
  // In Phase 3, this will be removed in favor of automatic refresh after generation
  const useCredit = async (): Promise<void> => {
    if (!status) {
      throw new Error("No active subscription");
    }
    
    if (!canGenerateMore()) {
      throw new Error("Limite atteinte pour aujourd'hui");
    }
    
    // No local state manipulation - backend tracks usage
    // After generation, the UI should call refreshSubscription()
    console.warn("useCredit is deprecated - call refreshSubscription after generation instead");
  };

  // LEGACY: Create checkout session (preserved for payment flow)
  const createCheckoutSession = async (planId: string): Promise<{ url: string }> => {
    return await subscriptionService.createCheckoutSession(planId);
  };

  return (
    <SubscriptionContext.Provider value={{
      // New state
      status,
      usageView,
      plans,
      history,
      loading,
      
      // New actions
      refreshSubscription,
      refreshQuotaAfterGeneration,
      updateStatusFromQuotaInfo,
      changeTier,
      changeBillingPeriod,
      buyAddonPack,
      cancelSubscription,
      
      // Stripe payment methods
      buyAddonPackWithStripe,
      createStripeSubscription,
      updateStripeSubscription,
      calculateProration,
      
      // Helpers
      canGenerateMore,
      getRemainingFiches,
      hasStripeSubscription,
      requiresStripePayment,
      
      // Legacy compatibility (deprecated)
      upgradePlan,
      downgradePlan,
      reactivateSubscription,
      useCredit,
      createCheckoutSession,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
};
