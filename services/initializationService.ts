// ==========================================
// TypeScript Interfaces
// ==========================================

export interface UserPreferences {
  theme?: string;
  language?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  [key: string]: any;
}

export interface UserData {
  user_id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  preferences: UserPreferences;
}

export interface SubscriptionStatus {
  user_id: number;
  subscription_tier: 'freemium' | 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  fiches_remaining: number;
  max_fiches_per_month: number;
  addon_pack_fiches_remaining: number;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
}

export interface SubscriptionPlan {
  plan_id: string;
  name: string;
  description: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  fiches_per_month: number;
  features: string[];
  is_active: boolean;
  display_order: number;
}

export interface AddonPack {
  pack_id: string;
  name: string;
  description: string;
  price: number;
  fiches_count: number;
  is_active: boolean;
}

export interface PerformanceMetrics {
  db_query_time_ms: number;
  total_time_ms: number;
  cache_hit: boolean;
}

export interface InitializationResponse {
  user: UserData;
  subscription: SubscriptionStatus;
  plans: SubscriptionPlan[];
  addon_pack: AddonPack;
  is_new_user: boolean;
  performance: PerformanceMetrics;
}

export interface CachedInitData {
  data: InitializationResponse;
  timestamp: number;
}

// ==========================================
// Service Functions
// ==========================================

const CACHE_KEY = 'subscription_init_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize user session with combined endpoint
 * Fetches all necessary data in a single API call
 * Caches result in sessionStorage for 5 minutes
 */
export const initializeSession = async (token?: string): Promise<InitializationResponse> => {
  const startTime = performance.now();
  
  try {
    // Check cache first
    const cached = getCachedInitData();
    if (cached) {
      console.log('✅ Using cached initialization data', {
        age: Date.now() - cached.timestamp,
        cacheHit: true
      });
      return cached.data;
    }

    // Fetch fresh data
    console.log('🔄 Fetching fresh initialization data...');
    
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const authToken = token || localStorage.getItem('auth_token');
    
    const response = await fetch(`${baseURL}/api/auth/initialize`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Initialization failed: ${response.status} ${response.statusText}`);
    }

    const data: InitializationResponse = await response.json();

    const endTime = performance.now();
    const clientTime = endTime - startTime;

    console.log('✅ Initialization complete', {
      totalTime: `${clientTime.toFixed(0)}ms`,
      backendTime: `${data.performance.total_time_ms}ms`,
      dbTime: `${data.performance.db_query_time_ms}ms`,
      isNewUser: data.is_new_user,
      tier: data.subscription.subscription_tier,
      fichesRemaining: data.subscription.fiches_remaining
    });

    // Cache the result
    setCachedInitData(data);

    return data;
  } catch (error: any) {
    console.error('❌ Initialization failed:', error);
    
    // Clear stale cache on error
    clearInitCache();
    
    throw error;
  }
};

/**
 * Get cached initialization data if valid
 */
export const getCachedInitData = (): CachedInitData | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedInitData = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    // Check if cache is still valid
    if (age < CACHE_DURATION) {
      return parsed;
    }

    // Expired - remove it
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cached init data:', error);
    return null;
  }
};

/**
 * Cache initialization data in sessionStorage
 */
export const setCachedInitData = (data: InitializationResponse): void => {
  try {
    const cached: CachedInitData = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching init data:', error);
  }
};

/**
 * Clear initialization cache
 * Call this after mutations (subscription changes, profile updates, etc.)
 */
export const clearInitCache = (): void => {
  sessionStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Cleared initialization cache');
};

/**
 * Check if initialization cache exists and is valid
 */
export const hasValidCache = (): boolean => {
  return getCachedInitData() !== null;
};

// ==========================================
// Export Default
// ==========================================

const initializationService = {
  initializeSession,
  getCachedInitData,
  setCachedInitData,
  clearInitCache,
  hasValidCache
};

export default initializationService;
