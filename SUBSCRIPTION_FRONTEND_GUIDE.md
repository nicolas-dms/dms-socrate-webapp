# Guide Front-End – Logique de Souscription Utilisateur

## 1. Objectif et Contexte

Ce document décrit **comment le front-end doit utiliser les API de souscription** exposées par le backend pour:

- Afficher les plans et prix d’abonnement.
- Afficher l’état d’abonnement et les quotas (mensuels, journaliers, add-on).
- Initialiser un abonnement Freemium.
- Gérer les upgrades/downgrades et le changement de période de facturation (monthly/yearly).
- Acheter des packs add-on.
- Afficher l’historique des transactions de quota.
- Réagir correctement lorsque les quotas sont dépassés lors de la génération d’exercices.

Le backend est en FastAPI. Le front est libre (React, Vue, etc.).  
Le document est pensé pour un **LLM**: toutes les structures nécessaires (payloads, réponses, flows métier) sont explicitement décrites.

**Convention de base**

- `user_id` côté API = email de l’utilisateur (ex: `"john.doe@example.com"`).
- Les routes de souscription sont montées sous un préfixe type: `/api/subscription/...`.

---

## 2. Vision Fonctionnelle Côté Front

### 2.1 Types de plans

- `freemium`
- `standard`
- `famille_plus`

### 2.2 Périodes de facturation

- `monthly` (mensuel)
- `yearly` (annuel; uniquement pour Standard et Famille+)

### 2.3 Quotas

- `monthly_quota`: nombre de fiches par mois.
- `daily_quota` (optionnel, Freemium uniquement).
- `addon_quota_remaining`: nombre de fiches issues de packs additionnels (consommées avant le quota mensuel).
- Renouvellement:
  - Freemium: `renewal_type = "calendar"`, reset le **1er de chaque mois**.
  - Standard/Famille+: `renewal_type = "anniversary"`, reset à la **date anniversaire**.
- Pour les abonnements `yearly`:
  - La facturation est annuelle.
  - Les quotas restent **mensuels** (reset chaque mois).

---

## 3. Routes d’API de Souscription

### 3.1 Liste des plans disponibles

**Endpoint**

- `GET /api/subscription/plans`

**But**

- Construire la page de **pricing** et les écrans de changement de plan.
- Afficher les plans Freemium, Standard, Famille+ avec:
  - Quotas.
  - Features.
  - Prix mensuel et annuel.
  - Économies en passant au yearly.

**Réponse – structure**

```jsonc
{
  "plans": [
    {
      "tier": "freemium",
      "display_name": "Freemium",
      "description": "Découvrez l'application avec 3 fiches par mois",
      "monthly_quota": 3,
      "daily_quota": 1,
      "features": ["basic_exercises", "pdf_download"],
      "pricing": {
        "monthly": {
          "price": 0,
          "currency": "EUR",
          "period": "month",
          "display": "0€/mois"
        },
        "yearly": {
          "price": 0,
          "currency": "EUR",
          "period": "year",
          "price_per_month": 0,
          "display": "0€/an",
          "discount_percent": 0,
          "savings": 0,
          "recommended": false
        }
      }
    },
    {
      "tier": "standard",
      "display_name": "Standard",
      "description": "Idéal pour un usage régulier avec 50 fiches par mois",
      "monthly_quota": 50,
      "daily_quota": null,
      "features": [
        "basic_exercises",
        "pdf_download",
        "advanced_exercises",
        "statistics"
      ],
      "pricing": {
        "monthly": {
          "price": 1.99,
          "currency": "EUR",
          "period": "month",
          "display": "1.99€/mois"
        },
        "yearly": {
          "price": 19.9,
          "currency": "EUR",
          "period": "year",
          "price_per_month": 1.66,
          "display": "19.9€/an",
          "discount_percent": 17,
          "savings": 3.98,
          "recommended": true
        }
      }
    }
    // ... idem pour "famille_plus"
  ],
  "addon_pack": {
    "pack_size": 20,
    "price": 0.99,
    "display_name": "Pack 20 fiches",
    "description": "20 fiches supplémentaires consommées en priorité"
  }
}
```

**Logique front à implémenter**

- Charger ce endpoint lors de:
  - L’affichage de la page “Choisir un plan”.
  - L’affichage de la page “Mon abonnement” (pour labels, prix, etc.).
- Utiliser `discount_percent`, `savings` et `recommended` pour:
  - Afficher un badge “Meilleure offre” sur l’option yearly des plans payants.
- Afficher un encart séparé “Pack 20 fiches” utilisant `addon_pack`.

---

### 3.2 Statut de souscription utilisateur

**Endpoint**

- `GET /api/subscription/{user_id}/status`

**But**

- Savoir en temps réel:
  - Le plan actuel.
  - La période de facturation.
  - Les quotas (monthly/daily/add-on).
  - Les features disponibles.
  - Les dates importantes (début, renouvellement).

**Réponse – structure (`SubscriptionStatusResponse`)**

```jsonc
{
  "tier": "standard",            // "freemium" | "standard" | "famille_plus"
  "status": "active",            // "active" | "expired" | "cancelled" | "pending"
  "billing_period": "monthly",   // "monthly" | "yearly"
  "renewal_type": "anniversary", // "calendar" | "anniversary"
  "monthly_quota": 50,
  "monthly_used": 12,
  "monthly_remaining": 38,
  "daily_quota": null,
  "daily_used": null,
  "daily_remaining": null,
  "addon_quota_remaining": 40,
  "addon_packs_purchased": 2,
  "renewal_date": "2025-03-15T00:00:00+00:00",
  "start_date": "2025-01-15T10:00:00+00:00",
  "features": [
    "basic_exercises",
    "pdf_download",
    "advanced_exercises",
    "statistics"
  ],
  "auto_renewal": true
}
```

**Erreur**

- `404` → l’utilisateur n’a pas (encore) de subscription initialisée.

**Logique front à implémenter**

- Au login / chargement du dashboard:
  1. Appeler `GET /status`.
  2. Si `200`:
     - Mettre à jour un store global `subscriptionStatus`.
     - Afficher:
       - “Plan actuel: Standard (mensuel)” ou “Famille+ (annuel)”.
       - “Renouvellement le JJ/MM/AAAA”.
       - “Fiches restantes ce mois-ci: monthly_remaining”.
       - “Fiches add-on restantes: addon_quota_remaining”.
  3. Si `404`:
     - Appeler `/initialize` (cf. §3.3).
     - Puis re-appeler `/status`.

---

### 3.3 Initialiser un abonnement Freemium

**Endpoint**

- `POST /api/subscription/{user_id}/initialize`

**But**

- Créer un abonnement Freemium pour un utilisateur qui n’en a pas encore (ou réparer un cas incohérent).

**Réponse – structure**

```jsonc
{
  "success": true,
  "message": "Freemium subscription initialized",
  "subscription": {
    "tier": "freemium",
    "status": "active",
    "monthly_quota": 3,
    "daily_quota": 1,
    "renewal_date": "2025-12-01T00:00:00+00:00"
  }
}
```

**Erreurs**

- `400` si subscription déjà existante / autre problème.

**Logique front à implémenter**

- Flow “premier login”:
  - Si `GET /status` renvoie 404 → appeler `POST /initialize`.
  - Si `initialize` renvoie `success = true` → recharger `/status`.
- Afficher un message “Plan Freemium initialisé (3 fiches/mois, 1 par jour).”.

---

### 3.4 Changer de tier (upgrade / downgrade)

**Endpoint**

- `POST /api/subscription/{user_id}/change-tier`

**Payload (`ChangeSubscriptionTierRequest`)**

```jsonc
{
  "new_tier": "standard",        // "freemium" | "standard" | "famille_plus"
  "new_billing_period": "yearly" // optionnel: "monthly" | "yearly"
}
```

**Réponse – structure**

```jsonc
{
  "success": true,
  "message": "Subscription changed to standard"
}
```

**Erreurs**

- `400`:
  - Tier identique.
  - Demande incohérente.
- `404`:
  - Utilisateur ou subscription non trouvé.

**Logique métier backend (à considérer côté front)**

- **Upgrade** (vers un tier plus haut):
  - Reset immédiat des quotas (`quota_used_monthly = 0`, `quota_used_daily = 0`).
- **Downgrade** (tier plus bas):
  - Les quotas utilisés sont conservés jusqu’à la `renewal_date`.
  - Il est donc possible que `monthly_used > monthly_quota` pour le nouveau plan.
- **Changement Freemium ↔ payant**:
  - Freemium → Standard/Famille+:
    - `renewal_type` passe à `"anniversary"`.
    - `renewal_date` = date actuelle + 1 mois (ou +1 an si yearly).
  - Standard/Famille+ → Freemium:
    - `renewal_type` passe à `"calendar"`.
    - `renewal_date` = prochain 1er du mois.

**Logique front à implémenter**

- Sur la page Pricing / “Changer de plan”:
  1. Récupérer `SubscriptionStatus`.
  2. Permettre de choisir un nouveau plan + période.
  3. Appeler `POST /change-tier`.
  4. En cas de succès:
     - Recharger `GET /status`.
     - Afficher un message adapté, ex:
       - Upgrade: “Votre plan a été mis à jour, vos quotas ont été réinitialisés.”
       - Downgrade: “Votre plan sera aligné sur les limites Freemium au prochain renouvellement le JJ/MM/AAAA.”

---

### 3.5 Changer la période de facturation (monthly/yearly)

**Endpoint**

- `POST /api/subscription/{user_id}/change-billing-period`

**Payload (`ChangeBillingPeriodRequest`)**

```jsonc
{
  "new_period": "yearly"   // "monthly" | "yearly"
}
```

**Réponse – structure**

```jsonc
{
  "success": true,
  "message": "Billing period changed to yearly"
}
```

**Comportement backend**

- Récupère d’abord le `tier` actuel via `get_subscription_status`.
- Appelle la même logique que `change_subscription_tier` en gardant le tier, mais en changeant `billing_period`.

**Logique front à implémenter**

- Sur “Mon abonnement”:
  - Boutons:
    - “Passer en annuel” → `new_period: "yearly"`.
    - “Revenir au mensuel” → `new_period: "monthly"`.
  - Après succès:
    - Recharger `/status`.
    - Mettre à jour la date de renouvellement et l’indication “Mensuel/Annuel”.

---

### 3.6 Acheter un pack add-on

**Endpoint**

- `POST /api/subscription/{user_id}/addon-pack`

**Payload (`PurchaseAddonPackRequest`)**

```jsonc
{
  "pack_count": 2     // entier entre 1 et 10
}
```

**Réponse – structure**

```jsonc
{
  "success": true,
  "message": "Added 40 quotas",
  "packs_purchased": 2,
  "quotas_added": 40,
  "addon_quota_remaining": 60,
  "total_packs_purchased": 3
}
```

**Erreurs**

- `400` si `pack_count` < 1 ou > 10, ou autre problème.
- `404` si utilisateur/subscription non trouvé.

**Logique métier backend**

- Chaque pack ajoute `ADDON_PACK_CONFIG["pack_size"]` fiches (20).
- `addon_quota_remaining` est **consommé en priorité** avant `monthly_quota`.
- Les quotas add-on **ne disparaissent pas** au renouvellement mensuel.

**Logique front à implémenter**

- Affichage:
  - Dans “Mon abonnement” ou lors d’un message “quota dépassé”.
- Flow:
  1. L’utilisateur choisit un nombre de packs (1–10).
  2. Appeler `POST /addon-pack`.
  3. En cas de succès:
     - Mettre à jour l’affichage `addon_quota_remaining` avec la valeur renvoyée.
     - Facultatif: recharger `/status` pour un état complet.
  4. Afficher un message “X fiches supplémentaires ont été ajoutées à votre compte”.

---

### 3.7 Historique des transactions

**Endpoint**

- `GET /api/subscription/{user_id}/history?limit=50&transaction_type=usage|addon_purchase|renewal`

**Query params**

- `limit`: nombre max de transactions (1–200, default 50).
- `transaction_type` (optionnel):
  - `"usage"`: consommation de quota.
  - `"addon_purchase"`: achat de pack.
  - `"renewal"`: reset mensuel/annuel.

**Réponse – structure**

```jsonc
{
  "user_id": "john.doe@example.com",
  "transaction_count": 3,
  "transactions": [
    {
      "transaction_id": "uuid-1",
      "user_id": "john.doe@example.com",
      "timestamp": "2025-02-01T10:00:00Z",
      "transaction_type": "renewal",
      "quota_source": "monthly",
      "quota_consumed": 0,
      "exercise_id": null,
      "subject": null,
      "monthly_quota_remaining": 50,
      "daily_quota_remaining": null,
      "addon_quota_remaining": 40,
      "tier": "standard",
      "billing_period": "monthly"
    },
    {
      "transaction_id": "uuid-2",
      "user_id": "john.doe@example.com",
      "timestamp": "2025-02-02T09:00:00Z",
      "transaction_type": "usage",
      "quota_source": "addon",
      "quota_consumed": 1,
      "exercise_id": "ex-123",
      "subject": "math",
      "monthly_quota_remaining": 50,
      "daily_quota_remaining": null,
      "addon_quota_remaining": 39,
      "tier": "standard",
      "billing_period": "monthly"
    }
  ]
}
```

**Logique front à implémenter**

- Page “Historique de mon abonnement”:
  - Afficher une timeline avec:
    - Date.
    - Type (usage, achat de pack, renouvellement).
    - Impact sur les quotas.
  - Ajouter des filtres par `transaction_type`.
- Peut être utilisé:
  - Pour expliquer au user pourquoi ses quotas sont épuisés.
  - Pour un support client.

---

### 3.8 Health check

**Endpoint**

- `GET /api/subscription/health`

**Usage front**

- Principalement technique (monitoring, debug).
- Pas nécessaire pour les écrans utilisateurs.

---

## 4. Structures de données conseillées côté front

### 4.1 Types / Interfaces (pseudo TypeScript)

```ts
type SubscriptionTier = "freemium" | "standard" | "famille_plus";
type SubscriptionStatusEnum = "active" | "expired" | "cancelled" | "pending";
type BillingPeriod = "monthly" | "yearly";
type RenewalType = "calendar" | "anniversary";

type BillingInfo = {
  price: number;
  currency: "EUR";
  period: "month" | "year";
  price_per_month?: number;
  display: string;
  discount_percent?: number;
  savings?: number;
  recommended?: boolean;
};

type SubscriptionPlan = {
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
};

type AddonPackConfig = {
  pack_size: number;
  price: number;
  display_name: string;
  description: string;
};

type SubscriptionPlansResponse = {
  plans: SubscriptionPlan[];
  addon_pack: AddonPackConfig;
};

type SubscriptionStatus = {
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
  renewal_date: string; // ISO
  start_date: string;   // ISO
  features: string[];
  auto_renewal: boolean;
};
```

---

## 5. Flows de logique front recommandés

### 5.1 Onboarding / Premier login

1. L’utilisateur se connecte (auth déjà gérée).
2. Le front:
   - Appelle `GET /api/subscription/{user_id}/status`.
3. Si `status` 200:
   - Stocker `SubscriptionStatus` dans un store global.
   - Afficher quotas et plan dans le header / dashboard.
4. Si `status` 404:
   - Appeler `POST /api/subscription/{user_id}/initialize`.
   - Re-tenter `GET /status`.
   - Afficher un message “Votre plan Freemium a été initialisé”.

### 5.2 Page Pricing / Choix du plan

1. Appeler `GET /api/subscription/plans`.
2. Appeler `GET /api/subscription/{user_id}/status` (si connecté).
3. Construire l’UI:
   - 3 cartes de plan avec:
     - Nom, description, quotas.
     - Prix mensuel et annuel.
     - Badge “Économisez X%” sur l’option yearly recommandée.
   - Marquer le plan/période actuel comme “Actif”.
4. Lors d’un clic sur “Choisir ce plan”:
   - Appeler `POST /change-tier` avec `new_tier` et `new_billing_period`.
   - En cas de succès:
     - Recharger `/status`.
     - Rediriger vers “Mon abonnement” ou afficher un message de succès.

### 5.3 Page “Mon abonnement”

Données chargées via:

- `GET /status`
- `GET /plans` (facultatif, pour réafficher le pricing).

Affichage:

- Plan actuel et période (`tier`, `billing_period`).
- Quotas:
  - “Fiches restantes ce mois-ci: `monthly_remaining` sur `monthly_quota`.”
  - “Fiches add-on restantes: `addon_quota_remaining`.”
- Date de `renewal_date` formatée.
- Actions:
  - “Changer de plan” → navigation vers Pricing.
  - “Passer à annuel / mensuel”:
    - `POST /change-billing-period`.
  - “Acheter un pack de 20 fiches”:
    - `POST /addon-pack` avec `pack_count` choisi.

### 5.4 Gestion des quotas lors de la génération d’exercices

L’endpoint de génération d’exercices (dans `education/routes/exercise_route.py`) vérifie et consomme les quotas avant de générer:

- En cas de quotas suffisant:
  - L’exercice est généré.
  - La réponse peut inclure des infos de quotas (selon implémentation).
- En cas de quotas épuisés:
  - HTTP 429 (Too Many Requests) avec un `detail` contenant `quota_info`.

**Logique front**

- Lors d’un appel à l’API de génération d’exercices:
  - Si réponse 200:
    - Afficher les exercices.
    - Optionnellement mettre à jour les quotas avec `quota_info` si présent.
  - Si réponse 429:
    - Lire `err.response.data.detail.quota_info` (ou équivalent).
    - Afficher un message “Vous avez atteint votre quota”.
    - Proposer:
      - Achat de pack add-on (→ `POST /addon-pack`).
      - Upgrade de plan (→ `POST /change-tier`).
    - Après action de l’utilisateur:
      - Recharger `/status`.
      - Proposer de relancer la génération.

---

## 6. Instructions explicites pour Claude (LLM)

Lors de la génération du code front-end pour cette logique de souscription:

1. **Toujours**:
   - Utiliser `user_id` = email pour appeler les endpoints.
   - Centraliser l’état de souscription dans un store global (ex: `subscriptionStore`).
2. **Après chaque action de souscription** (change-tier, change-billing-period, addon-pack, initialize):
   - Re-appeler `GET /api/subscription/{user_id}/status`.
   - Mettre à jour l’état global et l’UI.
3. **Ne pas recalculer les quotas côté front**:
   - Utiliser exclusivement les valeurs renvoyées par le backend (`monthly_remaining`, `addon_quota_remaining`, etc.).
4. **Gérer les erreurs HTTP**:
   - 400: afficher un message utilisateur simple et logguer le détail technique.
   - 404 sur `/status`: tenter `/initialize` puis re-check.
   - 429 sur les routes d’exercices: afficher un message clair “quota dépassé” + CTA pour upgrade ou achat de pack.
5. **Ne pas implémenter la logique de facturation Stripe**:
   - Considérer que les endpoints d’abonnement encapsulent déjà la logique de paiement (mock ou réel).
   - Le front se contente d’appeler les routes et d’afficher la confirmation / échec.
