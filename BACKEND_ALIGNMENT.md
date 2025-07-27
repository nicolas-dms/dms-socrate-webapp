# Alignment Backend - Frontend pour la génération d'exercices

## Modèles Pydantic du Backend

```python
class ExerciceLevel(str, Enum):
    CP = "cp"
    CE1 = "ce1"
    CE2 = "ce2"
    CM1 = "cm1"
    CM2 = "cm2"

class ExerciceTime(str, Enum):
    "20M" = "20 minutes"
    "30M" = "30 minutes"
    "40M" = "40 minutes"

class ExerciceDomain(str, Enum):
    MATHEMATIQUES = "mathematiques"
    FRANCAIS = "francais"

class ExerciceType(str, Enum):
    LECTURE = "lecture"
    ECRITURE = "ecriture"
    GRAMMAIRE = "grammaire"
    CONJUGAISON = "conjugaison"
    ORTHOGRAPHE = "orthographe"
    CALCUL = "calcul"
    PROBLEME = "probleme"

class ExerciceGenerationRequest(BaseModel):
    theme: str = Field(..., description="Thème des exercices à générer")
    class_level: str = Field(default="CE1", description="Niveau de classe")
    exercice_domain: ExerciceDomain = Field(..., description="Domaine des exercices")
    exercice_time: ExerciceTime = Field(..., description="Temps estimé pour la feuille d'exercice")
    exercice_types: List[ExerciceType] = Field(default=[ExerciceType.LECTURE, ExerciceType.ECRITURE])
    specific_requirements: Optional[str] = Field(None, description="Exigences spécifiques")
```

## Mapping Frontend → Backend

### Interface utilisateur (Frontend)
```typescript
// Sélections utilisateur
level: "CE1"
duration: "30 min"
selectedTypes: ["lecture", "grammaire", "conjugaison"]
readingTheme: "Les animaux de la forêt"
```

### Requête générée (Backend)
```json
{
  "theme": "Les animaux de la forêt",
  "class_level": "ce1",
  "exercice_domain": "francais",
  "exercice_time": "30 minutes",
  "exercice_types": ["lecture", "grammaire", "conjugaison"],
  "specific_requirements": null
}
```

## Mapping des Types d'Exercices

| Interface utilisateur | Backend Enum | Description |
|----------------------|--------------|-------------|
| `"lecture"` | `ExerciceType.LECTURE` | Exercices de lecture |
| `"vocabulaire"` | `ExerciceType.ECRITURE` | Vocabulaire → Écriture |
| `"grammaire"` | `ExerciceType.GRAMMAIRE` | Exercices de grammaire |
| `"conjugaison"` | `ExerciceType.CONJUGAISON` | Exercices de conjugaison |
| `"orthographe"` | `ExerciceType.ORTHOGRAPHE` | Exercices d'orthographe |

## Endpoints API

### Générer un PDF
```
POST /api/exercices/generate
Content-Type: application/json

{
  "theme": "Les animaux de la forêt",
  "class_level": "ce1",
  "exercice_domain": "francais",
  "exercice_time": "30 minutes",
  "exercice_types": ["lecture", "grammaire"],
  "specific_requirements": null
}
```

### Vérifier le statut de génération
```
GET /api/exercices/generate/{generation_id}/status
```

### Régénérer un PDF (gratuit)
```
POST /api/exercices/regenerate/{original_generation_id}
```

## Flux de génération

1. **Sélection utilisateur** → Aperçu structurel
2. **Validation utilisateur** → Génération avec consommation crédit
3. **Génération** → Statut pending/completed/failed
4. **En cas d'échec** → Possibilité de régénération gratuite (1 fois)

## Exemples de requêtes

### Exemple 1: CE1, 20 minutes, lecture + grammaire
```json
{
  "theme": "Les saisons",
  "class_level": "ce1",
  "exercice_domain": "francais",
  "exercice_time": "20 minutes",
  "exercice_types": ["lecture", "grammaire"],
  "specific_requirements": null
}
```

### Exemple 2: CM2, 40 minutes, exercices complets
```json
{
  "theme": "L'exploration spatiale",
  "class_level": "cm2",
  "exercice_domain": "francais",
  "exercice_time": "40 minutes",
  "exercice_types": ["lecture", "grammaire", "conjugaison", "orthographe"],
  "specific_requirements": "Niveau de difficulté élevé"
}
```

## Tests et Debugging

Utilisez `previewBackendRequest()` dans la console pour voir la requête générée :

```typescript
import { previewBackendRequest } from '../utils/requestPreview';

// Preview dans la console
previewBackendRequest("CE1", "30 min", ["lecture", "grammaire"], "Les animaux");
```
