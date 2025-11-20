# Stripe Frontend Integration Plan

## 1. Overview

This document describes the step-by-step plan to integrate Stripe payments into the DMS Socrate webapp frontend, based on the updated backend routes and the `STRIPE_FRONTEND_INTEGRATION_GUIDE.md`.

---

## 2. Phases

### 2.1 Phase 1 – Installation & Base Configuration

- [ ] Install Stripe dependencies:
  - `@stripe/stripe-js`
  - `@stripe/react-stripe-js`
- [ ] Create environment variables:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_API_BASE_URL` (if needed)
- [ ] Add `.env.local` for development and `.env.production` for production with proper keys.

### 2.2 Phase 2 – Stripe Service Layer

- [ ] Create `services/stripeService.ts` with methods:
  - `getOrCreateCustomer(email, name)`
  - `createSubscription(tier, billingPeriod, paymentMethodId)`
  - `updateSubscription(newTier, newBillingPeriod)`
  - `cancelSubscription(cancelAtPeriodEnd)`
  - `purchaseAddonPacks(numPacks, paymentMethodId)`
  - `calculateProration(newTier, newBillingPeriod)`
- [ ] Make sure it uses the same `api` instance and auth headers as other services.

### 2.3 Phase 3 – Stripe Provider & Context Wiring

- [ ] Create `context/StripeContext.tsx`:
  - Load Stripe with `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)`.
  - Wrap children with `<Elements stripe={stripePromise}>`.
- [ ] Wrap the main app layout in `StripeProvider` in `app/layout.tsx` so that Stripe Elements are available everywhere.

### 2.4 Phase 4 – Payment Components

- [ ] Create `components/StripePaymentForm.tsx`:
  - Use `useStripe`, `useElements`, `CardElement`.
  - Handle creation of `paymentMethod` via `stripe.createPaymentMethod`.
  - Call `stripeService.createSubscription(...)` or appropriate method.
  - If `client_secret` is returned, call `stripe.confirmCardPayment`.
  - Expose `onSuccess` / `onError` callbacks.
- [ ] Create `components/SubscriptionPaymentModal.tsx`:
  - Display selected tier, billing period, price, and optional proration amount.
  - Embed `StripePaymentForm`.
  - Support open/close state and a cancel button.
- [ ] Create `components/AddonPackPaymentModal.tsx`:
  - Let the user select number of packs (1–10).
  - Show total price and total extra fiches.
  - Use `StripePaymentForm` or a similar flow calling `stripeService.purchaseAddonPacks`.

### 2.5 Phase 5 – Types & Models

- [ ] Create `types/stripe.ts` to mirror backend models:
  - `StripeCustomer`, `StripeSubscriptionResponse`, `UpdateSubscriptionResponse`, `CancelSubscriptionResponse`, `AddonPurchaseResponse`, `ProrationResponse`, `PaymentMethod`.
- [ ] Extend `SubscriptionStatus` in `types/subscription.ts` with Stripe-related fields:
  - `stripe_customer_id?: string | null`
  - `stripe_subscription_id?: string | null`
  - `stripe_payment_method_id?: string | null`
  - `stripe_payment_method_last4?: string | null`
  - `stripe_payment_method_brand?: string | null`

### 2.6 Phase 6 – Integrate with SubscriptionContext

- [ ] Update `SubscriptionContextType` in `context/SubscriptionContext.tsx` to include:
  - Optional flags/methods for Stripe flows, for example:
    - `initiatePayment(tier, billingPeriod)`
    - `confirmPayment(paymentMethodId)`
- [ ] Update `changeTier` logic to use Stripe when needed:
  - **Freemium → payant**:
    - Trigger payment flow (open `SubscriptionPaymentModal`).
  - **Payant → payant (upgrade/downgrade)**:
    - Call `stripeService.updateSubscription`.
    - Then refresh subscription status via `subscriptionService.getStatus`.
  - **Payant → freemium**:
    - Call `stripeService.cancelSubscription(cancel_at_period_end=true)`.
    - Use existing `/change-tier` endpoint to set `tier="freemium"` and adjust `renewal_type`.
- [ ] Ensure `buyAddonPack` uses Stripe when purchasing packs:
  - Call `stripeService.purchaseAddonPacks` and refresh status afterwards.

### 2.7 Phase 7 – UI Updates (Account & Plans Pages)

#### 2.7.1 `app/account/page.tsx`

- [ ] In the subscription section:
  - Show Stripe payment method info if available:
    - Brand, last4 digits, expiry.
  - Add a button "Mettre à jour le moyen de paiement" (future step if backend supports it).
- [ ] In the plan cards section:
  - For upgrades from Freemium to Standard/Family+:
    - Instead of appeler directement `changeTier`, ouvrir `SubscriptionPaymentModal` avec le tier choisi et la période de facturation.
  - For upgrades between paid tiers:
    - Utiliser `stripeService.calculateProration` pour afficher le coût proraté.
    - Confirmer puis appeler `stripeService.updateSubscription` via le contexte.
  - For downgrades (ex: Famille+ → Standard):
    - Conserver la logique de `pending_tier` déjà implémentée.
- [ ] Add an "Addon packs" section:
  - Afficher `addon_quota_remaining`.
  - Bouton "Acheter des fiches supplémentaires" → ouvre `AddonPackPaymentModal`.

#### 2.7.2 `app/subscription-plans/page.tsx`

- [ ] Ajouter un toggle "Mensuel / Annuel" global.
- [ ] Sur chaque carte de plan:
  - Afficher les prix mensuels et annuels.
  - Marquer l'offre annuelle comme recommandée si `discount_percent` est présent.
  - Boutons "Choisir ce plan" pour les plans payants déclenchent le flux Stripe (via contexte/modale).

### 2.8 Phase 8 – Styling

- [ ] Ajouter les styles pour les composants Stripe dans `app/globals.css`:
  - Conteneur de formulaire de paiement.
  - Modale de paiement.
  - Styles pour `CardElement` (bordure, focus, états d'erreur).
  - Badges (proration, plan recommandé, Stripe sécurisé).

### 2.9 Phase 9 – Tests avec cartes Stripe

- [ ] Tester les scénarios principaux:\
  - Freemium → Standard (mensuel et annuel).
  - Standard → Famille+ (upgrade avec proration).
  - Famille+ → Standard (downgrade différé, `pending_tier`).
  - Achat de 1 pack addon, puis de plusieurs packs.
  - Annulation de l'abonnement (cancel at period end).
  - Gestion des erreurs de paiement (carte refusée, 3D Secure).

### 2.10 Phase 10 – Production Readiness

- [ ] Vérifier que les clés live Stripe sont bien configurées dans `.env.production`.
- [ ] Vérifier et tester les webhooks Stripe côté backend (aucune logique frontend requise mais important pour bout en bout).
- [ ] Ajouter un feature flag optionnel (ex.: `NEXT_PUBLIC_STRIPE_ENABLED`) pour activer/désactiver Stripe facilement.

---

## 3. Files to Create / Modify

### 3.1 New Files

- `services/stripeService.ts`
- `types/stripe.ts`
- `context/StripeContext.tsx`
- `components/StripePaymentForm.tsx`
- `components/SubscriptionPaymentModal.tsx`
- `components/AddonPackPaymentModal.tsx`

### 3.2 Existing Files to Update

- `app/layout.tsx` – wrap app with `StripeProvider`.
- `context/SubscriptionContext.tsx` – inject Stripe flows into `changeTier`, `buyAddonPack`, etc.
- `services/subscriptionService.ts` – éventuellement ajuster pour aligner avec Stripe quand nécessaire.
- `types/subscription.ts` – champs Stripe additionnels dans `SubscriptionStatus`.
- `app/account/page.tsx` – intégration UI paiement, moyen de paiement, addons.
- `app/subscription-plans/page.tsx` – intégration UI choix de plan avec paiement Stripe.
- `app/globals.css` – styles spécifiques Stripe.

---

## 4. Checklist Global d Avancement

- [ ] Phase 1 – Dépendances & env
- [ ] Phase 2 – Service Stripe
- [ ] Phase 3 – Provider Stripe
- [ ] Phase 4 – Composants paiement
- [ ] Phase 5 – Types & modèles
- [ ] Phase 6 – Intégration SubscriptionContext
- [ ] Phase 7 – Mise à jour des pages account / subscription-plans
- [ ] Phase 8 – Styling
- [ ] Phase 9 – Tests avec cartes de test Stripe
- [ ] Phase 10 – Préparation production

Ce plan peut être coché au fur et à mesure de la migration pour suivre précisément l avancement de l intégration Stripe côté frontend.
