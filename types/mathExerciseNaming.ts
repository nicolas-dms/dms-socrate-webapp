/**
 * Math Exercise Naming Configuration
 * Central management of exercise IDs and labels for all math exercise types
 */

import mathExerciseNamingData from '../config/mathExerciseNaming.json';

// Type definitions
export interface MathExerciseDefinition {
  id: string;
  label: string;
  levels: string[];
  description?: string;
}

export interface MathExerciseNamingConfig {
  nombres: MathExerciseDefinition[];
  calculs: MathExerciseDefinition[];
  grandeurs: MathExerciseDefinition[];
  geometrie: MathExerciseDefinition[];
  problemes: MathExerciseDefinition[];
}

// Load the configuration
const mathExerciseNaming: MathExerciseNamingConfig = mathExerciseNamingData as MathExerciseNamingConfig;

/**
 * Get all exercises for a specific type
 */
export function getMathExercisesByType(type: keyof MathExerciseNamingConfig): MathExerciseDefinition[] {
  return mathExerciseNaming[type] || [];
}

/**
 * Get exercises filtered by level
 */
export function getMathExercisesByTypeAndLevel(
  type: keyof MathExerciseNamingConfig, 
  level: string
): MathExerciseDefinition[] {
  const exercises = getMathExercisesByType(type);
  return exercises.filter(ex => ex.levels.includes(level));
}

/**
 * Get exercise label by ID
 */
export function getMathExerciseLabel(
  type: keyof MathExerciseNamingConfig, 
  id: string
): string | undefined {
  const exercises = getMathExercisesByType(type);
  const exercise = exercises.find(ex => ex.id === id);
  return exercise?.label;
}

/**
 * Get exercise ID by label (case-insensitive)
 */
export function getMathExerciseId(
  type: keyof MathExerciseNamingConfig, 
  label: string
): string | undefined {
  const exercises = getMathExercisesByType(type);
  const exercise = exercises.find(
    ex => ex.label.toLowerCase() === label.toLowerCase()
  );
  return exercise?.id;
}

/**
 * Get exercise definition by ID
 */
export function getMathExerciseDefinition(
  type: keyof MathExerciseNamingConfig, 
  id: string
): MathExerciseDefinition | undefined {
  const exercises = getMathExercisesByType(type);
  return exercises.find(ex => ex.id === id);
}

/**
 * Validate that an exercise ID exists for a given type
 */
export function validateMathExerciseId(
  type: keyof MathExerciseNamingConfig, 
  id: string
): boolean {
  const exercises = getMathExercisesByType(type);
  return exercises.some(ex => ex.id === id);
}

/**
 * Validate that an exercise ID is available for a specific level
 */
export function validateMathExerciseForLevel(
  type: keyof MathExerciseNamingConfig, 
  id: string, 
  level: string
): boolean {
  const exercise = getMathExerciseDefinition(type, id);
  return exercise ? exercise.levels.includes(level) : false;
}

/**
 * Convert exercise IDs array to labels array
 */
export function mathExerciseIdsToLabels(
  type: keyof MathExerciseNamingConfig, 
  ids: string[]
): string[] {
  return ids.map(id => getMathExerciseLabel(type, id) || id).filter(Boolean);
}

/**
 * Convert exercise labels array to IDs array
 */
export function mathExerciseLabelsToIds(
  type: keyof MathExerciseNamingConfig, 
  labels: string[]
): string[] {
  return labels.map(label => getMathExerciseId(type, label) || label).filter(Boolean);
}

/**
 * Format exercises as { exercise, contenu } for compatibility with existing modal code
 * This matches the structure used in mathDomains in page.tsx
 */
export function formatMathExercisesForModal(
  type: keyof MathExerciseNamingConfig,
  level: string
): Array<{ exercise: string; contenu: string }> {
  const exercises = getMathExercisesByTypeAndLevel(type, level);
  return exercises.map(ex => ({
    exercise: ex.label,
    contenu: ex.description || ex.label
  }));
}

/**
 * Get exercise key (ID) from label
 * Useful for converting from label-based system to ID-based system
 */
export function getMathExerciseKey(
  type: keyof MathExerciseNamingConfig,
  label: string
): string {
  return getMathExerciseId(type, label) || label;
}

/**
 * Development mode: Log warning if exercise ID not found
 */
export function logMathExerciseWarning(
  type: keyof MathExerciseNamingConfig, 
  id: string, 
  context: string
): void {
  if (process.env.NODE_ENV === 'development') {
    if (!validateMathExerciseId(type, id)) {
      console.warn(
        `⚠️ Math Exercise ID "${id}" not found in ${type} exercises. Context: ${context}`
      );
    }
  }
}

// Export the full configuration for direct access if needed
export { mathExerciseNaming };

// Export default for convenience
export default {
  getMathExercisesByType,
  getMathExercisesByTypeAndLevel,
  getMathExerciseLabel,
  getMathExerciseId,
  getMathExerciseDefinition,
  validateMathExerciseId,
  validateMathExerciseForLevel,
  mathExerciseIdsToLabels,
  mathExerciseLabelsToIds,
  formatMathExercisesForModal,
  getMathExerciseKey,
  logMathExerciseWarning,
  mathExerciseNaming
};
