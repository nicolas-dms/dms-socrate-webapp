// Subscription Service - Backend Integration
// Based on SUBSCRIPTION_FRONTEND_GUIDE.md

import api from "./api";
import {
  SubscriptionTier,
  BillingPeriod,
  SubscriptionStatus,
  SubscriptionUsageView,
  SubscriptionPlansResponse,
  InitializeFreemiumResponse,
  ChangeSubscriptionTierRequest,
  ChangeBillingPeriodRequest,
  PurchaseAddonPackRequest,
  PurchaseAddonPackResponse,
  HistoryResponse,
  QuotaBreakdown,
} from "../types/subscription";

// ============================================================================
// Legacy Types (kept temporarily for backwards compatibility during migration)
// ============================================================================

export interface UserSubscription {
  id: string;
  planId: string;
  status: "active" | "cancelled" | "past_due" | "unpaid";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usageThisMonth: number;
  monthlyLimit: number;
}

export interface SubscriptionUsage {
  current: number;
  limit: number;
  resetDate: string;
  percentageUsed: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyLimit: number;
  description: string;
  features: string[];
}

// Legacy mock plans (will be removed in Phase 4)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2.99,
    monthlyLimit: 30,
    description: "Parfait pour commencer et découvrir l application",
    features: [
      "30 fiches par mois",
      "Tous les types d exercices",
      "Support par email",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 5.99,
    monthlyLimit: 100,
    description: "Le plan le plus populaire pour un usage régulier",
    features: [
      "100 fiches par mois",
      "Tous les types d exercices",
      "Support prioritaire",
      "Historique étendu",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 12.99,
    monthlyLimit: 500,
    description: "Pour les enseignants et utilisateurs intensifs",
    features: [
      "500 fiches par mois",
      "Tous les types d exercices",
      "Support prioritaire",
      "Historique illimité",
      "Accès anticipé aux nouvelles fonctionnalités",
    ],
  },
];

// ============================================================================
// Quota Helper Functions
// ============================================================================

export function computeRemainingForToday(
  status: SubscriptionStatus
): QuotaBreakdown {
  const addonRemaining = status.addon_quota_remaining;
  const monthlyRemaining = Math.max(
    0,
    status.monthly_quota - status.monthly_used
  );
  const dailyLimit = status.daily_quota ?? Infinity;
  const dailyUsed = status.daily_used ?? 0;
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  const totalRemainingForToday = Math.max(
    0,
    Math.min(addonRemaining + monthlyRemaining, dailyRemaining)
  );

  return {
    addonRemaining,
    monthlyRemaining,
    dailyRemaining,
    totalRemainingForToday,
  };
}

export function canGenerateMoreFromStatus(
  status: SubscriptionStatus
): boolean {
  if (status.status !== "active") return false;

  const { totalRemainingForToday } = computeRemainingForToday(status);
  return totalRemainingForToday > 0;
}

export function toUsageView(
  status: SubscriptionStatus
): SubscriptionUsageView {
  const {
    addonRemaining,
    monthlyRemaining,
    dailyRemaining,
    totalRemainingForToday,
  } = computeRemainingForToday(status);

  const percentageUsedMonthly = status.monthly_quota
    ? Math.min(
        100,
        Math.round((status.monthly_used / status.monthly_quota) * 100)
      )
    : 0;

  return {
    monthly_limit: status.monthly_quota,
    monthly_used: status.monthly_used,
    daily_limit: status.daily_quota ?? null,
    daily_used: status.daily_used ?? null,
    addon_remaining: addonRemaining,
    can_generate: status.status === "active" && totalRemainingForToday > 0,
    total_remaining_for_today: totalRemainingForToday,
    percentage_used_monthly: percentageUsedMonthly,
  };
}

export function adaptToLegacySubscription(
  status: SubscriptionStatus
): UserSubscription {
  return {
    id: `sub_${status.tier}_${status.billing_period}`,
    planId: `${status.tier}_${status.billing_period}`,
    status:
      status.status === "active"
        ? "active"
        : status.status === "cancelled"
        ? "cancelled"
        : "unpaid",
    currentPeriodStart: status.start_date,
    currentPeriodEnd: status.renewal_date,
    cancelAtPeriodEnd: !status.auto_renewal,
    usageThisMonth: status.monthly_used,
    monthlyLimit: status.monthly_quota,
  };
}

export function adaptToLegacyUsage(
  status: SubscriptionStatus
): SubscriptionUsage {
  return {
    current: status.monthly_used,
    limit: status.monthly_quota,
    resetDate: status.renewal_date,
    percentageUsed: Math.round(
      (status.monthly_used / status.monthly_quota) * 100
    ),
  };
}

class SubscriptionService {
  async getPlans(): Promise<SubscriptionPlansResponse> {
    const response = await api.get<SubscriptionPlansResponse>("/api/subscription/plans");
    return response.data;
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const response = await api.get<SubscriptionStatus>(`/api/subscription/${encodeURIComponent(userId)}/status`);
    return response.data;
  }

  async initializeFreemium(userId: string): Promise<InitializeFreemiumResponse> {
    const response = await api.post<InitializeFreemiumResponse>(`/api/subscription/${encodeURIComponent(userId)}/initialize`);
    return response.data;
  }

  async changeTier(userId: string, request: ChangeSubscriptionTierRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/subscription/${encodeURIComponent(userId)}/change-tier`, request);
      return { success: true, message: response.data.message || "Abonnement mis à jour avec succès" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.detail || "Erreur lors du changement d abonnement" };
    }
  }

  async changeBillingPeriod(userId: string, request: ChangeBillingPeriodRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/subscription/${encodeURIComponent(userId)}/change-billing-period`, request);
      return { success: true, message: response.data.message || "Période de facturation mise à jour" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.detail || "Erreur lors du changement de période" };
    }
  }

  async buyAddonPack(userId: string, request: PurchaseAddonPackRequest): Promise<PurchaseAddonPackResponse> {
    const response = await api.post<PurchaseAddonPackResponse>(`/api/subscription/${encodeURIComponent(userId)}/addon-pack`, request);
    return response.data;
  }

  async getHistory(userId: string, limit?: number, transactionType?: string): Promise<HistoryResponse> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (transactionType) params.transaction_type = transactionType;
    const response = await api.get<HistoryResponse>(`/api/subscription/${encodeURIComponent(userId)}/history`, { params });
    return response.data;
  }

  async cancelAutoRenewal(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/subscription/${encodeURIComponent(userId)}/cancel-auto-renewal`);
      return { success: true, message: response.data.message || "Le renouvellement automatique a été annulé" };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.response?.data?.detail || "Erreur lors de l'annulation du renouvellement automatique" 
      };
    }
  }

  async reactivateAutoRenewal(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/subscription/${encodeURIComponent(userId)}/reactivate-auto-renewal`);
      return { success: true, message: response.data.message || "Le renouvellement automatique a été réactivé" };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.response?.data?.detail || "Erreur lors de la réactivation du renouvellement automatique" 
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await api.get("/api/subscription/health");
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const userId = "current-user@example.com";
      const status = await this.getStatus(userId);
      return adaptToLegacySubscription(status);
    } catch (error: any) {
      if (error.response?.status === 404) {
        const userId = "current-user@example.com";
        try {
          await this.initializeFreemium(userId);
          const status = await this.getStatus(userId);
          return adaptToLegacySubscription(status);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async getSubscriptionUsage(): Promise<SubscriptionUsage> {
    const userId = "current-user@example.com";
    const status = await this.getStatus(userId);
    return adaptToLegacyUsage(status);
  }

  async upgradePlan(newPlanId: string): Promise<{ success: boolean; message: string }> {
    const userId = "current-user@example.com";
    const parts = newPlanId.split("_");
    const tier = parts[0] as SubscriptionTier;
    const billingPeriod = (parts[1] || "monthly") as BillingPeriod;
    return this.changeTier(userId, { new_tier: tier, new_billing_period: billingPeriod });
  }

  async downgradePlan(newPlanId: string): Promise<{ success: boolean; message: string }> {
    const userId = "current-user@example.com";
    const parts = newPlanId.split("_");
    const tier = parts[0] as SubscriptionTier;
    const billingPeriod = (parts[1] || "monthly") as BillingPeriod;
    return this.changeTier(userId, { new_tier: tier, new_billing_period: billingPeriod });
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: "Fonctionnalité d annulation en cours de développement" };
  }

  async reactivateSubscription(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: "Fonctionnalité de réactivation en cours de développement" };
  }

  async createCheckoutSession(planId: string): Promise<{ url: string }> {
    return { url: `/subscription/checkout?plan=${planId}` };
  }

  getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
  }

  canGenerateMoreFiches(subscription: UserSubscription): boolean {
    return subscription.usageThisMonth < subscription.monthlyLimit;
  }

  getRemainingFiches(subscription: UserSubscription): number {
    return Math.max(0, subscription.monthlyLimit - subscription.usageThisMonth);
  }
}

export const subscriptionService = new SubscriptionService();
