import api from './api';
import { debugLog } from '../utils/debug';
import { config } from '../utils/mockConfig';
import { 
  ExerciceGenerationRequest, 
  ExerciceDomain,
  buildExerciceGenerationRequest, 
  ExerciceTypeParam
} from '../types/exerciceTypes';

export interface GenerationResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  pdf_url?: string;
  error_message?: string;
  created_at: string;
}

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  pdf_url?: string;
  error_message?: string;
}

export const pdfGenerationService = {
  // Generate PDF exercises
  generatePDF: async (
    level: string,
    duration: string,
    selectedTypes: string[],
    theme: string,
    domain: ExerciceDomain,
    exercice_type_params: ExerciceTypeParam,
    specificRequirements?: string
  ): Promise<GenerationResponse> => {
    const request = buildExerciceGenerationRequest(
      level, 
      duration, 
      selectedTypes, 
      theme, 
      domain, 
      exercice_type_params,
      specificRequirements
    );
    
    debugLog.exercises('PDF generation request', request);
    
    if (config.MOCK_APIS) {
      // Mock response for development
      const mockResponse: GenerationResponse = {
        id: `generation_${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      // Simulate processing time
      setTimeout(() => {
        mockResponse.status = 'completed';
        mockResponse.pdf_url = `/mock-pdf-${Date.now()}.pdf`;
      }, 2000);
      
      debugLog.exercises('Mock PDF generation response', mockResponse);
      return mockResponse;
    }

    try {
      const response = await api.post<GenerationResponse>('/api/exercices/generate', request);
      debugLog.exercises('PDF generation response', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('PDF generation failed', error);
      throw error;
    }
  },

  // Check generation status
  getGenerationStatus: async (generationId: string): Promise<GenerationStatus> => {
    debugLog.exercises('Checking generation status', { generationId });
    
    if (config.MOCK_APIS) {
      // Mock status response
      const mockStatus: GenerationStatus = {
        id: generationId,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        progress: 100,
        pdf_url: Math.random() > 0.1 ? `/mock-pdf-${generationId}.pdf` : undefined,
        error_message: Math.random() <= 0.1 ? 'Erreur de génération simulée' : undefined,
      };
      
      debugLog.exercises('Mock generation status', mockStatus);
      return mockStatus;
    }

    try {
      const response = await api.get<GenerationStatus>(`/api/exercices/generate/${generationId}/status`);
      debugLog.exercises('Generation status response', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('Failed to get generation status', error);
      throw error;    }
  },

  // Regenerate PDF (free retry)
  regeneratePDF: async (originalGenerationId: string): Promise<GenerationResponse> => {
    debugLog.exercises('PDF regeneration request', { originalGenerationId });
    
    if (config.MOCK_APIS) {
      // Mock regeneration response
      const mockResponse: GenerationResponse = {
        id: `regen_${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      // Higher success rate for regeneration
      setTimeout(() => {
        mockResponse.status = Math.random() > 0.05 ? 'completed' : 'failed';
        if (mockResponse.status === 'completed') {
          mockResponse.pdf_url = `/mock-pdf-regen-${Date.now()}.pdf`;
        } else {
          mockResponse.error_message = 'Erreur de régénération simulée';
        }
      }, 1500);
      
      debugLog.exercises('Mock PDF regeneration response', mockResponse);
      return mockResponse;
    }

    try {
      const response = await api.post<GenerationResponse>(`/api/exercices/regenerate/${originalGenerationId}`);      debugLog.exercises('PDF regeneration response', response.data);
      return response.data;
    } catch (error) {
      debugLog.error('PDF regeneration failed', error);
      throw error;
    }
  },
};
