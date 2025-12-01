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

export interface ComprehensionExerciseDefinition {
  id: string;
  label: string;
  levels: string[];
  description: string;
  text_types: string[];
  examples: string[];
}

export interface ExerciseNamingConfig {
  grammaire: ExerciseDefinition[];
  conjugaison: ExerciseDefinition[];
  verb_groups: ExerciseDefinition[];
  orthographe: ExerciseDefinition[];
  lecture: ExerciseDefinition[];
  comprehension: ComprehensionExerciseDefinition[];
  vocabulaire?: ExerciseDefinition[];
}

// Load the configuration
const exerciseNaming: ExerciseNamingConfig = frenchExerciseNamingData as ExerciseNamingConfig;

/**
 * Get all exercises for a specific type
 */
export function getExercisesByType(type: keyof ExerciseNamingConfig): (ExerciseDefinition | ComprehensionExerciseDefinition)[] {
  return (exerciseNaming[type] || []) as (ExerciseDefinition | ComprehensionExerciseDefinition)[];
}

/**
 * Get exercises filtered by level
 */
export function getExercisesByTypeAndLevel(
  type: keyof ExerciseNamingConfig, 
  level: string
): (ExerciseDefinition | ComprehensionExerciseDefinition)[] {
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
): ExerciseDefinition | ComprehensionExerciseDefinition | undefined {
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
): Array<{ key: string; label: string; examples?: string | string[]; description?: string; isCustom?: boolean }> {
  const exercises = getExercisesByTypeAndLevel(type, level);
  return exercises.map(ex => ({
    key: ex.id,
    label: ex.label,
    examples: 'examples' in ex ? ex.examples : undefined,
    description: 'description' in ex ? ex.description : undefined,
    isCustom: 'isCustom' in ex ? ex.isCustom : undefined
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
