import { debugLog } from '../utils/debug';
import { ExerciceTypeParam } from '../types/exerciceTypes';

export interface ParcoursTemplate {
  id: string;
  name: string;
  level: string;
  subject: 'french' | 'math';
  description: string;
  estimatedWeeks: number;
  estimatedFichesPerWeek: number;
  exerciseTypes: string[];
  color: string;
  icon: string;
}

export interface ParcoursConfig {
  templateId?: string;
  name: string;
  level: string;
  subject: 'french' | 'math';
  exerciseTypes: string[];
  numberOfFiches: number;
  specificRequirements?: string;
  exerciceTypeParams?: ExerciceTypeParam;
}

// Interface for parcours session/fiche within a parcours
export interface ParcoursSession {
  id: string;
  title: string; // Title/name of the fiche
  theme: string; // Theme of the fiche
  status: 'pending' | 'generating' | 'completed' | 'failed';
  pdf_url?: string;
  created_at: string;
}

// Interface for active/running parcours instances
export interface ActiveParcours extends ParcoursTemplate {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  created_at: string;
  estimated_completion?: string;
  sessions?: ParcoursSession[]; // Generated sessions/fiches
  totalWeeks: number;
  fichesPerWeek: number;
  totalFiches: number;
  zip_url?: string; // URL for downloading all fiches as ZIP
}

// Predefined parcours templates
export const PARCOURS_TEMPLATES: ParcoursTemplate[] = [
  {
    id: 'conjugaison-ce1',
    name: 'Conjugaison CE1',
    level: 'CE1',
    subject: 'french',
    description: 'Apprentissage progressif de la conjugaison au présent, futur et passé composé',
    estimatedWeeks: 4,
    estimatedFichesPerWeek: 2,
    exerciseTypes: ['conjugaison', 'grammaire'],
    color: 'primary',
    icon: 'bi-alphabet'
  },
  {
    id: 'grammaire-ce2',
    name: 'Grammaire CE2',
    level: 'CE2',
    subject: 'french',
    description: 'Révision complète des notions de grammaire : nature et fonction des mots',
    estimatedWeeks: 6,
    estimatedFichesPerWeek: 2,
    exerciseTypes: ['grammaire', 'vocabulaire'],
    color: 'success',
    icon: 'bi-book'
  },
  {
    id: 'revision-ete-ce1',
    name: 'Révision été CE1',
    level: 'CE1',
    subject: 'french',
    description: 'Programme de révision estivale pour consolider les acquis',
    estimatedWeeks: 8,
    estimatedFichesPerWeek: 1,
    exerciseTypes: ['lecture', 'grammaire', 'vocabulaire'],
    color: 'warning',
    icon: 'bi-sun'
  },
  {
    id: 'lecture-cp',
    name: 'Lecture CP',
    level: 'CP',
    subject: 'french',
    description: 'Apprentissage de la lecture progressive avec compréhension',
    estimatedWeeks: 12,
    estimatedFichesPerWeek: 3,
    exerciseTypes: ['lecture', 'comprehension'],
    color: 'info',
    icon: 'bi-eye'
  },
  {
    id: 'orthographe-cm1',
    name: 'Orthographe CM1',
    level: 'CM1',
    subject: 'french',
    description: 'Maîtrise de l\'orthographe lexicale et grammaticale',
    estimatedWeeks: 10,
    estimatedFichesPerWeek: 2,
    exerciseTypes: ['orthographe', 'grammaire'],
    color: 'danger',
    icon: 'bi-pencil'
  },
  {
    id: 'preparation-6eme',
    name: 'Préparation 6ème',
    level: 'CM2',
    subject: 'french',
    description: 'Révision complète pour préparer l\'entrée au collège',
    estimatedWeeks: 6,
    estimatedFichesPerWeek: 3,
    exerciseTypes: ['lecture', 'grammaire', 'conjugaison', 'orthographe'],
    color: 'dark',
    icon: 'bi-mortarboard'
  }
];

export const parcoursService = {
  // Get all predefined templates
  getTemplates: async (): Promise<ParcoursTemplate[]> => {
    debugLog.exercises('Getting parcours templates');
    return PARCOURS_TEMPLATES;
  },

  // Get a specific template by ID
  getTemplateById: async (templateId: string): Promise<ParcoursTemplate | null> => {
    debugLog.exercises('Getting template by ID', { templateId });
    const template = PARCOURS_TEMPLATES.find(t => t.id === templateId);
    return template || null;
  },

  // Generate a parcours (bundle of fiches)
  generateParcours: async (config: ParcoursConfig): Promise<{ success: boolean; message: string }> => {
    debugLog.exercises('Generating parcours', config);
    
    try {
      // TODO: Implement actual parcours generation
      // This will create multiple fiche generation requests based on the config
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      debugLog.exercises('Parcours generation completed', config);
      
      return {
        success: true,
        message: `Parcours "${config.name}" généré avec succès ! ${config.numberOfFiches} fiches ont été créées.`
      };
      
    } catch (error) {
      debugLog.error('Failed to generate parcours', error);
      return {
        success: false,
        message: 'Erreur lors de la génération du parcours. Veuillez réessayer.'
      };
    }
  }
};
