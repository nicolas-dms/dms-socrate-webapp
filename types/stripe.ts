// Stripe-specific types for payment integration

export interface StripeCustomer {
  customer_id: string;
  email: string;
  name: string;
}

export interface StripeSubscriptionResponse {
  subscription_id: string;
  customer_id: string;
  status: 'active' | 'incomplete' | 'past_due' | 'trialing';
  client_secret?: string; // For payment confirmation with 3D Secure
  current_period_end: string;
  latest_invoice_payment_intent_status?: string;
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message: string;
  proration_amount?: number;
  client_secret?: string; // For additional payment if needed
  subscription_id?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancel_at: string;
  cancelled_at?: string;
}

export interface AddonPurchaseResponse {
  success: boolean;
  message: string;
  packs_purchased: number;
  quotas_added: number;
  total_cost: number;
  client_secret?: string; // For payment confirmation
  payment_intent_id?: string;
}

export interface ProrationResponse {
  amount: number; // in euros
  currency: 'eur';
  proration_date: string;
  new_amount?: number;
  old_amount?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface CreateCustomerRequest {
  email: string;
  name: string;
}

export interface CreateSubscriptionRequest {
  tier: string;
  billing_period: string;
  payment_method_id: string;
}

export interface UpdateSubscriptionRequest {
  new_tier: string;
  new_billing_period: string;
}

export interface CancelSubscriptionRequest {
  cancel_at_period_end: boolean;
}

export interface PurchaseAddonRequest {
  num_packs: number;
  payment_method_id: string;
}

export interface CalculateProrationRequest {
  new_tier: string;
  new_billing_period: string;
}
