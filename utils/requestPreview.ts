// Utility to test and preview the backend request that will be sent
import { 
  ExerciceDomain, 
  buildExerciceGenerationRequest,
  ExerciceGenerationRequest 
} from '../types/exerciceTypes';

export const previewBackendRequest = (
  level: string,
  duration: string,
  selectedTypes: string[],
  theme: string
): ExerciceGenerationRequest => {
  const request = buildExerciceGenerationRequest(
    level,
    duration,
    selectedTypes,
    theme || "Exercices généraux",
    ExerciceDomain.FRANCAIS
  );
  
  console.log("🔍 Backend Request Preview:", request);
  console.log("📝 JSON:", JSON.stringify(request, null, 2));
  
  return request;
};

// Example usage:
// previewBackendRequest("CE1", "30 min", ["lecture", "grammaire"], "Les animaux de la forêt");
// Would output:
// {
//   "theme": "Les animaux de la forêt",
//   "class_level": "ce1",
//   "exercice_domain": "francais",
//   "exercice_time": "30 minutes",
//   "exercice_types": ["lecture", "grammaire"],
//   "specific_requirements": undefined
// }
