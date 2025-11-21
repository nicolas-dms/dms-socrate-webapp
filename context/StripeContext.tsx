"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import api from '../services/api';

// Fetch Stripe publishable key from backend
const getStripePublishableKey = async (): Promise<string> => {
  try {
    console.log('🔑 [Stripe Config] Fetching publishable key from backend...');
    console.log('🔑 [Stripe Config] Request URL:', '/api/subscription/stripe/config');
    
    const response = await api.get<{ publishable_key?: string; publishableKey?: string }>('/api/subscription/stripe/config');
    
    console.log('🔑 [Stripe Config] Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    
    // Backend returns camelCase (publishableKey), try both formats
    const key = response.data.publishableKey || response.data.publishable_key;
    
    console.log('🔑 [Stripe Config] Extracted key:', key ? `${key.substring(0, 20)}...${key.substring(key.length - 4)}` : 'NULL/EMPTY');
    
    if (!key || key.trim() === '') {
      console.error('❌ [Stripe Config] Empty publishable key received from backend');
      throw new Error('Empty publishable key received from backend');
    }
    
    console.log('✅ [Stripe Config] Successfully retrieved valid key from backend');
    return key;
  } catch (error: any) {
    console.error('❌ [Stripe Config] Failed to fetch from backend:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      stack: error.stack
    });
    
    console.log('🔄 [Stripe Config] Falling back to environment variable...');
    const fallbackKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    
    console.log('🔑 [Stripe Config] Fallback key:', fallbackKey ? `${fallbackKey.substring(0, 20)}...${fallbackKey.substring(fallbackKey.length - 4)}` : 'NULL/EMPTY');
    
    if (!fallbackKey || fallbackKey.trim() === '') {
      console.error('❌ [Stripe Config] No valid Stripe publishable key available from backend or env');
      return '';
    }
    
    console.log('✅ [Stripe Config] Using fallback key from environment');
    return fallbackKey;
  }
};

// Load Stripe with publishable key from backend
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = getStripePublishableKey().then(key => {
      if (!key || key.trim() === '') {
        console.error('Cannot initialize Stripe: No publishable key available');
        return null;
      }
      return loadStripe(key);
    });
  }
  return stripePromise;
};

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
 * The publishable key is fetched from the backend API endpoint:
 * GET /api/subscription/stripe/config
 * 
 * Usage:
 * <StripeProvider>
 *   <YourApp />
 * </StripeProvider>
 */
export const StripeProvider = ({ children }: StripeProviderProps) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeInstance = await getStripe();
        if (!stripeInstance) {
          setError('Stripe n\'est pas configuré. Veuillez contacter le support.');
          console.error('Stripe initialization returned null - check your publishable key configuration');
        }
        setStripe(stripeInstance);
      } catch (error: any) {
        console.error('Failed to initialize Stripe:', error);
        setError('Impossible de charger le système de paiement.');
        setStripe(null);
      } finally {
        setLoading(false);
      }
    };
    
    initStripe();
  }, []);

  if (loading) {
    return <>{children}</>;
  }

  // Show error message in console but still render children
  // Payment forms will show appropriate error when stripe is null
  if (error) {
    console.warn('Stripe Provider Error:', error);
  }

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  );
};
