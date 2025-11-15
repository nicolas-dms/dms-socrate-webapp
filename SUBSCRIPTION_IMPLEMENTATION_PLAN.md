# Subscription Frontend Implementation Plan

This document describes how to migrate the frontend subscription logic from the current mock implementation to the new backend-powered subscription system described in `SUBSCRIPTION_FRONTEND_GUIDE.md`.

The plan is structured to be **incremental** and **backwards compatible** where possible, so you can ship it in several small PRs.

---

## 1. Target contract: align frontend types with backend

Create TypeScript types that mirror the backend subscription schemas. You can place them either in `types/subscription.ts` (recommended) or in `api-schema/api-types.ts` if you want to keep everything in one place.

### 1.1. Core enums and types

**Subscription tier**

```ts
export type SubscriptionTier = "freemium" | "standard" | "famille_plus";
```

**Billing period**

```ts
export type BillingPeriod = "monthly" | "yearly";
```

### 1.2. Plan and status structures

**Public plan info** (returned by `/api/subscription/plans`):

```ts
export interface PlanPublicInfo {
  id: string; // e.g. "freemium_monthly", "standard_monthly", "standard_yearly", etc.
  tier: SubscriptionTier;
  billing_period: BillingPeriod;
  label: string; // e.g. "Standard", "Famille+"
  price_eur: number;
  monthly_quota: number;
  daily_quota?: number | null; // freemium only
  is_default_for_tier: boolean;
}
```

**Subscription status** (returned by `/api/subscription/status`):

```ts
export type RenewalType = "calendar" | "anniversary";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  billing_period: BillingPeriod;
  monthly_quota: number;
  daily_quota?: number | null;
  monthly_used: number;
  daily_used?: number | null;
  addon_quota_remaining: number;
  renews_at: string; // ISO date string
  is_active: boolean;
  renewal_type: RenewalType;
}
```

**Frontend usage view** (derived from `SubscriptionStatus`):

```ts
export interface SubscriptionUsageView {
  monthly_limit: number;
  monthly_used: number;
  daily_limit?: number | null;
  daily_used?: number | null;
  addon_remaining: number;
  can_generate: boolean;
  total_remaining_for_today: number;
  percentage_used_monthly: number;
}
```

**Checkout / mutation responses** (for `/initialize`, `/change-tier`, `/change-billing-period`, `/addon-pack`):

```ts
export interface CheckoutResponse {
  checkout_url: string;
}
```

**History entries** (from `/api/subscription/history`):

```ts
export type HistoryItemType =
  | "renewal"
  | "change_tier"
  | "change_billing_period"
  | "addon_purchase"
  | "usage";

export interface HistoryItem {
  id: string;
  date: string; // ISO date
  type: HistoryItemType;
  description: string;
  amount_eur: number;
  details?: Record<string, unknown>;
}
```

> **Step to implement**
>
> - [ ] Create `types/subscription.ts` and add the types above.
> - [ ] Export them where needed (e.g. from a central `types/index.ts` if you have one).

---

## 2. Refactor `subscriptionService` to call the backend

File: `services/subscriptionService.ts`

Currently this file contains:

- A mock list of `SUBSCRIPTION_PLANS` (starter / standard / premium)
- Local `UserSubscription` and `SubscriptionUsage` interfaces
- Methods like `getCurrentSubscription`, `getSubscriptionUsage`, `upgradePlan`, `downgradePlan`, `cancelSubscription`, `reactivateSubscription`, `createCheckoutSession`, `canGenerateMoreFiches`, `getRemainingFiches`

The goal is to:

1. Replace mocks with real HTTP calls to the backend
2. Align with the endpoints described in `SUBSCRIPTION_FRONTEND_GUIDE.md`
3. Compute quota-related helpers from `SubscriptionStatus`

### 2.1. Use the existing API client

Reuse your existing HTTP utilities in `services/apiClient.ts` / `services/api.ts`.

- Base path for all endpoints: `/api/subscription` (Next.js route that proxies to FastAPI)
- Authentication: follow whatever pattern `authService` already uses (e.g. adding auth headers or cookies).

### 2.2. Service methods mapping

Replace the current mock functions with something along these lines (pseudo-code):

```ts
import apiClient from "./apiClient";
import {
  PlanPublicInfo,
  SubscriptionStatus,
  CheckoutResponse,
  HistoryItem,
  SubscriptionTier,
  BillingPeriod,
} from "../types/subscription";

export const subscriptionService = {
  async getPlans(): Promise<PlanPublicInfo[]> {
    const response = await apiClient.get<PlanPublicInfo[]>("/api/subscription/plans");
    return response.data;
  },

  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get<SubscriptionStatus>("/api/subscription/status");
    return response.data;
  },

  async initializeFreemium(): Promise<SubscriptionStatus> {
    const response = await apiClient.post<SubscriptionStatus>("/api/subscription/initialize", {
      tier: "freemium",
    });
    return response.data;
  },

  async startCheckoutForPlan(planId: string): Promise<CheckoutResponse> {
    const response = await apiClient.post<CheckoutResponse>("/api/subscription/initialize", {
      plan_id: planId,
    });
    return response.data;
  },

  async changeTier(targetTier: SubscriptionTier, billingPeriod: BillingPeriod): Promise<CheckoutResponse | null> {
    const response = await apiClient.post<CheckoutResponse | null>("/api/subscription/change-tier", {
      tier: targetTier,
      billing_period: billingPeriod,
    });
    return response.data;
  },

  async changeBillingPeriod(targetBillingPeriod: BillingPeriod): Promise<CheckoutResponse | null> {
    const response = await apiClient.post<CheckoutResponse | null>("/api/subscription/change-billing-period", {
      billing_period: targetBillingPeriod,
    });
    return response.data;
  },

  async buyAddonPack(): Promise<CheckoutResponse | null> {
    const response = await apiClient.post<CheckoutResponse | null>("/api/subscription/addon-pack", {});
    return response.data;
  },

  async getHistory(): Promise<HistoryItem[]> {
    const response = await apiClient.get<HistoryItem[]>("/api/subscription/history");
    return response.data;
  },

  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get("/api/subscription/health");
      return true;
    } catch {
      return false;
    }
  },
};
```

Adjust the request payloads and response shapes to the exact backend contract in `SUBSCRIPTION_FRONTEND_GUIDE.md`.

### 2.3. Quota helpers (frontend-side)

The backend is the source of truth for **usage**. The frontend should only compute *derived* helpers from `SubscriptionStatus`, not mutate usage counters.

Add utility functions (either in `subscriptionService` or a separate helper file):

```ts
export function computeRemainingForToday(status: SubscriptionStatus): {
  addonRemaining: number;
  monthlyRemaining: number;
  dailyRemaining: number;
  totalRemainingForToday: number;
} {
  const addonRemaining = status.addon_quota_remaining;
  const monthlyRemaining = Math.max(0, status.monthly_quota - status.monthly_used);
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

export function canGenerateMoreFromStatus(status: SubscriptionStatus): boolean {
  if (!status.is_active) return false;

  const { totalRemainingForToday } = computeRemainingForToday(status);
  return totalRemainingForToday > 0;
}

export function toUsageView(status: SubscriptionStatus): SubscriptionUsageView {
  const { addonRemaining, monthlyRemaining, dailyRemaining, totalRemainingForToday } =
    computeRemainingForToday(status);

  const percentageUsedMonthly = status.monthly_quota
    ? Math.min(100, Math.round((status.monthly_used / status.monthly_quota) * 100))
    : 0;

  return {
    monthly_limit: status.monthly_quota,
    monthly_used: status.monthly_used,
    daily_limit: status.daily_quota ?? null,
    daily_used: status.daily_used ?? null,
    addon_remaining: addonRemaining,
    can_generate: status.is_active && totalRemainingForToday > 0,
    total_remaining_for_today: totalRemainingForToday,
    percentage_used_monthly,
  };
}
```

> **Steps to implement**
>
> - [ ] Replace old mock methods in `subscriptionService` with calls to the real backend endpoints.
> - [ ] Add quota helper functions that work from `SubscriptionStatus`.
> - [ ] Remove any local increment/decrement of usage in the service.

---

## 3. Adapt `SubscriptionContext` to new model

File: `context/SubscriptionContext.tsx`

Currently it:

- Stores `subscription: UserSubscription | null` and `usage: SubscriptionUsage | null`.
- Exposes `plans` based on static `SUBSCRIPTION_PLANS`.
- Provides methods for `upgradePlan`, `downgradePlan`, `cancelSubscription`, `reactivateSubscription`, `createCheckoutSession`, etc.
- Locally increments usage in `useCredit`.

### 3.1. New state shape

Refactor the context to center everything around `SubscriptionStatus` and `PlanPublicInfo` from the backend.

Suggested interface:

```ts
interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  usageView: SubscriptionUsageView | null;
  plans: PlanPublicInfo[];
  history: HistoryItem[] | null;
  loading: boolean;

  refreshStatus: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshHistory: () => Promise<void>;

  initializeFreemium: () => Promise<{ success: boolean; message: string }>;
  startCheckout: (planId: string) => Promise<{ success: boolean; message: string }>; // redirects handled by caller
  changeTier: (planId: string) => Promise<{ success: boolean; message: string }>;
  changeBillingPeriod: (planId: string) => Promise<{ success: boolean; message: string }>;
  buyAddonPack: () => Promise<{ success: boolean; message: string }>;

  canGenerateMore: () => boolean;
  getRemainingForToday: () => number;
}
```

You can keep the external API similar to the existing one if needed, but internally the logic should be based on `SubscriptionStatus` and the helper functions from section 2.3.

### 3.2. Loading lifecycle

In the `useEffect` that reacts to `isAuthenticated`/`user`:

```ts
useEffect(() => {
  if (isAuthenticated && user) {
    (async () => {
      setLoading(true);
      try {
        const [status, plans] = await Promise.all([
          subscriptionService.getStatus(),
          subscriptionService.getPlans(),
        ]);

        setStatus(status);
        setUsageView(toUsageView(status));
        setPlans(plans);
      } catch (error) {
        console.error("Failed to load subscription data", error);
        setStatus(null);
        setUsageView(null);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    })();
  } else {
    setStatus(null);
    setUsageView(null);
    setPlans([]);
  }
}, [isAuthenticated, user]);
```

### 3.3. Action methods

For example, `initializeFreemium`:

```ts
const initializeFreemium = async (): Promise<{ success: boolean; message: string }> => {
  if (!user?.user_id) {
    return { success: false, message: "Utilisateur non authentifié" };
  }

  try {
    setLoading(true);
    const newStatus = await subscriptionService.initializeFreemium();
    setStatus(newStatus);
    setUsageView(toUsageView(newStatus));
    return { success: true, message: "Offre Freemium activée" };
  } catch (error) {
    console.error("Failed to initialize freemium", error);
    return { success: false, message: "Erreur lors de l'activation de l'offre Freemium" };
  } finally {
    setLoading(false);
  }
};
```

For starting a checkout session:

```ts
const startCheckout = async (planId: string): Promise<{ success: boolean; message: string }> => {
  if (!user?.user_id) {
    return { success: false, message: "Utilisateur non authentifié" };
  }

  try {
    setLoading(true);
    const { checkout_url } = await subscriptionService.startCheckoutForPlan(planId);
    if (checkout_url) {
      window.location.href = checkout_url;
      return { success: true, message: "Redirection vers la page de paiement" };
    }
    return { success: false, message: "Aucune URL de paiement retournée" };
  } catch (error) {
    console.error("Failed to start checkout", error);
    return { success: false, message: "Erreur lors de la création de la session de paiement" };
  } finally {
    setLoading(false);
  }
};
```

`changeTier`, `changeBillingPeriod`, and `buyAddonPack` follow the same pattern: call the service, redirect if a `checkout_url` is returned, then refresh status on return.

### 3.4. Quota helpers

`canGenerateMore` and `getRemainingForToday` should use `usageView`:

```ts
const canGenerateMore = () => {
  if (!status) return false;
  return canGenerateMoreFromStatus(status);
};

const getRemainingForToday = () => {
  if (!status) return 0;
  return computeRemainingForToday(status).totalRemainingForToday;
};
```

> **Steps to implement**
>
> - [ ] Replace `subscription`/`usage` state with `status` + `usageView`.
> - [ ] Wire all action methods to new `subscriptionService` calls.
> - [ ] Remove local `useCredit` counter updates; rely on backend + `refreshStatus` after generation.

---

## 4. Update subscription-related UI

This step depends on where subscription is currently surfaced in the UI. Typical places in this project include:

- `app/account/page.tsx`
- `app/buy-credits/page.tsx`
- `app/subscription-plans/page.tsx` (if it exists)
- Generator pages under `app/generate/...` that need to enforce quotas

### 4.1. Account / profile page

On the account page:

- Use `useSubscription()` to access `status`, `usageView`, `plans`, `history`.
- Display:
  - Current tier (Freemium / Standard / Famille+)
  - Billing period (mensuel / annuel)
  - Renewal date (`renews_at`)
  - Monthly usage: `usageView.monthly_used / usageView.monthly_limit`
  - Daily usage if applicable: `usageView.daily_used / usageView.daily_limit`
  - Add-on remaining: `usageView.addon_remaining`
  - Progress bar using `usageView.percentage_used_monthly`
- Show primary actions:
  - If no subscription: button to “Activer l'offre Freemium” → `initializeFreemium()`
  - If Freemium: buttons to choose a paid plan (`startCheckout(plan.id)`) from `plans`
  - If paid: buttons to change tier / period and to buy add-on pack
- Optionally display history from `history` (latest 10 operations) with amount, type, date.

### 4.2. Pricing / plans page

On the subscription plans / pricing page:

- Use `plans` from `useSubscription()`.
- Group plans by `tier` and `billing_period`.
- For each plan, display:
  - Label (Standard, Famille+)
  - Price per month / per year
  - Quotas: e.g. “50 fiches / mois, sans limite journalière” or “3 fiches / mois, 1 fiche / jour”
- Button behavior:
  - If user not authenticated: redirect to login.
  - If `plan.tier === "freemium"`: call `initializeFreemium()`.
  - Else: call `startCheckout(plan.id)`.

### 4.3. Generator pages: enforce quotas and upsell

In generator pages like `app/generate/french/page.tsx` or `app/generate/math/page.tsx`:

- Use `const { canGenerateMore, getRemainingForToday } = useSubscription();`.
- Before triggering the generation call:
  - If `!canGenerateMore()`, block the action and show a modal or toast:
    - “Tu as atteint ta limite de fiches pour aujourd'hui / ce mois-ci.”
    - Offer options: “Voir les offres” (navigate to plans), “Acheter un pack de 20 fiches” → `buyAddonPack()`.
- After a successful generation:
  - Call `refreshStatus()` to update quotas.

> **Steps to implement**
>
> - [ ] Update account page to use new `SubscriptionContext` API.
> - [ ] Update pricing/plans page to read `plans` from backend.
> - [ ] Update generator pages to block when `canGenerateMore()` is false and to refresh status after generation.

---

## 5. Error handling and edge cases

The backend guide describes various error cases (400/404/429/5xx). Handle them consistently.

### 5.1. In `subscriptionService`

- Wrap all HTTP calls in `try/catch` blocks in the context, not necessarily inside the service.
- For errors where the backend returns a structured error body, map messages to user-friendly French strings.
- Special cases:
  - `404` on `/status` → treat as “no subscription yet” and show Freemium onboarding.
  - `429` from generation or `/status` → treat as “quota exceeded”.

### 5.2. In the context and UI

- Use `NotificationContext` or `ContextualFeedbackToast` to show error messages for:
  - Failed subscription load
  - Failed checkout initialization
  - Failed freemium activation
  - Failed addon purchase
- Keep failures non-blocking where possible (e.g. user can retry).

> **Steps to implement**
>
> - [ ] Add basic error mapping in `subscriptionService` and/or `SubscriptionContext`.
> - [ ] Ensure user-facing messages are clear and in French.

---

## 6. Migration strategy

To avoid a big-bang change, follow these phases.

### Phase 1 – Types & service

- Implement `types/subscription.ts`.
- Implement backend-backed `subscriptionService` methods.
- For a short transition period, you can:
  - Keep `SUBSCRIPTION_PLANS` as a fallback if `/plans` fails.
  - Keep `getCurrentSubscription` as an adapter that calls `/status` and maps the result to the old `UserSubscription` shape, so existing UI continues to work.

### Phase 2 – Context refactor

- Update `SubscriptionContext` to rely on `getStatus()` and `getPlans()`.
- Replace `subscription`/`usage` with `status`/`usageView`.
- Keep old fields as derived values only if some components still need them temporarily.

### Phase 3 – UI updates

- Update account page, pricing page, and generator pages to use the new context API.
- Add quota banners and upsell flows.

### Phase 4 – Cleanup

- Remove mock types and constants (`UserSubscription`, `SubscriptionUsage`, `SUBSCRIPTION_PLANS`).
- Remove any unused functions from `subscriptionService`.
- Simplify `SubscriptionContext` interface if there are temporary adapters.

---

## 7. Verification checklist

Before shipping, verify at least the following scenarios:

1. **First-time user**
   - Logs in without any subscription.
   - Account page shows Freemium onboarding.
   - Clicks “Activer l'offre Freemium” → status updates to tier `freemium`, correct quotas.

2. **Freemium to Standard**
   - User on Freemium visits plans page.
   - Chooses Standard monthly → redirected to checkout, returns to app.
   - `/status` reflects tier `standard`, `billing_period` `monthly`, monthly quota 50.

3. **Standard to Famille+ (annual)**
   - User changes plan from Standard to Famille+ annual.
   - Correct plan & billing period are shown after redirect.

4. **Quota enforcement**
   - User generates fiches until daily/monthly limit is hit.
   - Generator pages block further generations and show upsell.

5. **Addon purchase**
   - User buys an addon pack.
   - `addon_quota_remaining` increases by 20.
   - New generations consume addon quota first.

6. **History**
   - History page/section shows initialization, plan changes, and addon purchases with correct dates and amounts.

7. **Backend failure**
   - If the backend is down, UI shows a clear message and doesn’t crash.

If possible, add automated tests for:

- `computeRemainingForToday`
- `canGenerateMoreFromStatus`
- `toUsageView`

These are pure functions and easy to unit test.

---

This plan should give you a clear, step-by-step path from the current mock subscription system to a backend-driven implementation, while minimizing disruption to the existing UI and flows.
