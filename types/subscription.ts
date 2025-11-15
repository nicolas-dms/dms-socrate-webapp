// Subscription Types - Aligned with Backend API
// Based on SUBSCRIPTION_FRONTEND_GUIDE.md

// ============================================================================
// Core Enums and Types
// ============================================================================

export type SubscriptionTier = "freemium" | "standard" | "famille_plus";

export type BillingPeriod = "monthly" | "yearly";

export type SubscriptionStatusEnum = "active" | "expired" | "cancelled" | "pending";

export type RenewalType = "calendar" | "anniversary";

export type HistoryItemType =
  | "renewal"
  | "change_tier"
  | "change_billing_period"
  | "addon_purchase"
  | "usage";

// ============================================================================
// Plan and Pricing Types
// ============================================================================

export interface BillingInfo {
  price: number;
  currency: "EUR";
  period: "month" | "year";
  price_per_month?: number;
  display: string;
  discount_percent?: number;
  savings?: number;
  recommended?: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  display_name: string;
  description: string;
  monthly_quota: number;
  daily_quota: number | null;
  features: string[];
  pricing: {
    monthly: BillingInfo;
    yearly: BillingInfo;
  };
}

export interface AddonPackConfig {
  pack_size: number;
  price: number;
  display_name: string;
  description: string;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  addon_pack: AddonPackConfig;
}

// ============================================================================
// Subscription Status (from backend)
// ============================================================================

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: SubscriptionStatusEnum;
  billing_period: BillingPeriod;
  renewal_type: RenewalType;
  monthly_quota: number;
  monthly_used: number;
  monthly_remaining: number;
  daily_quota: number | null;
  daily_used: number | null;
  daily_remaining: number | null;
  addon_quota_remaining: number;
  addon_packs_purchased: number;
  renewal_date: string; // ISO date string
  start_date: string; // ISO date string
  features: string[];
  auto_renewal: boolean;
  pending_tier: SubscriptionTier | null; // Tier to apply on renewal_date (downgrade)
  pending_billing_period: BillingPeriod | null; // Billing period to apply on renewal_date
}

// ============================================================================
// Frontend-derived Usage View
// ============================================================================

export interface SubscriptionUsageView {
  monthly_limit: number;
  monthly_used: number;
  daily_limit: number | null;
  daily_used: number | null;
  addon_remaining: number;
  can_generate: boolean;
  total_remaining_for_today: number;
  percentage_used_monthly: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CheckoutResponse {
  checkout_url: string;
}

export interface InitializeFreemiumResponse {
  success: boolean;
  message: string;
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatusEnum;
    monthly_quota: number;
    daily_quota: number;
    renewal_date: string;
  };
}

export interface ChangeSubscriptionTierRequest {
  new_tier: SubscriptionTier;
  new_billing_period?: BillingPeriod;
}

export interface ChangeBillingPeriodRequest {
  new_period: BillingPeriod;
}

export interface PurchaseAddonPackRequest {
  pack_count: number; // 1-10
}

export interface PurchaseAddonPackResponse {
  success: boolean;
  message: string;
  packs_purchased: number;
  quotas_added: number;
  addon_quota_remaining: number;
  total_packs_purchased: number;
}

export interface HistoryItem {
  transaction_id: string;
  user_id: string;
  timestamp: string; // ISO date
  transaction_type: HistoryItemType;
  quota_source: "monthly" | "daily" | "addon" | null;
  quota_consumed: number;
  exercise_id: string | null;
  subject: string | null;
  monthly_quota_remaining: number;
  daily_quota_remaining: number | null;
  addon_quota_remaining: number;
  tier: SubscriptionTier;
  billing_period: BillingPeriod;
}

export interface HistoryResponse {
  user_id: string;
  transaction_count: number;
  transactions: HistoryItem[];
}

// ============================================================================
// Quota Computation Result
// ============================================================================

export interface QuotaBreakdown {
  addonRemaining: number;
  monthlyRemaining: number;
  dailyRemaining: number;
  totalRemainingForToday: number;
}
