import api from './api';
import { debugLog } from '../utils/debug';
import { UserCredits, educationUserService, AppCredits } from './userService';
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
  duration?: string; // Session duration (10 min, 20 min, 30 min, or 40 min for legacy files)
  theme?: string; // Reading theme for French exercises
  created_at: string;
  pdf_url?: string;
  status: 'pending' | 'completed' | 'failed';
  quota_info?: any; // Subscription status with updated quota counters (returned by backend after generation)
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  currency: string;
}

export const exerciseService = {  // Generate exercises
  // Uses the real backend API endpoint
  generateExercises: async (userId: string, request: ExerciceGenerationRequest): Promise<ExerciseSession> => {
    console.log('🎯🎯🎯 MAIN SERVICE FUNCTION CALLED - generateExercises with userId:', userId);
    console.log('🎯🎯🎯 Service function timestamp:', new Date().toISOString());
    debugLog.exercises('Exercise generation request', request);
    
    try {
      // Call the real backend endpoint with userId in path
      // Use longer timeout for exercise generation since it can take 15-20 seconds
      const response = await api.post(`/api/education/exercises/generate/${userId}`, request, {
        timeout: 60000 // 60 seconds timeout instead of default 10 seconds
      });
      console.log('Full HTTP response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      debugLog.exercises('Exercise generation response', response.data);
      
      // Backend returns ExerciceResponse, convert to ExerciseSession
      const backendResponse = response.data;
      console.log('Backend response:', backendResponse);
      console.log('Backend response type:', typeof backendResponse);
      console.log('Backend response keys:', Object.keys(backendResponse || {}));
      
      if (backendResponse.success && backendResponse.pdf_path) {
        console.log('Backend success with pdf_path:', backendResponse.pdf_path);
        console.log('Backend quota_info:', backendResponse.quota_info);
        const session: ExerciseSession = {
          id: `session_${Date.now()}`,
          subject: request.exercice_domain,
          level: request.class_level,
          exercise_types: request.exercice_types,
          duration: request.exercice_time,
          theme: request.theme,
          created_at: new Date().toISOString(),
          status: 'completed',
          pdf_url: backendResponse.pdf_path,
          quota_info: backendResponse.quota_info // Include quota_info from backend response
        };
        debugLog.exercises('Converted exercise session', session);
        return session;
      } else {
        console.error('Backend response not successful:', backendResponse);
        console.error('success field:', backendResponse?.success);
        console.error('pdf_path field:', backendResponse?.pdf_path);
        throw new Error(backendResponse.error_message || 'Generation failed');
      }
    } catch (error) {
      console.error('Exercise generation API error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error response:', (error as any)?.response);
      debugLog.error('Exercise generation API failed', error);
      // Fall back to mock response for development
      const mockSession: ExerciseSession = {
        id: `session_${Date.now()}`,
        subject: request.exercice_domain,
        level: request.class_level,
        exercise_types: request.exercice_types,
        created_at: new Date().toISOString(),
        status: 'completed',
        pdf_url: '/exercice_mock.pdf'
      };
      debugLog.exercises('Mock exercise session (API failed)', mockSession);
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
      const durations = ['10 min', '20 min', '30 min', '40 min']; // Keep 40 min for legacy mock data
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
  // Uses the real backend API endpoint for file download
  downloadSessionPDF: async (userId: string, filename: string): Promise<Blob> => {
    debugLog.exercises('Downloading session PDF', { userId, filename });
    
    try {
      // Try the real backend download endpoint
      const response = await api.get(`/api/education/exercises/files/${userId}/${filename}/download`, {
        responseType: 'blob'
      });
      debugLog.exercises('Real PDF download successful');
      return response.data;
    } catch (error) {
      debugLog.warn('Backend PDF download failed, using mock', error);
      
      // Fall back to mock PDF file
      try {
        const response = await fetch('/exercice_mock.pdf');
        if (!response.ok) {
          throw new Error('Failed to fetch mock PDF file');
        }
        const blob = await response.blob();
        debugLog.exercises('Mock PDF download successful');
        return blob;
      } catch (fetchError) {
        debugLog.error('Failed to download PDF', fetchError);
        throw new Error('PDF download failed');
      }
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

// Helper: normalize credits object to strict UserCredits shape
const toUserCredits = (credits?: AppCredits | UserCredits | null): UserCredits => ({
  current_balance: credits?.current_balance ?? 0,
  total_purchased: credits?.total_purchased ?? 0,
  total_used: credits?.total_used ?? 0,
});

// Provide function exports to avoid potential bundler issues with object method properties
export async function generateExercises(userId: string, request: ExerciceGenerationRequest): Promise<ExerciseSession> {
  console.log('🚀🚀🚀 EXPORT FUNCTION CALLED - generateExercises with userId:', userId);
  console.log('🚀🚀🚀 Request details:', JSON.stringify(request, null, 2));
  console.log('🚀🚀🚀 Function timestamp:', new Date().toISOString());
  const result = await exerciseService.generateExercises(userId, request);
  console.log('🚀🚀🚀 EXPORT FUNCTION RESULT:', result);
  return result;
}

export async function downloadSessionPDF(userId: string, filename: string): Promise<Blob> {
  return exerciseService.downloadSessionPDF(userId, filename);
}

export const creditsService = {
  // Get user's current credits using the new API
  getUserCredits: async (userId: string): Promise<UserCredits> => {
    try {
      debugLog.credits('Getting user credits', { userId });
      const appData = await educationUserService.getEducationUserAppData(userId);
      debugLog.credits('User credits retrieved', appData.user_credits);
      return toUserCredits(appData.user_credits);
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
        return toUserCredits(appData.user_credits);
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
      
      // Convert AppCredits to UserCredits with default values
      const credits = appData.user_credits;
      if (!credits) {
        throw new Error('No credits data returned from API');
      }
      
      return toUserCredits(credits);
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
       return toUserCredits(appData.user_credits);
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

