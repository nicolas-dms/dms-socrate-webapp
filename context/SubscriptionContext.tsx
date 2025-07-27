"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { subscriptionService, UserSubscription, SubscriptionUsage, SubscriptionPlan, SUBSCRIPTION_PLANS } from "../services/subscriptionService";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: SubscriptionUsage | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  upgradePlan: (planId: string) => Promise<{ success: boolean; message: string }>;
  downgradePlan: (planId: string) => Promise<{ success: boolean; message: string }>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
  reactivateSubscription: () => Promise<{ success: boolean; message: string }>;
  canGenerateMore: () => boolean;
  getRemainingFiches: () => number;
  useCredit: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<{ url: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const plans = SUBSCRIPTION_PLANS;

  // Load subscription data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscriptionData();
    } else {
      setSubscription(null);
      setUsage(null);
    }
  }, [isAuthenticated, user]);

  const loadSubscriptionData = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const [subscriptionData, usageData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getSubscriptionUsage(),
      ]);
      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      // Fallback for development
      setSubscription(null);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user?.user_id) {
      console.error("User ID not available for subscription refresh");
      return;
    }
    
    try {
      const [subscriptionData, usageData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getSubscriptionUsage(),
      ]);
      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  };

  const upgradePlan = async (planId: string): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id) {
      return { success: false, message: "User not authenticated" };
    }
    
    try {
      setLoading(true);
      const result = await subscriptionService.upgradePlan(planId);
      if (result.success) {
        await refreshSubscription();
      }
      return result;
    } catch (error) {
      console.error("Failed to upgrade plan:", error);
      return { success: false, message: "Erreur lors de la mise à jour de l'abonnement" };
    } finally {
      setLoading(false);
    }
  };

  const downgradePlan = async (planId: string): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id) {
      return { success: false, message: "User not authenticated" };
    }
    
    try {
      setLoading(true);
      const result = await subscriptionService.downgradePlan(planId);
      if (result.success) {
        await refreshSubscription();
      }
      return result;
    } catch (error) {
      console.error("Failed to downgrade plan:", error);
      return { success: false, message: "Erreur lors de la modification de l'abonnement" };
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id) {
      return { success: false, message: "User not authenticated" };
    }
    
    try {
      setLoading(true);
      const result = await subscriptionService.cancelSubscription();
      if (result.success) {
        await refreshSubscription();
      }
      return result;
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      return { success: false, message: "Erreur lors de l'annulation de l'abonnement" };
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!user?.user_id) {
      return { success: false, message: "User not authenticated" };
    }
    
    try {
      setLoading(true);
      const result = await subscriptionService.reactivateSubscription();
      if (result.success) {
        await refreshSubscription();
      }
      return result;
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      return { success: false, message: "Erreur lors de la réactivation de l'abonnement" };
    } finally {
      setLoading(false);
    }
  };

  const canGenerateMore = (): boolean => {
    if (!subscription) return false;
    return subscriptionService.canGenerateMoreFiches(subscription);
  };

  const getRemainingFiches = (): number => {
    if (!subscription) return 0;
    return subscriptionService.getRemainingFiches(subscription);
  };

  const useCredit = async (): Promise<void> => {
    if (!subscription || !usage) {
      throw new Error("No active subscription");
    }
    
    if (!canGenerateMore()) {
      throw new Error("Limite mensuelle atteinte");
    }
    
    try {
      // Update local state immediately for UI responsiveness
      setSubscription({
        ...subscription,
        usageThisMonth: subscription.usageThisMonth + 1
      });
      
      setUsage({
        ...usage,
        current: usage.current + 1,
        percentageUsed: Math.round(((usage.current + 1) / usage.limit) * 100)
      });
      
      // TODO: Call backend to record usage
      // await subscriptionService.recordUsage(user.user_id, 1);
    } catch (error) {
      console.error("Failed to use credit:", error);
      throw error;
    }
  };

  const createCheckoutSession = async (planId: string): Promise<{ url: string }> => {
    return await subscriptionService.createCheckoutSession(planId);
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      usage,
      plans,
      loading,
      refreshSubscription,
      upgradePlan,
      downgradePlan,
      cancelSubscription,
      reactivateSubscription,
      canGenerateMore,
      getRemainingFiches,
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
