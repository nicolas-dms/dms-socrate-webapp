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


export type ExerciceTypeParam = Record<string, Record<string, string>>;


export interface ExerciceGenerationRequest {
  theme: string;
  class_level: string;
  exercice_domain: ExerciceDomain;
  exercice_time: ExerciceTime;
  exercice_types: ExerciceType[];
  exercice_type_params: ExerciceTypeParam,
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
  specificRequirements?: string
): ExerciceGenerationRequest => {
  return {
    theme: theme || "Exercices généraux",
    class_level: convertLevelToBackend(level),
    exercice_domain: domain,
    exercice_time: convertTimeToBackend(duration),
    exercice_types: convertTypesToBackend(selectedTypes),
    exercice_type_params: exercice_type_params,
    specific_requirements: specificRequirements
  };
};
