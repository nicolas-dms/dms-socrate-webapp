"use client";

import React, { ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Load Stripe with publishable key from environment
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// Stripe Elements appearance configuration
const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0070f3',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
};

// Elements options
const options = {
  appearance,
  locale: 'fr' as const,
};

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * StripeProvider - Wraps the application with Stripe Elements context
 * 
 * This provider must wrap any components that use Stripe payment forms
 * or Elements components (like CardElement, PaymentElement, etc.)
 * 
 * Usage:
 * <StripeProvider>
 *   <YourApp />
 * </StripeProvider>
 */
export const StripeProvider = ({ children }: StripeProviderProps) => {
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
