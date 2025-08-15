// Types aligned with backend Pydantic models

export enum ExerciceLevel {
  CP = "cp",
  CE1 = "ce1", 
  CE2 = "ce2",
  CM1 = "cm1",
  CM2 = "cm2"
}

export enum ExerciceTime {
  TWENTY_MIN = "20 minutes",
  THIRTY_MIN = "30 minutes", 
  FORTY_MIN = "40 minutes"
}

export enum ExerciceDomain {
  MATHEMATIQUES = "mathematiques",
  FRANCAIS = "francais"
}

export enum ExerciceType {
  LECTURE = "lecture",
  COMPREHENSION = "comprehension",
  ECRITURE = "ecriture", 
  GRAMMAIRE = "grammaire",
  CONJUGAISON = "conjugaison",
  ORTHOGRAPHE = "orthographe",
  VOCABULAIRE = "vocabulaire",
  CALCUL = "calcul",
  PROBLEME = "probleme"
}

// Exercise modalities for different exercise types
export enum ExerciceModalite {
  QCM = "qcm",
  IDENTIFICATION = "identification",
  QUESTION = "question", 
  ASSOCIATION = "association",
  DEFAUT = "defaut"
}


// Internal type for UI usage (uses string keys)
export type ExerciceTypeParam = Record<string, Record<string, any>>;

// Structure for individual exercise with its parameters
export interface ExerciseWithParams {
  exercice_id: string;
  params: Record<string, any>;
}

// New structure for detailed exercise parameters organized by ExerciceType
export interface ExercicesByType {
  [exerciceType: string]: ExerciseWithParams[];
}

// Legacy structure for backward compatibility (can be removed later)
export interface ExerciceTypeWithExercices {
  [exerciceType: string]: {
    exercices: string[];
    [key: string]: any; // Other parameters like theme, tenses, etc.
  };
}

// Modality configuration for exercise types
export interface ExerciceModaliteConfig {
  defaultModality: ExerciceModalite;
  availableModalities: ExerciceModalite[];
  levelRecommendations?: Record<string, ExerciceModalite>;
}

// Default modality configurations by exercise type and level
export const MODALITE_CONFIGS: Record<string, ExerciceModaliteConfig> = {
  grammaire: {
    defaultModality: ExerciceModalite.QCM,
    availableModalities: [ExerciceModalite.QCM, ExerciceModalite.IDENTIFICATION, ExerciceModalite.QUESTION, ExerciceModalite.DEFAUT],
    levelRecommendations: {
      CP: ExerciceModalite.IDENTIFICATION,
      CE1: ExerciceModalite.QCM,
      CE2: ExerciceModalite.QCM,
      CM1: ExerciceModalite.QUESTION,
      CM2: ExerciceModalite.QUESTION
    }
  },
  conjugaison: {
    defaultModality: ExerciceModalite.QCM,
    availableModalities: [ExerciceModalite.QCM, ExerciceModalite.IDENTIFICATION, ExerciceModalite.QUESTION, ExerciceModalite.DEFAUT],
    levelRecommendations: {
      CP: ExerciceModalite.IDENTIFICATION,
      CE1: ExerciceModalite.QCM,
      CE2: ExerciceModalite.QCM,
      CM1: ExerciceModalite.QUESTION,
      CM2: ExerciceModalite.QUESTION
    }
  },
  vocabulaire: {
    defaultModality: ExerciceModalite.ASSOCIATION,
    availableModalities: [ExerciceModalite.ASSOCIATION, ExerciceModalite.QCM, ExerciceModalite.IDENTIFICATION, ExerciceModalite.DEFAUT],
    levelRecommendations: {
      CP: ExerciceModalite.ASSOCIATION,
      CE1: ExerciceModalite.ASSOCIATION,
      CE2: ExerciceModalite.QCM,
      CM1: ExerciceModalite.QCM,
      CM2: ExerciceModalite.QUESTION
    }
  }
};

// Helper functions for modalities
export const getDefaultModalityForType = (exerciseType: string, level: string): ExerciceModalite => {
  const config = MODALITE_CONFIGS[exerciseType];
  if (!config) return ExerciceModalite.DEFAUT;
  
  return config.levelRecommendations?.[level] || config.defaultModality;
};

export const getAvailableModalitiesForType = (exerciseType: string): ExerciceModalite[] => {
  const config = MODALITE_CONFIGS[exerciseType];
  return config?.availableModalities || [ExerciceModalite.DEFAUT];
};

export const formatModalityLabel = (modality: ExerciceModalite): string => {
  const labels: Record<ExerciceModalite, string> = {
    [ExerciceModalite.QCM]: "QCM",
    [ExerciceModalite.IDENTIFICATION]: "Identification",
    [ExerciceModalite.QUESTION]: "Question ouverte", 
    [ExerciceModalite.ASSOCIATION]: "Association",
    [ExerciceModalite.DEFAUT]: "Par défaut"
  };
  return labels[modality];
};

// Helper to encode modality in exercise type string (e.g., "present#association")
export const encodeExerciseTypeWithModality = (baseType: string, subType?: string, modality: ExerciceModalite = ExerciceModalite.DEFAUT): string => {
  let result = baseType;
  if (subType) {
    result = `${subType}`; // Use subType as the main identifier for the exercise
  }
  // Always add modality, default to DEFAUT if not specified
  result += `#${modality}`;
  return result;
};

// Helper to decode modality from exercise type string
export const decodeExerciseTypeWithModality = (typeString: string): {
  baseType: string;
  modality: ExerciceModalite;
} => {
  const parts = typeString.split('#');
  const baseType = parts[0];
  const modality = parts[1] ? (parts[1] as ExerciceModalite) : ExerciceModalite.DEFAUT;
  return { baseType, modality };
};


export interface ExerciceGenerationRequest {
  theme: string;
  class_level: string;
  exercice_domain: ExerciceDomain;
  exercice_time: ExerciceTime;
  exercice_types: ExerciceType[];
  exercices_by_type?: ExercicesByType;
  specific_requirements?: string;
}

// Helper functions to convert UI values to backend enums
export const convertLevelToBackend = (uiLevel: string): string => {
  const mapping: Record<string, string> = {
    "CP": ExerciceLevel.CP,
    "CE1": ExerciceLevel.CE1,
    "CE2": ExerciceLevel.CE2, 
    "CM1": ExerciceLevel.CM1,
    "CM2": ExerciceLevel.CM2
  };
  return mapping[uiLevel] || ExerciceLevel.CE1;
};

export const convertTimeToBackend = (uiTime: string): ExerciceTime => {
  const mapping: Record<string, ExerciceTime> = {
    "20 min": ExerciceTime.TWENTY_MIN,
    "30 min": ExerciceTime.THIRTY_MIN,
    "40 min": ExerciceTime.FORTY_MIN
  };
  return mapping[uiTime] || ExerciceTime.THIRTY_MIN;
};

export const convertTypesToBackend = (uiTypes: string[]): ExerciceType[] => {
  const mapping: Record<string, ExerciceType> = {
    "lecture": ExerciceType.LECTURE,
    "comprehension": ExerciceType.COMPREHENSION, // Map comprehension to lecture
    "ecriture": ExerciceType.ECRITURE,
    "grammaire": ExerciceType.GRAMMAIRE,
    "conjugaison": ExerciceType.CONJUGAISON,
    "orthographe": ExerciceType.ORTHOGRAPHE,
    "vocabulaire": ExerciceType.ECRITURE, // Map vocabulaire to ecriture
    "calcul": ExerciceType.CALCUL,
    "probleme": ExerciceType.PROBLEME
  };
  
  return uiTypes.map(type => mapping[type]).filter(Boolean);
};

// Helper to build the complete request
export const buildExerciceGenerationRequest = (
  level: string,
  duration: string, 
  selectedTypes: string[],
  theme: string,
  domain: ExerciceDomain,
  exercice_type_params: ExerciceTypeParam = {},
  specificRequirements?: string,
  exercices_by_type?: ExercicesByType
): ExerciceGenerationRequest => {
  
  // Debug: Log the input params
  console.log('buildExerciceGenerationRequest input exercices:', exercices_by_type);

  return {
    theme: theme || "Exercices généraux",
    class_level: convertLevelToBackend(level),
    exercice_domain: domain,
    exercice_time: convertTimeToBackend(duration),
    exercice_types: convertTypesToBackend(selectedTypes),
    exercices_by_type: exercices_by_type,
    specific_requirements: specificRequirements
  };
};
