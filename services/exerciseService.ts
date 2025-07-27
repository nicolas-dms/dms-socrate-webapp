import api from './api';
import { debugLog } from '../utils/debug';
import { UserCredits, educationUserService } from './userService';
import { ExerciceGenerationRequest, ExerciceDomain, ExerciceTime, ExerciceType, ExerciceTypeParam, buildExerciceGenerationRequest } from '../types/exerciceTypes';

export interface ExerciseRequest {
  theme: string;
  class_level: string;
  exercice_domain: ExerciceDomain;
  exercice_time: ExerciceTime;
  exercice_types: ExerciceType[];
  exercice_type_params: ExerciceTypeParam;
  specific_requirements?: string;
}

export interface ExerciseSession {
  id: string;
  subject: string;
  level: string;
  exercise_types: string[];
  duration?: string; // Session duration (20 min, 30 min, 40 min)
  theme?: string; // Reading theme for French exercises
  created_at: string;
  pdf_url?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  currency: string;
}

export const exerciseService = {  // Generate exercises
  // Note: Exercise endpoints are not yet documented in the API, using mock implementation
  // TODO: Integrate credit deduction when exercise generation is successful
  generateExercises: async (request: ExerciceGenerationRequest): Promise<ExerciseSession> => {
    debugLog.exercises('Exercise generation request', request);
    try {
      // Try the expected endpoint (may not be implemented yet)
      const response = await api.post<ExerciseSession>('/api/education/exercises/generate', request);
      debugLog.exercises('Exercise generation response', response.data);
      
      // TODO: After successful generation, deduct credits using creditsService.useCredits()
      // This should be handled by the backend, but for development:
      // await creditsService.useCredits(userId, CREDITS_COST_PER_EXERCISE);
      
      return response.data;
    } catch (error) {
      debugLog.warn('Exercise generation API not available, using mock data', error);
      // Mock response for development
      const mockSession: ExerciseSession = {
        id: `session_${Date.now()}`,
        subject: request.exercice_domain,
        level: request.class_level,
        exercise_types: request.exercice_types,
        created_at: new Date().toISOString(),
        status: 'completed',
        pdf_url: '/exercice_mock.pdf'
      };
      debugLog.exercises('Mock exercise session', mockSession);
      return mockSession;
    }
  },

  // Get user's exercise sessions
  // Note: Exercise endpoints are not yet documented in the API, using mock implementation
  getUserSessions: async (): Promise<ExerciseSession[]> => {
    try {
      debugLog.exercises('Fetching user sessions');
      // Try the expected endpoint (may not be implemented yet)
      const response = await api.get<ExerciseSession[]>('/api/education/exercises/sessions');
      debugLog.exercises('User sessions response', response.data);
      return response.data;
    } catch (error) {
      debugLog.warn('Sessions API not available, using mock data', error);      
      // Mock sessions for development - Generate 40+ random sessions
      const themes = [
        'Les animaux de la forêt', 'Une journée à la plage', 'Les métiers', 'Les saisons',
        'Les légumes du potager', 'L\'espace et les planètes', 'Les contes de fées',
        'Les sports d\'hiver', 'La vie en ville', 'Les moyens de transport',
        'Les couleurs de l\'automne', 'Les fruits exotiques', 'Les instruments de musique',
        'La cuisine française', 'Les fêtes traditionnelles', 'Les océans et les mers',
        'Les dinosaures', 'La maison écologique', 'Les jeux d\'enfants',
        'Les inventions célèbres'
      ];
      
      const frenchTypes = [
        ['lecture', 'compréhension'], ['lecture', 'grammaire'], ['lecture', 'vocabulaire'],
        ['grammaire', 'conjugaison'], ['vocabulaire', 'orthographe'], ['lecture', 'orthographe'],
        ['grammaire', 'vocabulaire'], ['conjugaison', 'orthographe'], ['lecture', 'grammaire', 'vocabulaire'],
        ['lecture', 'compréhension', 'grammaire']
      ];
      
      const mathTypes = [
        ['addition', 'soustraction'], ['multiplication', 'division'], ['numération', 'calcul'],
        ['géométrie', 'mesures'], ['problèmes', 'calcul'], ['fractions', 'décimaux'],
        ['addition', 'multiplication'], ['géométrie', 'numération'], ['mesures', 'problèmes'],
        ['calcul mental', 'opérations']
      ];
      
      const levels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
      const durations = ['20 min', '30 min', '40 min'];
      const subjects = ['french', 'math'];

      const mockSessions: ExerciseSession[] = [];
      
      // Generate 44 sessions (including original 4)
      for (let i = 0; i < 44; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
        
        let exerciseTypes: string[];
        let theme: string | undefined;
        
        if (subject === 'french') {
          exerciseTypes = frenchTypes[Math.floor(Math.random() * frenchTypes.length)];
          theme = themes[Math.floor(Math.random() * themes.length)];
        } else {
          exerciseTypes = mathTypes[Math.floor(Math.random() * mathTypes.length)];
        }

        mockSessions.push({
          id: `session_${i + 1}`,
          subject,
          level,
          exercise_types: exerciseTypes,
          duration,
          theme,
          created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
          status: 'completed',
          pdf_url: `/exercice_mock.pdf`
        });
      }
      
      // Sort by creation date (newest first)
      mockSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      debugLog.exercises('Mock user sessions', mockSessions);
      return mockSessions;
    }
  },

  // Download PDF for a session
  // Note: Exercise endpoints are not yet documented in the API
  downloadSessionPDF: async (sessionId: string): Promise<Blob> => {
    try {
      debugLog.exercises('Downloading session PDF', { sessionId });
      
      // For development, use mock PDF file
      const response = await fetch('/exercice_mock.pdf');
      if (!response.ok) {
        throw new Error('Failed to fetch mock PDF file');
      }
      const blob = await response.blob();
      debugLog.exercises('Mock PDF download successful');
      return blob;
    } catch (error) {
      debugLog.error('Failed to download PDF', error);
      throw new Error('PDF download failed');
    }
  },

  // Get session details
  // Note: Exercise endpoints are not yet documented in the API
  getSession: async (sessionId: string): Promise<ExerciseSession> => {
    try {
      debugLog.exercises('Getting session details', { sessionId });
      const response = await api.get<ExerciseSession>(`/api/education/exercises/sessions/${sessionId}`);
      debugLog.exercises('Session details retrieved', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get session details (endpoint may not be implemented)', error);
      // Return mock session for development
      const mockSession: ExerciseSession = {
        id: sessionId,
        subject: 'math',
        level: 'CE1',
        exercise_types: ['add', 'sub'],
        created_at: new Date().toISOString(),
        status: 'completed',
        pdf_url: '/exercice_mock.pdf'
      };
      debugLog.exercises('Mock session details', mockSession);
      return mockSession;
    }
  },
};

export const creditsService = {
  // Get user's current credits using the new API
  getUserCredits: async (userId: string): Promise<UserCredits> => {
    try {
      debugLog.credits('Getting user credits', { userId });
      const appData = await educationUserService.getEducationUserAppData(userId);
      debugLog.credits('User credits retrieved', appData.user_credits);
      return appData.user_credits;
    } catch (error) {
      debugLog.warn('Credits API not available, using mock data', error);
      // Mock response for development
      const mockCredits: UserCredits = {
        current_balance: 50,
        total_purchased: 100,
        total_used: 50
      };
      debugLog.credits('Mock user credits', mockCredits);
      return mockCredits;
    }
  },

  // Get available credit packages
  // Note: This endpoint doesn't exist in the API documentation, so using mock data
  getCreditPackages: async (): Promise<CreditPackage[]> => {
    try {
      debugLog.credits('Getting credit packages');
      
      // Try to fetch from potential packages endpoint (not documented but may exist)
      const response = await api.get<CreditPackage[]>('/api/education/credits/packages');
      debugLog.credits('Credit packages response', response.data);
      return response.data;
    } catch (error) {
      debugLog.warn('Packages API not available, using mock data', error);
      // Mock response for development - these are the standard packages
      const mockPackages: CreditPackage[] = [
        {
          id: 'starter',
          credits: 25,
          price: 4.99,
          currency: 'EUR'
        },
        {
          id: 'standard',
          credits: 60,
          price: 9.99,
          currency: 'EUR'
        },
        {
          id: 'premium',
          credits: 150,
          price: 19.99,
          currency: 'EUR'
        }
      ];
      debugLog.credits('Mock credit packages', mockPackages);
      return mockPackages;
    }
  },

  // Purchase credits - integrates with the backend user credits system
  purchaseCredits: async (userId: string, packageId: string, paymentData: any): Promise<UserCredits> => {
    try {
      debugLog.credits('Purchasing credits', { userId, packageId });
      
      // First, process the payment (this would be a separate payment API call)
      // Note: Payment API endpoints are commented out in the documentation
      const paymentResponse = await api.post('/api/payment/process', {
        package_id: packageId,
        payment_data: paymentData,
      });
      
      if (paymentResponse.data.success) {
        // Then add the credits to the user's account using the education API
        const packageCredits = creditsService.getPackageCredits(packageId);
        const appData = await educationUserService.addCredits(userId, packageCredits);
        debugLog.credits('Credits purchased successfully', appData.user_credits);
        return appData.user_credits;
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      debugLog.warn('Purchase API not available, using mock data', error);
      // Mock successful purchase response
      const packageCredits = creditsService.getPackageCredits(packageId);
      const mockUpdatedCredits: UserCredits = {
        current_balance: 50 + packageCredits, // Mock: added package credits
        total_purchased: 100 + packageCredits, // Mock: increased by package credits
        total_used: 50
      };
      debugLog.credits('Mock purchase response', mockUpdatedCredits);
      return mockUpdatedCredits;
    }
  },

  // Add credits to user account (direct API integration)
  addCredits: async (userId: string, amount: number): Promise<UserCredits> => {
    try {
      debugLog.credits('Adding credits via API', { userId, amount });
      const appData = await educationUserService.addCredits(userId, amount);
      return appData.user_credits;
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
      return appData.user_credits;
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

// Helper function to convert legacy ExerciseRequest to new ExerciceGenerationRequest
export const convertLegacyExerciseRequest = (
  subject: 'math' | 'french',
  level: string,
  exerciseTypes: string[],
  theme: string = '',
  exerciceTypeParams: ExerciceTypeParam = {},
  specificRequirements?: string
): ExerciceGenerationRequest => {
  const domain = subject === 'math' ? ExerciceDomain.MATHEMATIQUES : ExerciceDomain.FRANCAIS;
  
  return buildExerciceGenerationRequest(
    level,
    '30 min', // Default duration
    exerciseTypes,
    theme || 'Exercices généraux',
    domain,
    exerciceTypeParams,
    specificRequirements
  );
};
