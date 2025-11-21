# Welcome Pack - Frontend Integration Guide

## Overview

New freemium users receive a **Welcome Pack** of 10 bonus fiches, valid for 48 hours from first usage.

## How It Works

### User Flow

1. **User registers** → Welcome Pack available but NOT activated
2. **User generates first fiche** → Welcome Pack auto-activates (10 bonus fiches added)
3. **Within 48 hours** → User has 13 total fiches (3 base + 10 bonus)
4. **After 48 hours** → Bonus removed automatically, back to 3 fiches
5. **One-time only** → Cannot be reactivated

## API Response

### Endpoint

```
GET /api/subscription/{user_id}/status
```

### Response Structure

The subscription status response now includes a `welcome_pack` object:

```typescript
interface SubscriptionStatus {
  tier: string;
  monthly_quota: number;        // Includes welcome pack bonus if active
  monthly_used: number;
  monthly_remaining: number;
  
  // NEW
  welcome_pack: WelcomePack | null;
}

interface WelcomePack {
  available: boolean;           // Can be activated
  activated: boolean;           // Has been used (permanent)
  active?: boolean;             // Currently providing bonus
  quota?: number;               // Bonus amount (10)
  duration_hours?: number;      // Duration (48)
  activated_at?: string;        // ISO timestamp
  expires_at?: string;          // ISO timestamp
  hours_remaining?: number;     // Time left (decimal)
  message: string;              // Display message
}
```

## Response Examples

### 1. New User - Pack Available

```json
{
  "tier": "freemium",
  "monthly_quota": 3,
  "monthly_used": 0,
  "monthly_remaining": 3,
  "welcome_pack": {
    "available": true,
    "activated": false,
    "quota": 10,
    "duration_hours": 48,
    "message": "🎁 Générez votre première fiche pour activer votre pack de bienvenue de 10 fiches bonus!"
  }
}
```

**Frontend Action:**
- Show welcome banner with call-to-action
- Display: "Generate your first worksheet to unlock 10 bonus fiches!"

---

### 2. Pack Active - Within 48h

```json
{
  "tier": "freemium",
  "monthly_quota": 13,
  "monthly_used": 2,
  "monthly_remaining": 11,
  "welcome_pack": {
    "available": false,
    "activated": true,
    "active": true,
    "quota": 10,
    "activated_at": "2025-11-21T10:00:00+00:00",
    "expires_at": "2025-11-23T10:00:00+00:00",
    "hours_remaining": 30.5,
    "message": "🎁 Pack de bienvenue actif ! 30h restantes"
  }
}
```

**Frontend Action:**
- Show success alert with countdown
- Display: "🎁 Welcome Pack active! 30h remaining • 11 fiches available"
- Show quota as: "11 / 13 fiches (3 base + 10 bonus)"

---

### 3. Pack Expired

```json
{
  "tier": "freemium",
  "monthly_quota": 3,
  "monthly_used": 5,
  "monthly_remaining": 0,
  "welcome_pack": {
    "available": false,
    "activated": true,
    "active": false,
    "activated_at": "2025-11-21T10:00:00+00:00",
    "expired_at": "2025-11-23T10:00:00+00:00",
    "message": "Pack de bienvenue expiré"
  }
}
```

**Frontend Action:**
- No special display (pack is gone)
- User sees normal freemium quota (3 fiches)

---

### 4. Paid User (Standard/Famille+)

```json
{
  "tier": "standard",
  "monthly_quota": 50,
  "monthly_used": 10,
  "monthly_remaining": 40,
  "welcome_pack": null
}
```

**Frontend Action:**
- No welcome pack UI (only for freemium)

## UI Components

### 1. Welcome Banner (Pack Available)

Show when `welcome_pack.available === true`:

```tsx
{subscriptionStatus.welcome_pack?.available && (
  <WelcomeBanner variant="info">
    <GiftIcon />
    <div>
      <h3>🎁 Pack de Bienvenue Disponible!</h3>
      <p>Générez votre première fiche pour débloquer 10 fiches bonus</p>
      <p className="text-sm text-gray-600">
        Valable 48 heures après activation
      </p>
    </div>
    <Button onClick={handleGenerateFirst}>
      Générer ma première fiche
    </Button>
  </WelcomeBanner>
)}
```

### 2. Active Pack Alert (Pack Active)

Show when `welcome_pack.active === true`:

```tsx
{subscriptionStatus.welcome_pack?.active && (
  <ActivePackAlert variant="success">
    <ClockIcon />
    <div>
      <strong>🎁 Pack de Bienvenue Actif</strong>
      <p>
        {Math.floor(subscriptionStatus.welcome_pack.hours_remaining)}h restantes
        • {subscriptionStatus.monthly_remaining} fiches disponibles
      </p>
      <ProgressBar 
        value={subscriptionStatus.welcome_pack.hours_remaining} 
        max={48} 
      />
    </div>
  </ActivePackAlert>
)}
```

### 3. Quota Display with Bonus Badge

```tsx
<QuotaCard>
  <h4>Quota Mensuel</h4>
  <div className="quota-display">
    <span className="large">
      {subscriptionStatus.monthly_remaining} / {subscriptionStatus.monthly_quota}
    </span>
    
    {subscriptionStatus.welcome_pack?.active && (
      <Badge variant="success">
        +{subscriptionStatus.welcome_pack.quota} bonus
      </Badge>
    )}
  </div>
  
  {subscriptionStatus.welcome_pack?.active && (
    <p className="text-xs text-gray-500">
      Inclut {subscriptionStatus.welcome_pack.quota} fiches bonus
      (expire dans {Math.floor(subscriptionStatus.welcome_pack.hours_remaining)}h)
    </p>
  )}
</QuotaCard>
```

## Display Logic

### Determining Quota Breakdown

```typescript
const getQuotaBreakdown = (status: SubscriptionStatus) => {
  const baseQuota = status.tier === 'freemium' ? 3 : status.monthly_quota;
  const bonusQuota = status.welcome_pack?.active 
    ? status.welcome_pack.quota 
    : 0;
  
  return {
    total: status.monthly_quota,
    base: baseQuota,
    bonus: bonusQuota,
    used: status.monthly_used,
    remaining: status.monthly_remaining
  };
};

// Usage
const quota = getQuotaBreakdown(subscriptionStatus);
// quota.total = 13 (when active)
// quota.base = 3
// quota.bonus = 10
```

### Countdown Timer

```typescript
const formatTimeRemaining = (hours: number) => {
  if (hours < 1) {
    return `${Math.floor(hours * 60)} minutes`;
  } else if (hours < 24) {
    return `${Math.floor(hours)} heures`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days}j ${remainingHours}h`;
  }
};

// Usage
{subscriptionStatus.welcome_pack?.active && (
  <span>
    Expire dans {formatTimeRemaining(subscriptionStatus.welcome_pack.hours_remaining)}
  </span>
)}
```

## User Messages

### Notification Messages

```typescript
const WELCOME_PACK_MESSAGES = {
  available: {
    title: "🎁 Pack de Bienvenue Disponible",
    message: "Générez votre première fiche pour débloquer 10 fiches bonus valables 48h!",
    action: "Commencer"
  },
  
  activated: {
    title: "🎉 Pack de Bienvenue Activé!",
    message: "Vous avez maintenant 13 fiches disponibles pour les 48 prochaines heures.",
    action: "Parfait"
  },
  
  expiring_soon: { // when < 6 hours remaining
    title: "⏰ Pack de Bienvenue Expire Bientôt",
    message: "Il vous reste moins de 6h pour utiliser vos fiches bonus!",
    action: "Générer une fiche"
  },
  
  expired: {
    title: "Pack de Bienvenue Expiré",
    message: "Votre pack bonus a expiré. Passez à Standard pour 50 fiches/mois!",
    action: "Voir les offres"
  }
};
```

### Toast Notifications

```typescript
// When pack activates
if (prevStatus.welcome_pack?.available && !currentStatus.welcome_pack?.available) {
  toast.success("🎁 Pack de Bienvenue activé! +10 fiches pour 48h");
}

// When pack expires
if (prevStatus.welcome_pack?.active && !currentStatus.welcome_pack?.active) {
  toast.info("⏰ Votre pack de bienvenue a expiré", {
    action: {
      label: "Upgrade",
      onClick: () => navigate('/subscription')
    }
  });
}

// Expiring soon warning (< 6h)
if (currentStatus.welcome_pack?.hours_remaining < 6) {
  toast.warning("⏰ Plus que 6h pour utiliser vos fiches bonus!");
}
```

## Handling Edge Cases

### 1. Pack is Null (Paid Users)

```typescript
// Always check if welcome_pack exists
if (!subscriptionStatus.welcome_pack) {
  // Don't show any welcome pack UI
  return null;
}
```

### 2. Real-time Updates

```typescript
// Poll for status updates when pack is active
useEffect(() => {
  if (subscriptionStatus.welcome_pack?.active) {
    const interval = setInterval(() => {
      fetchSubscriptionStatus(); // Refresh every 5 minutes
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }
}, [subscriptionStatus.welcome_pack?.active]);
```

### 3. Optimistic Updates

```typescript
// When user generates first fiche, optimistically show activation
const handleGenerateFirstFiche = async () => {
  // Show optimistic UI
  setShowActivationAnimation(true);
  
  try {
    await generateFiche();
    
    // Refresh status (will show activated pack)
    await fetchSubscriptionStatus();
    
  } catch (error) {
    // Revert optimistic UI
    setShowActivationAnimation(false);
  }
};
```

## Testing Checklist

- [ ] New user sees welcome pack banner
- [ ] Banner disappears after first generation
- [ ] Quota increases from 3 to 13 after activation
- [ ] Active pack shows countdown timer
- [ ] Timer updates in real-time
- [ ] Pack expires after 48h (quota back to 3)
- [ ] Expired pack message shows briefly
- [ ] No welcome pack shown for paid users
- [ ] Existing freemium users see available pack
- [ ] Pack cannot be reactivated after expiration

## API Testing

### Test Scenarios

```bash
# 1. New freemium user
GET /api/subscription/{user_id}/status
# Should return: welcome_pack.available = true

# 2. After first generation
POST /api/education/generate
GET /api/subscription/{user_id}/status
# Should return: welcome_pack.active = true, monthly_quota = 13

# 3. Simulate expiration (backend sets expires_at to past)
GET /api/subscription/{user_id}/status
# Should return: welcome_pack.active = false, monthly_quota = 3
```

## Summary

### Key Points

✅ **Automatic Activation:** No manual action needed, activates on first fiche generation
✅ **Included in Quota:** `monthly_quota` already includes bonus when active
✅ **Auto-Expiration:** Backend handles removal after 48h
✅ **One-time Only:** Cannot be reactivated once used
✅ **Freemium Only:** Only applicable to freemium tier

### Backend Guarantees

- Welcome pack auto-activates on first generation
- Bonus is added to `monthly_quota` (frontend doesn't need to calculate)
- Expiration is checked on every status request
- All timestamps are in ISO 8601 format (UTC)
- `hours_remaining` is always accurate (calculated server-side)

### Frontend Responsibilities

- Display welcome pack status from API response
- Show appropriate UI based on `welcome_pack` state
- Handle countdown display
- Show upgrade prompts when pack expires
- No quota calculations needed (use `monthly_quota` directly)

---

**Questions?** Contact backend team or see full implementation plan in `docs/NEW_USER_WELCOME_PACK_PLAN.md`
