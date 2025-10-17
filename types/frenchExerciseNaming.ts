/**
 * French Exercise Naming Configuration
 * Central management of exercise IDs and labels for all French exercise types
 */

import frenchExerciseNamingData from '../config/frenchExerciseNaming.json';

// Type definitions
export interface ExerciseDefinition {
  id: string;
  label: string;
  levels: string[];
  description?: string;
  examples?: string;
  isCustom?: boolean;
}

export interface ExerciseNamingConfig {
  grammaire: ExerciseDefinition[];
  conjugaison: ExerciseDefinition[];
  verb_groups: ExerciseDefinition[];
  orthographe: ExerciseDefinition[];
  comprehension: ExerciseDefinition[];
  vocabulaire: ExerciseDefinition[];
}

// Load the configuration
const exerciseNaming: ExerciseNamingConfig = frenchExerciseNamingData as ExerciseNamingConfig;

/**
 * Get all exercises for a specific type
 */
export function getExercisesByType(type: keyof ExerciseNamingConfig): ExerciseDefinition[] {
  return exerciseNaming[type] || [];
}

/**
 * Get exercises filtered by level
 */
export function getExercisesByTypeAndLevel(
  type: keyof ExerciseNamingConfig, 
  level: string
): ExerciseDefinition[] {
  const exercises = getExercisesByType(type);
  return exercises.filter(ex => ex.levels.includes(level));
}

/**
 * Get exercise label by ID
 */
export function getExerciseLabel(
  type: keyof ExerciseNamingConfig, 
  id: string
): string | undefined {
  const exercises = getExercisesByType(type);
  const exercise = exercises.find(ex => ex.id === id);
  return exercise?.label;
}

/**
 * Get exercise ID by label (case-insensitive)
 */
export function getExerciseId(
  type: keyof ExerciseNamingConfig, 
  label: string
): string | undefined {
  const exercises = getExercisesByType(type);
  const exercise = exercises.find(
    ex => ex.label.toLowerCase() === label.toLowerCase()
  );
  return exercise?.id;
}

/**
 * Get exercise definition by ID
 */
export function getExerciseDefinition(
  type: keyof ExerciseNamingConfig, 
  id: string
): ExerciseDefinition | undefined {
  const exercises = getExercisesByType(type);
  return exercises.find(ex => ex.id === id);
}

/**
 * Validate that an exercise ID exists for a given type
 */
export function validateExerciseId(
  type: keyof ExerciseNamingConfig, 
  id: string
): boolean {
  const exercises = getExercisesByType(type);
  return exercises.some(ex => ex.id === id);
}

/**
 * Validate that an exercise ID is available for a specific level
 */
export function validateExerciseForLevel(
  type: keyof ExerciseNamingConfig, 
  id: string, 
  level: string
): boolean {
  const exercise = getExerciseDefinition(type, id);
  return exercise ? exercise.levels.includes(level) : false;
}

/**
 * Convert exercise IDs array to labels array
 */
export function exerciseIdsToLabels(
  type: keyof ExerciseNamingConfig, 
  ids: string[]
): string[] {
  return ids.map(id => getExerciseLabel(type, id) || id).filter(Boolean);
}

/**
 * Convert exercise labels array to IDs array
 */
export function exerciseLabelsToIds(
  type: keyof ExerciseNamingConfig, 
  labels: string[]
): string[] {
  return labels.map(label => getExerciseId(type, label) || label).filter(Boolean);
}

/**
 * Format exercises as { key, label } for compatibility with existing modal code
 */
export function formatExercisesForModal(
  type: keyof ExerciseNamingConfig,
  level: string
): Array<{ key: string; label: string; examples?: string; description?: string; isCustom?: boolean }> {
  const exercises = getExercisesByTypeAndLevel(type, level);
  return exercises.map(ex => ({
    key: ex.id,
    label: ex.label,
    examples: ex.examples,
    description: ex.description,
    isCustom: ex.isCustom
  }));
}

/**
 * Development mode: Log warning if exercise ID not found
 */
export function logExerciseWarning(
  type: keyof ExerciseNamingConfig, 
  id: string, 
  context: string
): void {
  if (process.env.NODE_ENV === 'development') {
    if (!validateExerciseId(type, id)) {
      console.warn(
        `⚠️ Exercise ID "${id}" not found in ${type} exercises. Context: ${context}`
      );
    }
  }
}

// Export the full configuration for direct access if needed
export { exerciseNaming };

// Export default for convenience
export default {
  getExercisesByType,
  getExercisesByTypeAndLevel,
  getExerciseLabel,
  getExerciseId,
  getExerciseDefinition,
  validateExerciseId,
  validateExerciseForLevel,
  exerciseIdsToLabels,
  exerciseLabelsToIds,
  formatExercisesForModal,
  logExerciseWarning,
  exerciseNaming
};
