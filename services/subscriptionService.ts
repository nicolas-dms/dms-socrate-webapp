// Subscription Service - Mocked implementation for frontend development
// TODO: Replace with actual Stripe integration

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in euros
  monthlyLimit: number; // number of fiches per month
  description: string;
  features: string[];
}

export interface UserSubscription {
  id: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usageThisMonth: number;
  monthlyLimit: number;
}

export interface SubscriptionUsage {
  current: number;
  limit: number;
  resetDate: string;
  percentageUsed: number;
}

// Available subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2.99,
    monthlyLimit: 30,
    description: 'Parfait pour commencer et découvrir l\'application',
    features: [
      '30 fiches par mois',
      'Tous les types d\'exercices',
      'Support par email'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 5.99,
    monthlyLimit: 100,
    description: 'Le plan le plus populaire pour un usage régulier',
    features: [
      '100 fiches par mois',
      'Tous les types d\'exercices',
      'Support prioritaire',
      'Historique étendu'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 12.99,
    monthlyLimit: 500,
    description: 'Pour les enseignants et utilisateurs intensifs',
    features: [
      '500 fiches par mois',
      'Tous les types d\'exercices',
      'Support prioritaire',
      'Historique illimité',
      'Accès anticipé aux nouvelles fonctionnalités'
    ]
  }
];

class SubscriptionService {
  private baseUrl = '/api/subscription';

  // Mock data for development
  private mockUserSubscription: UserSubscription = {
    id: 'sub_123',
    planId: 'standard',
    status: 'active',
    currentPeriodStart: '2025-01-01T00:00:00Z',
    currentPeriodEnd: '2025-02-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    usageThisMonth: 23,
    monthlyLimit: 100
  };

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.mockUserSubscription);
      }, 500);
    });
  }

  async getSubscriptionUsage(): Promise<SubscriptionUsage> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const usage = this.mockUserSubscription.usageThisMonth;
        const limit = this.mockUserSubscription.monthlyLimit;
        resolve({
          current: usage,
          limit: limit,
          resetDate: this.mockUserSubscription.currentPeriodEnd,
          percentageUsed: Math.round((usage / limit) * 100)
        });
      }, 300);
    });
  }

  async upgradePlan(newPlanId: string): Promise<{ success: boolean; message: string }> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
        if (newPlan) {
          this.mockUserSubscription.planId = newPlanId;
          this.mockUserSubscription.monthlyLimit = newPlan.monthlyLimit;
          resolve({
            success: true,
            message: `Abonnement mis à jour vers ${newPlan.name}`
          });
        } else {
          resolve({
            success: false,
            message: 'Plan non trouvé'
          });
        }
      }, 1000);
    });
  }

  async downgradePlan(newPlanId: string): Promise<{ success: boolean; message: string }> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
        if (newPlan) {
          this.mockUserSubscription.planId = newPlanId;
          this.mockUserSubscription.monthlyLimit = newPlan.monthlyLimit;
          resolve({
            success: true,
            message: `Abonnement modifié vers ${newPlan.name}. Le changement prendra effet à la prochaine période de facturation.`
          });
        } else {
          resolve({
            success: false,
            message: 'Plan non trouvé'
          });
        }
      }, 1000);
    });
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        this.mockUserSubscription.cancelAtPeriodEnd = true;
        resolve({
          success: true,
          message: 'Abonnement annulé. Vous continuerez à avoir accès jusqu\'à la fin de la période actuelle.'
        });
      }, 1000);
    });
  }

  async reactivateSubscription(): Promise<{ success: boolean; message: string }> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        this.mockUserSubscription.cancelAtPeriodEnd = false;
        resolve({
          success: true,
          message: 'Abonnement réactivé avec succès.'
        });
      }, 1000);
    });
  }

  async createCheckoutSession(planId: string): Promise<{ url: string }> {
    // Mock Stripe checkout session creation
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real implementation, this would return Stripe checkout URL
        resolve({
          url: `https://checkout.stripe.com/pay/mock_session_${planId}`
        });
      }, 500);
    });
  }

  getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  }

  canGenerateMoreFiches(subscription: UserSubscription): boolean {
    return subscription.usageThisMonth < subscription.monthlyLimit;
  }

  getRemainingFiches(subscription: UserSubscription): number {
    return Math.max(0, subscription.monthlyLimit - subscription.usageThisMonth);
  }
}

export const subscriptionService = new SubscriptionService();
