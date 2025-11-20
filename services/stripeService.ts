// Stripe Service - Payment Integration
// Handles all Stripe API calls for subscriptions and payments

import api from "./api";
import {
  StripeCustomer,
  StripeSubscriptionResponse,
  UpdateSubscriptionResponse,
  CancelSubscriptionResponse,
  AddonPurchaseResponse,
  ProrationResponse,
  CreateCustomerRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  PurchaseAddonRequest,
  CalculateProrationRequest,
} from "../types/stripe";
import { SubscriptionTier, BillingPeriod } from "../types/subscription";

class StripeService {
  /**
   * Get or create a Stripe customer for the current user
   * Backend: POST /api/subscription/stripe/customer
   */
  async getOrCreateCustomer(email: string, name: string): Promise<StripeCustomer> {
    const request: CreateCustomerRequest = { email, name };
    const response = await api.post<StripeCustomer>(
      `/api/subscription/stripe/customer`,
      request
    );
    return response.data;
  }

  /**
   * Create a new Stripe subscription for a tier
   * Backend: POST /api/subscription/stripe/create
   * 
   * @param tier - Subscription tier ('standard' or 'famille_plus')
   * @param billingPeriod - Billing period ('monthly' or 'yearly')
   * @param paymentMethodId - Payment method ID from Stripe Elements
   */
  async createSubscription(
    tier: SubscriptionTier,
    billingPeriod: BillingPeriod,
    paymentMethodId: string
  ): Promise<StripeSubscriptionResponse> {
    const request: CreateSubscriptionRequest = {
      tier,
      billing_period: billingPeriod,
      payment_method_id: paymentMethodId,
    };
    const response = await api.post<StripeSubscriptionResponse>(
      `/api/subscription/stripe/create`,
      request
    );
    return response.data;
  }

  /**
   * Update an existing Stripe subscription (upgrade/downgrade)
   * Backend: POST /api/subscription/stripe/update
   * 
   * @param newTier - New subscription tier
   * @param newBillingPeriod - New billing period
   */
  async updateSubscription(
    newTier: SubscriptionTier,
    newBillingPeriod: BillingPeriod
  ): Promise<UpdateSubscriptionResponse> {
    const request: UpdateSubscriptionRequest = {
      new_tier: newTier,
      new_billing_period: newBillingPeriod,
    };
    const response = await api.post<UpdateSubscriptionResponse>(
      `/api/subscription/stripe/update`,
      request
    );
    return response.data;
  }

  /**
   * Cancel a Stripe subscription
   * Backend: POST /api/subscription/stripe/cancel
   * 
   * @param cancelAtPeriodEnd - If true, cancel at end of period; if false, cancel immediately
   */
  async cancelSubscription(
    cancelAtPeriodEnd: boolean = true
  ): Promise<CancelSubscriptionResponse> {
    const request: CancelSubscriptionRequest = {
      cancel_at_period_end: cancelAtPeriodEnd,
    };
    const response = await api.post<CancelSubscriptionResponse>(
      `/api/subscription/stripe/cancel`,
      request
    );
    return response.data;
  }

  /**
   * Purchase addon packs
   * Backend: POST /api/subscription/stripe/addon
   * 
   * @param numPacks - Number of addon packs to purchase (1-10)
   * @param paymentMethodId - Payment method ID from Stripe Elements
   */
  async purchaseAddonPacks(
    numPacks: number,
    paymentMethodId: string
  ): Promise<AddonPurchaseResponse> {
    if (numPacks < 1 || numPacks > 10) {
      throw new Error("Number of packs must be between 1 and 10");
    }

    const request: PurchaseAddonRequest = {
      num_packs: numPacks,
      payment_method_id: paymentMethodId,
    };
    const response = await api.post<AddonPurchaseResponse>(
      `/api/subscription/stripe/addon`,
      request
    );
    return response.data;
  }

  /**
   * Calculate proration amount for a subscription change
   * Backend: POST /api/subscription/stripe/proration
   * 
   * @param newTier - New tier to calculate proration for
   * @param newBillingPeriod - New billing period
   * @returns Proration amount in euros
   */
  async calculateProration(
    newTier: SubscriptionTier,
    newBillingPeriod: BillingPeriod
  ): Promise<ProrationResponse> {
    const request: CalculateProrationRequest = {
      new_tier: newTier,
      new_billing_period: newBillingPeriod,
    };
    const response = await api.post<ProrationResponse>(
      `/api/subscription/stripe/proration`,
      request
    );
    return response.data;
  }

  /**
   * Helper: Format currency amount for display
   * @param amount - Amount in euros (can be decimal)
   * @returns Formatted string like "12.99€"
   */
  formatAmount(amount: number): string {
    return `${amount.toFixed(2)}€`;
  }

  /**
   * Helper: Check if a payment requires 3D Secure confirmation
   * @param clientSecret - Client secret from Stripe response
   * @returns True if client secret is present (requires confirmation)
   */
  requiresConfirmation(clientSecret?: string): boolean {
    return !!clientSecret;
  }
}

export const stripeService = new StripeService();
