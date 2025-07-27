# 🔧 Page d'Administration

## Accès à la page

La page d'administration est accessible à l'adresse : `/admin`

⚠️ **Attention** : Cette page est destinée aux développeurs et administrateurs uniquement.

## Fonctionnalités

### 🔄 Synchronisation OpenAPI

- **Synchronisation manuelle** : Récupère le schéma OpenAPI depuis votre backend
- **URL configurable** : Possibilité de changer l'URL du backend (par défaut : `http://localhost:8000`)
- **Informations détaillées** : Affiche le nombre d'endpoints, de schémas, etc.
- **Visualisation JSON** : Permet de voir le schéma OpenAPI complet
- **Export** : Sauvegarde le schéma en fichier JSON
- **Cache** : Gestion du cache local

### 📊 Informations Système

- Version de l'application
- Environnement d'exécution
- Informations Node.js
- User Agent du navigateur

### 💾 Gestion du Storage

- Visualisation des clés du localStorage
- Export/Sauvegarde du localStorage
- Nettoyage du cache

## Utilisation du Service OpenAPI

### Dans vos composants React

```typescript
import { useOpenAPI } from '../hooks/useOpenAPI';

function MyComponent() {
  const { 
    isLoaded, 
    endpoints, 
    apiInfo, 
    findEndpoint,
    buildUrl 
  } = useOpenAPI();

  if (!isLoaded) {
    return <div>Schéma OpenAPI non chargé</div>;
  }

  return (
    <div>
      <h3>{apiInfo?.title} v{apiInfo?.version}</h3>
      <p>Endpoints disponibles : {endpoints.length}</p>
    </div>
  );
}
```

### Client API typé

```typescript
import { apiClient } from '../services/apiClient';

// Utilisation avec operationId du schéma OpenAPI
const response = await apiClient.post('createExercise', {
  level: 'CE1',
  duration: '30 min',
  types: ['lecture', 'grammaire']
});

// Ou pour un GET avec paramètres
const response = await apiClient.get('getExercise', { id: '123' });
```

### Service direct

```typescript
import { openAPIService } from '../services/openApiService';

// Vérifier si un endpoint existe
const isValid = openAPIService.validateEndpoint('POST', '/api/exercises');

// Construire une URL
const url = openAPIService.buildEndpointUrl(
  'http://localhost:8000', 
  '/api/exercises/{id}', 
  { id: '123' }
);
// Résultat : http://localhost:8000/api/exercises/123

// Trouver un endpoint
const endpoint = openAPIService.findEndpointByOperationId('createExercise');
```

## Synchronisation Automatique

Pour maintenir votre schéma à jour, vous pouvez :

1. **Synchronisation manuelle** via la page d'administration
2. **Synchronisation automatique** en appelant le service :

```typescript
// Dans vos services ou au démarrage de l'app
import { openAPIService } from '../services/openApiService';

// Sync automatique au démarrage
openAPIService.syncFromBackend('http://localhost:8000');
```

## Scripts NPM

- `npm run sync-api` : Synchronisation unique
- `npm run sync-api:watch` : Surveillance continue (déjà configuré)

## Bonnes Pratiques

1. **Synchronisez régulièrement** : Après chaque modification du backend
2. **Utilisez les operationIds** : Plus stable que les URLs hardcodées
3. **Vérifiez la disponibilité** : Toujours tester `isLoaded` avant utilisation
4. **Cache intelligent** : Le localStorage garde le schéma même hors ligne

## Débogage

La page d'administration propose plusieurs outils de débogage :

- **Actions rapides** : Boutons pour synchroniser et recharger
- **Log Debug Info** : Affiche toutes les infos dans la console
- **Export storage** : Sauvegarde complète pour analyse

## Structure des Données

Le schéma OpenAPI est stocké dans le localStorage sous la clé `'openapi-schema'`.

Les informations de synchronisation sont dans `'admin-openapi-sync'` :

```json
{
  "lastSync": "2025-07-27T10:30:00.000Z",
  "status": "success",
  "message": "Synchronisation réussie. 25 endpoints, 12 schémas.",
  "schemaInfo": {
    "version": "1.0.0",
    "title": "DMS Socrate API",
    "paths": 25,
    "schemas": 12
  }
}
```
