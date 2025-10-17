# Math Exercise Naming System - Implementation Summary

## Overview
Created a centralized math exercise naming configuration system that provides a single source of truth for all math exercise IDs and labels, similar to the French exercise naming system.

## Files Created

### 1. `config/mathExerciseNaming.json`
- **Purpose**: Central configuration file containing all math exercise definitions
- **Structure**: Organized by math domain (nombres, calculs, grandeurs, geometrie, problemes)
- **Content**: Each exercise includes:
  - `id`: Normalized ID (lowercase, underscore-separated)
  - `label`: Display label for UI (matches current usage)
  - `levels`: Array of applicable grade levels (CP, CE1, CE2, CM1, CM2)
  - `description`: Detailed description of the exercise content

### 2. `types/mathExerciseNaming.ts`
- **Purpose**: TypeScript types and utility functions for math exercise naming
- **Key Functions**:
  - `getMathExercisesByType()`: Get all exercises for a domain
  - `getMathExercisesByTypeAndLevel()`: Filter exercises by level
  - `getMathExerciseLabel()`: Get label from ID
  - `getMathExerciseId()`: Get ID from label
  - `getMathExerciseDefinition()`: Get full exercise definition
  - `validateMathExerciseId()`: Validate exercise ID exists
  - `validateMathExerciseForLevel()`: Check if exercise available for level
  - `formatMathExercisesForModal()`: Format for modal components (returns { exercise, contenu })
  - `getMathExerciseKey()`: Convert label to ID
  - `logMathExerciseWarning()`: Development mode warnings

## Exercise Domains and Counts

### Nombres (17 exercises)
- **CP**: lire_ecrire_decomposer_10, ranger_comparer_10, lire_ecrire_decomposer_100, ranger_comparer_100
- **CE1**: lire_ecrire_decomposer_100, ranger_comparer_100, lire_ecrire_decomposer_1000, ranger_comparer_1000
- **CE2**: lire_ecrire_decomposer_1000, ranger_comparer_1000, lire_ecrire_decomposer_10000, ranger_comparer_10000
- **CM1**: grands_nombres_lire_ecrire, grands_nombres_comparer_encadrer, fractions, decimaux_lire_ecrire, decimaux_comparer_ranger
- **CM2**: grands_nombres_lire_decomposer, grands_nombres_comparer_ordonner, fractions, decimaux_lire_decomposer, decimaux_comparer_encadrer

### Calculs (15 exercises)
- **CP**: addition, soustraction, multiplication, partage
- **CE1**: addition, soustraction, multiplication, division
- **CE2**: addition_soustraction, multiplication, division, tableaux_graphiques
- **CM1**: additions_soustractions, multiplication_cm1, division_cm1, decimaux_addition_soustraction, decimaux_multiplication, proportionnalite
- **CM2**: operations_entieres, decimaux_addition_soustraction, decimaux_multiplication_division, proportionnalite

### Grandeurs et mesures (8 exercises)
- **CP**: monnaie, temps, longueurs, masses
- **CE1**: monnaie, temps, longueurs, masses_contenances
- **CE2**: monnaie, temps, longueurs, masses_contenances
- **CM1**: durees, longueurs_perimetres, masses_contenances, angles_aires
- **CM2**: durees, longueurs_perimetres, masses_contenances, angles_aires

### Géométrie (9 exercises)
- **CP**: reperage, quadrillage, symetrie, figures, solides
- **CE1**: reperage, symetrie, droites_angles, figures, solides
- **CE2**: reperage, symetrie, instruments, figures, solides
- **CM1**: reperage, droites_symetrie, figures, programmes, solides
- **CM2**: reperage, droites_symetrie, figures, programmes, solides

### Problèmes (14 exercises)
- **CP**: addition_simple, soustraction_simple
- **CE1**: addition, soustraction, monnaie
- **CE2**: addition_soustraction, multiplication, mesures
- **CM1**: quatre_operations, proportionnalite, geometrie
- **CM2**: operations_complexes, proportionnalite_avancee, geometrie_avancee

## Integration Plan (Not Yet Implemented)

To integrate this system with the existing math modals, follow these steps:

### Step 1: Update Math Modals to Use Configuration

The math modals currently use the `mathDomains` prop which contains:
```typescript
{
  key: "Nombres",
  label: "Nombres",
  exercises: {
    "CP": [
      { exercise: "Label", contenu: "Description" }
    ]
  }
}
```

**Option A: Replace mathDomains with configuration** (recommended)
- Remove hardcoded `mathDomains` array from `app/generate/math/page.tsx`
- Use `formatMathExercisesForModal()` to generate exercises dynamically
- Update modals to use `useMemo` to prevent infinite loops

**Option B: Keep current structure but validate against configuration**
- Keep `mathDomains` for backward compatibility
- Add validation to ensure mathDomains matches the configuration
- Use configuration for new features

### Step 2: Update Each Modal

**NombresModal.tsx**:
```typescript
import { useMemo } from 'react';
import { formatMathExercisesForModal } from '../types/mathExerciseNaming';

// Replace getAvailableExercises with:
const availableExercises = useMemo(() => 
  formatMathExercisesForModal('nombres', level),
  [level]
);
```

**CalculModal.tsx**:
```typescript
const availableExercises = useMemo(() => 
  formatMathExercisesForModal('calculs', level),
  [level]
);
```

**GeometrieModal.tsx**:
```typescript
const availableExercises = useMemo(() => 
  formatMathExercisesForModal('geometrie', level),
  [level]
);
```

**MesuresModal.tsx**:
```typescript
const availableExercises = useMemo(() => 
  formatMathExercisesForModal('grandeurs', level),
  [level]
);
```

**ProblemesModal.tsx**:
```typescript
// Replace PROBLEM_TYPES constant with:
const problemTypes = useMemo(() => 
  formatMathExercisesForModal('problemes', level),
  [level]
);
```

### Step 3: Convert Exercise Labels to IDs (Future Enhancement)

Currently, the modals store exercise labels in the params. For consistency with the French system, consider:

1. Update params to use IDs instead of labels
2. Convert labels to IDs when saving: `getMathExerciseKey('nombres', label)`
3. Convert IDs to labels when displaying: `getMathExerciseLabel('nombres', id)`

## Benefits

### 1. **Single Source of Truth**
- All math exercise IDs and labels in one place
- No duplication across components
- Easy to maintain and update

### 2. **Consistency**
- Normalized IDs (lowercase with underscores)
- Consistent structure across all math domains
- Type-safe access through TypeScript

### 3. **Maintainability**
- Add new exercises by updating JSON only
- No need to modify component code
- Level-based filtering built-in

### 4. **Scalability**
- Easy to add new math domains
- Simple to extend with additional metadata
- Prepared for internationalization (i18n)

### 5. **Developer Experience**
- Clear utility functions for common operations
- Development warnings for missing IDs
- Type safety with TypeScript interfaces
- Compatible with existing modal structure

## Comparison with French Exercise System

| Feature | French Exercises | Math Exercises |
|---------|-----------------|----------------|
| Config File | `frenchExerciseNaming.json` | `mathExerciseNaming.json` |
| Types File | `frenchExerciseNaming.ts` | `mathExerciseNaming.ts` |
| Domains | grammaire, conjugaison, etc. | nombres, calculs, etc. |
| Modal Format | `{ key, label, description }` | `{ exercise, contenu }` |
| Integration | ✅ Fully integrated | ⚠️ Ready for integration |
| Memoization | ✅ useMemo implemented | ⚠️ Needs implementation |

## Next Steps

1. **Integration**: Update math modals to use the configuration system
2. **Memoization**: Add `useMemo` to prevent infinite loops (like French modals)
3. **Testing**: Verify all exercise levels and labels match backend expectations
4. **Migration**: Consider converting from label-based to ID-based storage
5. **Validation**: Add runtime validation to ensure data consistency

## Usage Example

```typescript
import { formatMathExercisesForModal, getMathExerciseKey } from '../types/mathExerciseNaming';

// In a modal component
const availableExercises = useMemo(() => 
  formatMathExercisesForModal('nombres', 'CE1'),
  ['CE1']
);

// Render exercises
{availableExercises.map(ex => (
  <div key={ex.exercise}>
    <label>{ex.exercise}</label>
    <small>{ex.contenu}</small>
  </div>
))}

// When saving, optionally convert to ID
const exerciseId = getMathExerciseKey('nombres', ex.exercise);
```

## Conclusion

The math exercise naming system provides a robust foundation for managing math exercise definitions. While it mirrors the French exercise system's architecture, it's adapted to work with the existing math modal structure. Full integration will require updating the modals to use `useMemo` and consume the configuration dynamically.
