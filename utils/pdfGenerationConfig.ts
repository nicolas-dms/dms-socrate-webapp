// Configuration for PDF generation testing
export const PDF_GENERATION_CONFIG = {
  // Probability of generation success (0.9 = 90% success rate)
  SUCCESS_RATE: 0.9,
  
  // Probability of regeneration success (0.95 = 95% success rate)
  REGENERATION_SUCCESS_RATE: 0.95,
  
  // Generation delay in milliseconds
  GENERATION_DELAY: 2000,
  
  // Credit cost per generation
  CREDIT_COST: 1,
  
  // Maximum number of free regenerations allowed
  MAX_FREE_REGENERATIONS: 1,
};

// Exercise content calculation based on duration and level
export const EXERCISE_CONTENT_CALCULATOR = {
  calculateContent: (duration: string, selectedTypes: string[], level: string) => {
    const durationMinutes = parseInt(duration.split(' ')[0]);
    const content = {
      readingTexts: 0,
      comprehensionQuestions: 0,
      grammarExercises: 0,
      conjugationExercises: 0,
      vocabularyExercises: 0,
      spellingExercises: 0,
    };

    // Base multiplier by level
    const levelMultiplier = {
      'CP': 0.8,
      'CE1': 0.9,
      'CE2': 1.0,
      'CM1': 1.1,
      'CM2': 1.2,
    }[level] || 1.0;

    selectedTypes.forEach(type => {
      switch (type) {
        case "lecture":
          content.readingTexts = 1;
          content.comprehensionQuestions = Math.round((durationMinutes >= 40 ? 6 : durationMinutes >= 30 ? 5 : durationMinutes >= 20 ? 3 : 2) * levelMultiplier);
          break;
        case "grammaire":
          content.grammarExercises = Math.round((durationMinutes >= 40 ? 6 : durationMinutes >= 30 ? 4 : durationMinutes >= 20 ? 3 : 2) * levelMultiplier);
          break;
        case "conjugaison":
          content.conjugationExercises = Math.round((durationMinutes >= 40 ? 5 : durationMinutes >= 30 ? 4 : durationMinutes >= 20 ? 3 : 2) * levelMultiplier);
          break;
        case "vocabulaire":
          content.vocabularyExercises = Math.round((durationMinutes >= 40 ? 5 : durationMinutes >= 30 ? 4 : durationMinutes >= 20 ? 3 : 2) * levelMultiplier);
          break;
        case "orthographe":
          content.spellingExercises = Math.round((durationMinutes >= 40 ? 6 : durationMinutes >= 30 ? 4 : durationMinutes >= 20 ? 3 : 2) * levelMultiplier);
          break;
      }
    });

    return content;
  },
};

// Sample themes for testing
export const SAMPLE_THEMES = [
  "Les animaux de la forêt",
  "Les saisons et le temps",
  "Une aventure à la plage",
  "Les métiers d'autrefois",
  "L'exploration spatiale",
  "Les légendes françaises",
  "La vie à la ferme",
  "Les océans et la mer",
  "Les châteaux de France",
  "Les inventions célèbres",
];
