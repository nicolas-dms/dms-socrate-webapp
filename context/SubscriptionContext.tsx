"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  subscriptionService,
  computeRemainingForToday,
  canGenerateMoreFromStatus,
  toUsageView
} from "../services/subscriptionService";
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
  updateStatusFromQuotaInfo: (quotaInfo: SubscriptionStatus) => void;
  changeTier: (newTier: "freemium" | "standard" | "famille_plus") => Promise<{ success: boolean; message: string }>;
  changeBillingPeriod: (newPeriod: "monthly" | "yearly") => Promise<{ success: boolean; message: string }>;
  buyAddonPack: (quantity: number) => Promise<{ success: boolean; message: string }>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
  
  // Helpers
  canGenerateMore: () => boolean;
  getRemainingFiches: () => number;
  
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
      
      // Load plans and status in parallel
      const [plansData, statusData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getStatus(userId),
      ]);
      
      setPlans(plansData.plans);
      setStatus(statusData);
      setUsageView(toUsageView(statusData));
      
      // Load history in background (non-critical)
      subscriptionService.getHistory(userId, 10)
        .then((historyData: HistoryResponse) => setHistory(historyData.transactions))
        .catch(err => console.error("Failed to load history:", err));
      
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      
      // If user has no subscription, try to initialize freemium
      if ((error as any)?.response?.status === 404) {
        try {
          const initResponse: InitializeFreemiumResponse = await subscriptionService.initializeFreemium(userId);
          // Note: initializeFreemium returns a nested structure
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
            auto_renewal: false
          };
          setStatus(initStatus);
          setUsageView(toUsageView(initStatus));
        } catch (initError) {
          console.error("Failed to initialize freemium:", initError);
          setStatus(null);
          setUsageView(null);
        }
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

  // Update status from quota_info returned by exercise generation API
  const updateStatusFromQuotaInfo = (quotaInfo: SubscriptionStatus): void => {
    console.log("Updating subscription status from quota_info:", quotaInfo);
    setStatus(quotaInfo);
    setUsageView(toUsageView(quotaInfo));
  };

  // NEW: Change subscription tier
  const changeTier = async (newTier: "freemium" | "standard" | "famille_plus"): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id && !user?.email) {
      return { success: false, message: "User not authenticated" };
    }
    
    const userId = user.user_id || user.email;
    
    try {
      setLoading(true);
      const result = await subscriptionService.changeTier(userId, { 
        new_tier: newTier,
        new_billing_period: status?.billing_period || "monthly"
      });
      
      if (result.success) {
        // Force immediate refresh of subscription status
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
        // Force immediate refresh of subscription status
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
        // Force immediate refresh of subscription status
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
      updateStatusFromQuotaInfo,
      changeTier,
      changeBillingPeriod,
      buyAddonPack,
      cancelSubscription,
      
      // Helpers
      canGenerateMore,
      getRemainingFiches,
      
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
