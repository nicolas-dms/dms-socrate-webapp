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
   * Backend: POST /api/subscription/stripe/create?user_email={email}
   * 
   * @param tier - Subscription tier ('standard' or 'famille_plus')
   * @param billingPeriod - Billing period ('monthly' or 'yearly')
   * @param paymentMethodId - Payment method ID from Stripe Elements
   * @param userEmail - User's email address (required by backend)
   */
  async createSubscription(
    tier: SubscriptionTier,
    billingPeriod: BillingPeriod,
    paymentMethodId: string,
    userEmail: string
  ): Promise<StripeSubscriptionResponse> {
    const request: CreateSubscriptionRequest = {
      tier,
      billing_period: billingPeriod,
      payment_method_id: paymentMethodId,
    };
    
    console.log('💳 [Stripe Service] Creating subscription:', {
      endpoint: `/api/subscription/stripe/create?user_email=${userEmail}`,
      request: request,
      userEmail: userEmail
    });
    
    try {
      const response = await api.post<StripeSubscriptionResponse>(
        `/api/subscription/stripe/create?user_email=${encodeURIComponent(userEmail)}`,
        request
      );
      
      console.log('✅ [Stripe Service] Subscription created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Stripe Service] Failed to create subscription:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        request: request,
        userEmail: userEmail
      });
      
      // Log specific backend error for debugging
      if (error.response?.status === 500 && error.response?.data?.detail) {
        console.error('🔴 [Backend Error]:', error.response.data.detail);
        console.error('⚠️ This is a BACKEND issue. The backend Stripe integration needs to be fixed.');
        console.error('⚠️ The backend is failing to process the Stripe subscription response.');
      }
      
      throw error;
    }
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
   * Backend: POST /api/subscription/stripe/addon?user_email={email}
   * 
   * @param numPacks - Number of addon packs to purchase (1-10)
   * @param paymentMethodId - Payment method ID from Stripe Elements
   * @param userEmail - User's email address (required by backend)
   */
  async purchaseAddonPacks(
    numPacks: number,
    paymentMethodId: string,
    userEmail: string
  ): Promise<AddonPurchaseResponse> {
    if (numPacks < 1 || numPacks > 10) {
      throw new Error("Number of packs must be between 1 and 10");
    }

    const request: PurchaseAddonRequest = {
      num_packs: numPacks,
      payment_method_id: paymentMethodId,
    };
    
    console.log('🎁 [Stripe Service] Purchasing addon packs:', {
      endpoint: `/api/subscription/stripe/addon?user_email=${userEmail}`,
      request: {
        num_packs: numPacks,
        payment_method_id: paymentMethodId ? `${paymentMethodId.substring(0, 10)}...` : 'null'
      },
      userEmail: userEmail,
      fullRequest: request
    });
    
    try {
      const response = await api.post<AddonPurchaseResponse>(
        `/api/subscription/stripe/addon?user_email=${encodeURIComponent(userEmail)}`,
        request
      );
      
      console.log('✅ [Stripe Service] Addon packs purchased successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Stripe Service] Failed to purchase addon packs:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        request: request,
        requestDetails: {
          num_packs: numPacks,
          payment_method_id_length: paymentMethodId?.length,
          payment_method_id_prefix: paymentMethodId?.substring(0, 10)
        }
      });
      
      // Log specific 422 validation errors
      if (error.response?.status === 422) {
        const detailArray = error.response?.data?.detail;
        
        console.error('🔴 [Validation Error - 422]:', {
          detail: detailArray,
          validationErrors: error.response?.data?.errors,
          message: 'The backend rejected the request due to validation failure'
        });
        
        // If detail is an array, log each validation error
        if (Array.isArray(detailArray)) {
          console.error('🔴 [Detailed Validation Errors]:');
          detailArray.forEach((err, index) => {
            console.error(`  Error ${index + 1}:`, err);
            if (err.loc) console.error(`    Location:`, err.loc);
            if (err.msg) console.error(`    Message:`, err.msg);
            if (err.type) console.error(`    Type:`, err.type);
          });
        }
        
        // Check for common issues
        if (!paymentMethodId) {
          console.error('⚠️ ISSUE: payment_method_id is missing or null');
        }
        if (typeof numPacks !== 'number') {
          console.error('⚠️ ISSUE: num_packs is not a number:', typeof numPacks);
        }
        if (numPacks < 1 || numPacks > 10) {
          console.error('⚠️ ISSUE: num_packs is out of range (1-10):', numPacks);
        }
      }
      
      throw error;
    }
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
