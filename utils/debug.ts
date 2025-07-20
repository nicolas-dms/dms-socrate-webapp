// Debug utility for conditional logging
export const debugLog = {
  isEnabled: () => {
    return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
  },

  auth: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.log(`🔐 [AUTH] ${message}`, data);
    }
  },

  api: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.log(`🌐 [API] ${message}`, data);
    }
  },

  credits: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.log(`💰 [CREDITS] ${message}`, data);
    }
  },

  exercises: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.log(`📚 [EXERCISES] ${message}`, data);
    }
  },

  user: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.log(`👤 [USER] ${message}`, data);
    }
  },

  warn: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.warn(`⚠️ [WARN] ${message}`, data);
    }
  },

  error: (message: string, data?: any) => {
    if (debugLog.isEnabled()) {
      console.error(`❌ [ERROR] ${message}`, data);
    }
  }
};
