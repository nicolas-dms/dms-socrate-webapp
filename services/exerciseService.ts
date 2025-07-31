import api from './api';
import { debugLog } from '../utils/debug';
import { UserCredits, educationUserService } from './userService';
import { 
  ExerciceGenerationRequest, 
  ExerciceDomain, 
  ExerciceTime, 
  ExerciceType, 
  ExerciceTypeParam, 
  buildExerciceGenerationRequest 
} from '../types/exerciceTypes';

// Backend response interface - matches actual API response
export interface ExerciseGenerationResponse {
  success: boolean;
  error_message: string | null;
  pdf_path: string;
  pdf_base64: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  currency: string;
}

// Unified exercise service - handles both French and Math exercises
export const exerciseService = {
  // Generate exercise fiche/form - unified method for both French and Math
  generateExercise: async (
    userId: string,
    level: string,
    duration: string,
    selectedTypes: string[],
    theme: string,
    domain: ExerciceDomain,
    exercice_type_params: ExerciceTypeParam = {},
    specificRequirements?: string
  ): Promise<ExerciseGenerationResponse> => {
    const request = buildExerciceGenerationRequest(
      level, 
      duration, 
      selectedTypes, 
      theme, 
      domain, 
      exercice_type_params,
      specificRequirements
    );
    
    debugLog.exercises('Exercise generation request', { userId, request });
    
    try {
      const response = await api.post<ExerciseGenerationResponse>(
        `/api/education/exercises/generate/${userId}`, 
        request,
        {
          timeout: 120000 // 2 minutes timeout for exercise generation
        }
      );
      debugLog.exercises('Exercise generation response', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Exercise generation failed', error);
      throw error;
    }
  },

  // Download exercise PDF
  downloadExercisePDF: async (pdfUrl: string): Promise<Blob> => {
    debugLog.exercises('Downloading exercise PDF', { pdfUrl });
    
    try {
      const response = await api.get(pdfUrl, {
        responseType: 'blob',
        timeout: 60000, // 1 minute timeout for PDF download
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      debugLog.exercises('PDF download successful', { size: response.data.size });
      return response.data;
    } catch (error) {
      debugLog.error('PDF download failed', error);
      throw error;
    }
  },

  // Convert base64 PDF data to blob
  base64ToBlob: (base64Data: string): Blob => {
    try {
      // Remove data:application/pdf;base64, prefix if present
      const base64String = base64Data.replace(/^data:application\/pdf;base64,/, '');
      
      // Convert base64 to binary string
      const binaryString = atob(base64String);
      
      // Create byte array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob
      return new Blob([bytes], { type: 'application/pdf' });
    } catch (error) {
      debugLog.error('Failed to convert base64 to blob', error);
      throw new Error('Failed to process PDF data');
    }
  }
};

export const creditsService = {
  // Get user's current credits using the new API
  getUserCredits: async (userId: string): Promise<UserCredits> => {
    try {
      debugLog.credits('Getting user credits', { userId });
      const appData = await educationUserService.getEducationUserAppData(userId);
      debugLog.credits('User credits retrieved', appData.user_credits);
      
      // Convert AppCredits to UserCredits with default values
      const credits = appData.user_credits;
      if (!credits) {
        // If no credits data, return default values
        return {
          current_balance: 0,
          total_purchased: 0,
          total_used: 0
        };
      }
      
      return {
        current_balance: credits.current_balance ?? 0,
        total_purchased: credits.total_purchased ?? 0,
        total_used: credits.total_used ?? 0
      };
    } catch (error) {
      debugLog.error('Failed to get user credits', error);
      throw error;
    }
  },

  // Get available credit packages
  getCreditPackages: async (): Promise<CreditPackage[]> => {
    try {
      debugLog.credits('Getting credit packages');
      const response = await api.get<CreditPackage[]>('/api/education/credits/packages');
      debugLog.credits('Credit packages response', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get credit packages', error);
      throw error;
    }
  },

  // Purchase credits - integrates with the backend user credits system
  purchaseCredits: async (userId: string, packageId: string, paymentData: any): Promise<UserCredits> => {
    try {
      debugLog.credits('Purchasing credits', { userId, packageId });
      
      // First, process the payment
      const paymentResponse = await api.post('/api/payment/process', {
        package_id: packageId,
        payment_data: paymentData,
      });
      
      if (paymentResponse.data.success) {
        // Then add the credits to the user's account using the education API
        const packageCredits = creditsService.getPackageCredits(packageId);
        const appData = await educationUserService.addCredits(userId, packageCredits);
        debugLog.credits('Credits purchased successfully', appData.user_credits);
        
        // Convert AppCredits to UserCredits with default values
        const credits = appData.user_credits;
        if (!credits) {
          throw new Error('No credits data returned from API after purchase');
        }
        
        return {
          current_balance: credits.current_balance ?? 0,
          total_purchased: credits.total_purchased ?? 0,
          total_used: credits.total_used ?? 0
        };
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      debugLog.error('Failed to purchase credits', error);
      throw error;
    }
  },

  // Add credits to user account (direct API integration)
  addCredits: async (userId: string, amount: number): Promise<UserCredits> => {
    try {
      debugLog.credits('Adding credits via API', { userId, amount });
      const appData = await educationUserService.addCredits(userId, amount);
      
      // Convert AppCredits to UserCredits with default values
      const credits = appData.user_credits;
      if (!credits) {
        throw new Error('No credits data returned from API');
      }
      
      return {
        current_balance: credits.current_balance ?? 0,
        total_purchased: credits.total_purchased ?? 0,
        total_used: credits.total_used ?? 0
      };
    } catch (error) {
      debugLog.error('Failed to add credits', error);
      throw error;
    }
  },

  // Use credits from user account (direct API integration)
  useCredits: async (userId: string, amount: number): Promise<UserCredits> => {
    try {
      debugLog.credits('Using credits via API', { userId, amount });
      const appData = await educationUserService.useCredits(userId, amount);
      
      // Convert AppCredits to UserCredits with default values
      const credits = appData.user_credits;
      if (!credits) {
        throw new Error('No credits data returned from API');
      }
      
      return {
        current_balance: credits.current_balance ?? 0,
        total_purchased: credits.total_purchased ?? 0,
        total_used: credits.total_used ?? 0
      };
    } catch (error) {
      debugLog.error('Failed to use credits', error);
      throw error;
    }
  },

  // Helper function to get credits for a package
  getPackageCredits: (packageId: string): number => {
    const packageCreditsMap: { [key: string]: number } = {
      'starter': 25,
      'standard': 60,
      'premium': 150
    };
    return packageCreditsMap[packageId] || 0;
  }
};
