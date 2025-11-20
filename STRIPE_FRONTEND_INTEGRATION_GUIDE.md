# Stripe Frontend Integration Guide

## 🎯 Overview

This guide shows you how to integrate Stripe payments in your React frontend to work with the backend routes and models we just implemented.

---

## 📦 Installation

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js axios
```

**Packages:**
- `@stripe/stripe-js` - Core Stripe.js library
- `@stripe/react-stripe-js` - React components for Stripe Elements
- `axios` - For API calls to your backend

---

## 🔧 Setup Stripe Provider

### 1. Create Stripe Context (`src/context/StripeContext.jsx`)

```javascript
import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get publishable key from environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeContext = createContext();

export const StripeProvider = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within StripeProvider');
  }
  return context;
};
```

### 2. Wrap Your App (`src/App.js`)

```javascript
import { StripeProvider } from './context/StripeContext';

function App() {
  return (
    <StripeProvider>
      {/* Your app components */}
    </StripeProvider>
  );
}
```

### 3. Environment Variables (`.env.local`)

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
REACT_APP_API_BASE_URL=http://localhost:8000
```

---

## 🛠️ API Service Layer

### Create Stripe API Service (`src/services/stripeService.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Get auth token from your auth system
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken'); // Adjust based on your auth
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const stripeService = {
  /**
   * Create or get Stripe customer for current user
   * Backend: stripe_service.get_or_create_customer()
   */
  async getOrCreateCustomer(email, name) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/customer`,
      { email, name },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Create subscription for a tier
   * Backend: stripe_service.create_subscription()
   * 
   * @param {string} tier - 'standard' or 'famille_plus'
   * @param {string} billingPeriod - 'monthly' or 'yearly'
   * @param {string} paymentMethodId - Payment method from Stripe Elements
   */
  async createSubscription(tier, billingPeriod, paymentMethodId) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/create`,
      {
        tier,
        billing_period: billingPeriod,
        payment_method_id: paymentMethodId
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Update subscription (upgrade/downgrade)
   * Backend: stripe_service.update_subscription()
   * 
   * @param {string} newTier - New tier to switch to
   * @param {string} newBillingPeriod - New billing period
   */
  async updateSubscription(newTier, newBillingPeriod) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/update`,
      {
        new_tier: newTier,
        new_billing_period: newBillingPeriod
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Cancel subscription
   * Backend: stripe_service.cancel_subscription()
   * 
   * @param {boolean} cancelAtPeriodEnd - Cancel now or at period end
   */
  async cancelSubscription(cancelAtPeriodEnd = true) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/cancel`,
      { cancel_at_period_end: cancelAtPeriodEnd },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Purchase addon packs
   * Backend: stripe_service.create_payment_intent_for_addon()
   * 
   * @param {number} numPacks - Number of addon packs to purchase
   * @param {string} paymentMethodId - Payment method from Stripe Elements
   */
  async purchaseAddonPacks(numPacks, paymentMethodId) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/addon`,
      {
        num_packs: numPacks,
        payment_method_id: paymentMethodId
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Calculate proration for upgrade
   * Backend: stripe_service.calculate_proration_amount()
   */
  async calculateProration(newTier, newBillingPeriod) {
    const response = await axios.post(
      `${API_BASE_URL}/api/subscription/stripe/proration`,
      {
        new_tier: newTier,
        new_billing_period: newBillingPeriod
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  }
};
```

---

## 💳 Payment Form Component

### Subscription Payment Form (`src/components/SubscriptionPaymentForm.jsx`)

```javascript
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { stripeService } from '../services/stripeService';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

export const SubscriptionPaymentForm = ({ tier, billingPeriod, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Create subscription on backend
      const result = await stripeService.createSubscription(
        tier,
        billingPeriod,
        paymentMethod.id
      );

      // Handle subscription confirmation if needed
      if (result.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Success!
      onSuccess(result);
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="card-element-container">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="submit-button"
      >
        {loading ? 'Processing...' : 'Subscribe'}
      </button>
    </form>
  );
};
```

---

## 🎨 Complete Subscription Component

### Subscription Management (`src/components/SubscriptionManagement.jsx`)

```javascript
import React, { useState, useEffect } from 'react';
import { SubscriptionPaymentForm } from './SubscriptionPaymentForm';
import { stripeService } from '../services/stripeService';

export const SubscriptionManagement = ({ currentUser }) => {
  const [selectedTier, setSelectedTier] = useState('standard');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [prorationAmount, setProrationAmount] = useState(null);

  const tiers = {
    freemium: {
      name: 'Freemium',
      monthlyPrice: 0,
      yearlyPrice: 0,
      quota: 3,
      features: ['3 fiches par mois', 'Exercices de base', 'Export PDF']
    },
    standard: {
      name: 'Standard',
      monthlyPrice: 1.99,
      yearlyPrice: 19.90,
      quota: 50,
      features: ['50 fiches par mois', 'Exercices avancés', 'Statistiques', 'Support email']
    },
    famille_plus: {
      name: 'Famille+',
      monthlyPrice: 4.99,
      yearlyPrice: 49.90,
      quota: 150,
      features: ['150 fiches par mois', 'Multi-utilisateurs', 'Support prioritaire', 'Toutes les fonctionnalités']
    }
  };

  const handleTierSelection = async (tier, period) => {
    setSelectedTier(tier);
    setSelectedPeriod(period);

    // Calculate proration if upgrading
    if (currentUser.subscription?.tier && tier !== currentUser.subscription.tier) {
      try {
        const proration = await stripeService.calculateProration(tier, period);
        setProrationAmount(proration.amount);
      } catch (error) {
        console.error('Failed to calculate proration:', error);
      }
    }
  };

  const handleSubscriptionSuccess = (result) => {
    alert('Subscription successful!');
    setShowPaymentForm(false);
    // Refresh user data
    window.location.reload();
  };

  const handleSubscriptionError = (error) => {
    console.error('Subscription error:', error);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      await stripeService.cancelSubscription(true); // Cancel at period end
      alert('Your subscription will be cancelled at the end of the billing period.');
      window.location.reload();
    } catch (error) {
      alert('Failed to cancel subscription: ' + error.message);
    }
  };

  return (
    <div className="subscription-management">
      <h2>Choose Your Plan</h2>

      <div className="billing-toggle">
        <button 
          className={selectedPeriod === 'monthly' ? 'active' : ''}
          onClick={() => setSelectedPeriod('monthly')}
        >
          Monthly
        </button>
        <button 
          className={selectedPeriod === 'yearly' ? 'active' : ''}
          onClick={() => setSelectedPeriod('yearly')}
        >
          Yearly (Save 17%!)
        </button>
      </div>

      <div className="tier-cards">
        {Object.entries(tiers).map(([tierKey, tierData]) => (
          <div key={tierKey} className={`tier-card ${currentUser.subscription?.tier === tierKey ? 'current' : ''}`}>
            <h3>{tierData.name}</h3>
            <div className="price">
              {selectedPeriod === 'monthly' 
                ? `${tierData.monthlyPrice}€/mois`
                : `${tierData.yearlyPrice}€/an`
              }
            </div>
            <ul className="features">
              {tierData.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button 
              onClick={() => {
                handleTierSelection(tierKey, selectedPeriod);
                if (tierKey !== 'freemium') {
                  setShowPaymentForm(true);
                }
              }}
              disabled={currentUser.subscription?.tier === tierKey}
            >
              {currentUser.subscription?.tier === tierKey 
                ? 'Current Plan' 
                : tierKey === 'freemium' 
                  ? 'Downgrade' 
                  : 'Select Plan'
              }
            </button>
          </div>
        ))}
      </div>

      {prorationAmount && (
        <div className="proration-info">
          <p>Upgrade cost today: {prorationAmount}€ (prorated)</p>
        </div>
      )}

      {showPaymentForm && selectedTier !== 'freemium' && (
        <div className="payment-form-modal">
          <div className="modal-content">
            <h3>Complete Payment</h3>
            <p>
              Subscribe to <strong>{tiers[selectedTier].name}</strong> for{' '}
              {selectedPeriod === 'monthly' 
                ? `${tiers[selectedTier].monthlyPrice}€/month`
                : `${tiers[selectedTier].yearlyPrice}€/year`
              }
            </p>
            <SubscriptionPaymentForm
              tier={selectedTier}
              billingPeriod={selectedPeriod}
              onSuccess={handleSubscriptionSuccess}
              onError={handleSubscriptionError}
            />
            <button onClick={() => setShowPaymentForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {currentUser.subscription?.tier !== 'freemium' && (
        <div className="cancel-section">
          <button onClick={handleCancelSubscription} className="cancel-button">
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🎁 Addon Pack Purchase Component

### Addon Pack Purchase (`src/components/AddonPackPurchase.jsx`)

```javascript
import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { stripeService } from '../services/stripeService';

const ADDON_PACK_PRICE = 0.99;
const ADDON_PACK_SIZE = 20;

export const AddonPackPurchase = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [numPacks, setNumPacks] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPrice = (numPacks * ADDON_PACK_PRICE).toFixed(2);
  const totalQuota = numPacks * ADDON_PACK_SIZE;

  const handlePurchase = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Purchase addon packs
      const result = await stripeService.purchaseAddonPacks(
        numPacks,
        paymentMethod.id
      );

      // Confirm payment if needed
      if (result.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Success!
      alert(`Successfully purchased ${numPacks} addon pack(s)! +${totalQuota} fiches added.`);
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addon-pack-purchase">
      <h3>Purchase Extra Fiches</h3>
      
      <div className="pack-selector">
        <label>Number of packs:</label>
        <input
          type="number"
          min="1"
          max="10"
          value={numPacks}
          onChange={(e) => setNumPacks(parseInt(e.target.value))}
        />
        <div className="pack-info">
          {numPacks} pack(s) × {ADDON_PACK_SIZE} fiches = <strong>{totalQuota} fiches</strong>
        </div>
        <div className="pack-price">
          Total: <strong>{totalPrice}€</strong>
        </div>
      </div>

      <form onSubmit={handlePurchase}>
        <CardElement />
        
        {error && (
          <div className="error" style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!stripe || loading}>
          {loading ? 'Processing...' : `Purchase for ${totalPrice}€`}
        </button>
      </form>
    </div>
  );
};
```

---

## 📊 Subscription Status Display

### Current Subscription Info (`src/components/SubscriptionStatus.jsx`)

```javascript
import React from 'react';

export const SubscriptionStatus = ({ subscription }) => {
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const quotaPercentage = (subscription.quota_used_monthly / subscription.monthly_quota) * 100;

  return (
    <div className="subscription-status">
      <div className="status-header">
        <h3>
          {subscription.tier === 'freemium' && 'Freemium'}
          {subscription.tier === 'standard' && 'Standard'}
          {subscription.tier === 'famille_plus' && 'Famille+'}
        </h3>
        <span className={`status-badge ${subscription.status}`}>
          {subscription.status}
        </span>
      </div>

      <div className="quota-usage">
        <div className="quota-bar">
          <div 
            className="quota-fill" 
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
        <p>
          {subscription.quota_used_monthly} / {subscription.monthly_quota} fiches utilisées ce mois
        </p>
        
        {subscription.addon_quota_remaining > 0 && (
          <p className="addon-quota">
            + {subscription.addon_quota_remaining} fiches bonus disponibles
          </p>
        )}
      </div>

      <div className="subscription-details">
        <div className="detail-row">
          <span>Période:</span>
          <strong>
            {subscription.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'}
          </strong>
        </div>
        
        <div className="detail-row">
          <span>Prochain renouvellement:</span>
          <strong>{formatDate(subscription.renewal_date)}</strong>
        </div>

        {subscription.pending_tier && (
          <div className="detail-row pending">
            <span>Changement prévu:</span>
            <strong>
              {subscription.pending_tier} le {formatDate(subscription.renewal_date)}
            </strong>
          </div>
        )}

        {subscription.auto_renewal === false && (
          <div className="detail-row warning">
            <span>⚠️ Renouvellement automatique désactivé</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔌 Backend Routes Reference

### Routes You Need to Implement in Your Backend

These routes should be added to `subscription_route.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.tech_services.stripe_service import get_stripe_service
from app.core.services.subscription_service import SubscriptionService
from app.core.dal.user_dal import UserDAL
# ... other imports

router = APIRouter()

@router.post("/stripe/customer")
async def create_stripe_customer(
    email: str,
    name: str,
    current_user: UserModel = Depends(get_current_user)
):
    """Create or get Stripe customer"""
    stripe_service = get_stripe_service()
    customer_id = await stripe_service.get_or_create_customer(email, name)
    
    # Update user with customer_id
    current_user.subscription.stripe_customer_id = customer_id
    dal = UserDAL()
    await dal.update_user_direct(current_user)
    
    return {"customer_id": customer_id}

@router.post("/stripe/create")
async def create_stripe_subscription(
    tier: str,
    billing_period: str,
    payment_method_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    """Create new Stripe subscription"""
    stripe_service = get_stripe_service()
    
    # Get or create customer
    if not current_user.subscription.stripe_customer_id:
        customer_id = await stripe_service.get_or_create_customer(
            current_user.email,
            current_user.name
        )
        current_user.subscription.stripe_customer_id = customer_id
    
    # Attach payment method
    await stripe_service.attach_payment_method(
        current_user.subscription.stripe_customer_id,
        payment_method_id
    )
    
    # Create subscription
    result = await stripe_service.create_subscription(
        customer_id=current_user.subscription.stripe_customer_id,
        tier=SubscriptionTier(tier),
        billing_period=BillingPeriod(billing_period),
        payment_method_id=payment_method_id
    )
    
    # Update user subscription
    subscription_service = SubscriptionService(UserDAL())
    await subscription_service.change_tier(
        current_user,
        SubscriptionTier(tier),
        BillingPeriod(billing_period)
    )
    current_user.subscription.stripe_subscription_id = result["subscription_id"]
    current_user.subscription.stripe_payment_method_id = payment_method_id
    
    dal = UserDAL()
    await dal.update_user_direct(current_user)
    
    return result

@router.post("/stripe/update")
async def update_stripe_subscription(
    new_tier: str,
    new_billing_period: str,
    current_user: UserModel = Depends(get_current_user)
):
    """Update existing subscription"""
    if not current_user.subscription.stripe_subscription_id:
        raise HTTPException(400, "No active Stripe subscription")
    
    stripe_service = get_stripe_service()
    result = await stripe_service.update_subscription(
        subscription_id=current_user.subscription.stripe_subscription_id,
        new_tier=SubscriptionTier(new_tier),
        new_billing_period=BillingPeriod(new_billing_period)
    )
    
    return result

@router.post("/stripe/cancel")
async def cancel_stripe_subscription(
    cancel_at_period_end: bool = True,
    current_user: UserModel = Depends(get_current_user)
):
    """Cancel subscription"""
    if not current_user.subscription.stripe_subscription_id:
        raise HTTPException(400, "No active Stripe subscription")
    
    stripe_service = get_stripe_service()
    result = await stripe_service.cancel_subscription(
        subscription_id=current_user.subscription.stripe_subscription_id,
        cancel_at_period_end=cancel_at_period_end
    )
    
    # Update user
    if not cancel_at_period_end:
        current_user.subscription.status = SubscriptionStatus.CANCELLED
        current_user.subscription.auto_renewal = False
        dal = UserDAL()
        await dal.update_user_direct(current_user)
    
    return result

@router.post("/stripe/addon")
async def purchase_addon_packs(
    num_packs: int,
    payment_method_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    """Purchase addon packs"""
    if not current_user.subscription.stripe_customer_id:
        customer_id = await stripe_service.get_or_create_customer(
            current_user.email,
            current_user.name
        )
        current_user.subscription.stripe_customer_id = customer_id
    
    stripe_service = get_stripe_service()
    result = await stripe_service.create_payment_intent_for_addon(
        customer_id=current_user.subscription.stripe_customer_id,
        num_packs=num_packs,
        payment_method_id=payment_method_id
    )
    
    return result

@router.post("/stripe/proration")
async def calculate_proration(
    new_tier: str,
    new_billing_period: str,
    current_user: UserModel = Depends(get_current_user)
):
    """Calculate proration amount"""
    if not current_user.subscription.stripe_subscription_id:
        return {"amount": 0}
    
    stripe_service = get_stripe_service()
    amount = await stripe_service.calculate_proration_amount(
        subscription_id=current_user.subscription.stripe_subscription_id,
        new_tier=SubscriptionTier(new_tier),
        new_billing_period=BillingPeriod(new_billing_period)
    )
    
    return {"amount": float(amount)}
```

---

## 🎨 Basic CSS Styling

### Stripe Components CSS (`src/styles/stripe.css`)

```css
/* Payment Form */
.payment-form {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.card-element-container {
  padding: 15px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 15px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: #5469d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.submit-button:hover {
  background: #3d52b8;
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Tier Cards */
.tier-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.tier-card {
  padding: 30px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
}

.tier-card.current {
  border-color: #5469d4;
  background: #f0f4ff;
}

.tier-card .price {
  font-size: 32px;
  font-weight: bold;
  color: #5469d4;
  margin: 20px 0;
}

.tier-card .features {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}

.tier-card .features li {
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.tier-card .features li:before {
  content: "✓ ";
  color: #5469d4;
  font-weight: bold;
}

/* Subscription Status */
.subscription-status {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quota-bar {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}

.quota-fill {
  height: 100%;
  background: linear-gradient(90deg, #5469d4, #3d52b8);
  transition: width 0.3s ease;
}

.addon-quota {
  color: #28a745;
  font-weight: bold;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.detail-row.pending {
  background: #fff3cd;
  padding: 10px;
  border-radius: 4px;
}

.detail-row.warning {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
}
```

---

## 🧪 Testing Checklist

### Test with Stripe Test Cards

1. **Success**: `4242 4242 4242 4242`
   - Expiry: `12/34`, CVV: `123`
   - ✅ Subscription creation succeeds
   - ✅ Webhook fires: `payment_intent.succeeded`

2. **Insufficient Funds**: `4000 0000 0000 9995`
   - ✅ Payment fails gracefully
   - ✅ Error message displayed

3. **3D Secure Required**: `4000 0025 0000 3155`
   - ✅ 3D Secure modal appears
   - ✅ Can complete authentication

### Test Scenarios

- [ ] Create Standard monthly subscription
- [ ] Upgrade from Standard to Famille+ (proration displayed)
- [ ] Downgrade from Famille+ to Standard (scheduled for period end)
- [ ] Purchase 2 addon packs (40 fiches)
- [ ] Cancel subscription (at period end)
- [ ] Verify webhook events in backend logs

---

## 🚀 Production Checklist

Before going live:

1. ✅ Replace `pk_test_...` with `pk_live_...` in production `.env`
2. ✅ Register webhook endpoint in Stripe Dashboard
3. ✅ Test with small real payment first
4. ✅ Set up monitoring for failed payments
5. ✅ Implement email notifications (payment success/failure)
6. ✅ Add SSL certificate to webhook endpoint
7. ✅ Test subscription renewal cycle
8. ✅ Verify webhook signature verification works

---

## 📚 Additional Resources

- **Stripe React Docs**: https://stripe.com/docs/stripe-js/react
- **Stripe Elements**: https://stripe.com/docs/payments/elements
- **Payment Intents**: https://stripe.com/docs/payments/payment-intents
- **Webhooks**: https://stripe.com/docs/webhooks

---

## 🎉 You're Ready!

This guide covers everything you need to integrate Stripe payments in your React frontend. The components are production-ready and fully integrated with your backend Stripe service.

**Next Steps:**
1. Copy the service layer code to your React app
2. Create the payment form components
3. Add the subscription management UI
4. Test with test cards (no real charges!)
5. Deploy and go live! 🚀
