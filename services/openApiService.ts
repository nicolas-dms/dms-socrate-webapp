/**
 * Service pour gérer la synchronisation et l'utilisation des données OpenAPI
 */

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
}

class OpenAPIService {
  private schema: OpenAPISchema | null = null;

  /**
   * Charge le schéma OpenAPI depuis le localStorage
   */
  loadSchema(): OpenAPISchema | null {
    try {
      const stored = localStorage.getItem('openapi-schema');
      if (stored) {
        this.schema = JSON.parse(stored);
        return this.schema;
      }
    } catch (error) {
      console.error('Error loading OpenAPI schema:', error);
    }
    return null;
  }

  /**
   * Récupère le schéma actuel
   */
  getSchema(): OpenAPISchema | null {
    if (!this.schema) {
      this.loadSchema();
    }
    return this.schema;
  }

  /**
   * Vérifie si le schéma est disponible
   */
  isSchemaAvailable(): boolean {
    return this.getSchema() !== null;
  }

  /**
   * Récupère tous les endpoints disponibles
   */
  getEndpoints(): EndpointInfo[] {
    const schema = this.getSchema();
    if (!schema) return [];

    const endpoints: EndpointInfo[] = [];

    Object.entries(schema.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation !== null) {
          const op = operation as any; // Type assertion pour éviter les erreurs TypeScript
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: op.operationId,
            summary: op.summary,
            parameters: op.parameters,
            requestBody: op.requestBody,
            responses: op.responses
          });
        }
      });
    });

    return endpoints;
  }

  /**
   * Trouve un endpoint par operationId
   */
  findEndpointByOperationId(operationId: string): EndpointInfo | null {
    const endpoints = this.getEndpoints();
    return endpoints.find(ep => ep.operationId === operationId) || null;
  }

  /**
   * Trouve des endpoints par path pattern
   */
  findEndpointsByPath(pathPattern: string): EndpointInfo[] {
    const endpoints = this.getEndpoints();
    return endpoints.filter(ep => ep.path.includes(pathPattern));
  }

  /**
   * Récupère les schémas de données
   */
  getSchemas(): Record<string, any> {
    const schema = this.getSchema();
    return schema?.components?.schemas || {};
  }

  /**
   * Récupère un schéma spécifique par nom
   */
  getSchemaByName(name: string): any | null {
    const schemas = this.getSchemas();
    return schemas[name] || null;
  }

  /**
   * Valide une URL d'endpoint selon le schéma
   */
  validateEndpoint(method: string, path: string): boolean {
    const schema = this.getSchema();
    if (!schema) return false;

    const pathItem = schema.paths[path];
    if (!pathItem) return false;

    return method.toLowerCase() in pathItem;
  }

  /**
   * Construit une URL complète pour un endpoint
   */
  buildEndpointUrl(basePath: string, endpointPath: string, params?: Record<string, any>): string {
    let url = `${basePath}${endpointPath}`;
    
    if (params) {
      // Remplacer les paramètres de path {id} -> 123
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, String(value));
      });
    }

    return url;
  }

  /**
   * Récupère les informations de l'API
   */
  getApiInfo(): { title: string; version: string; description?: string } | null {
    const schema = this.getSchema();
    return schema?.info || null;
  }

  /**
   * Génère un rapport de compatibilité
   */
  generateCompatibilityReport(): {
    totalEndpoints: number;
    availableSchemas: number;
    lastSync: string | null;
    endpoints: EndpointInfo[];
    schemas: string[];
  } {
    const endpoints = this.getEndpoints();
    const schemas = Object.keys(this.getSchemas());
    const lastSync = localStorage.getItem('admin-openapi-sync');
    
    let syncDate = null;
    if (lastSync) {
      try {
        const syncData = JSON.parse(lastSync);
        syncDate = syncData.lastSync;
      } catch (e) {
        // ignore
      }
    }

    return {
      totalEndpoints: endpoints.length,
      availableSchemas: schemas.length,
      lastSync: syncDate,
      endpoints,
      schemas
    };
  }

  /**
   * Synchronise le schéma depuis le backend
   */
  async syncFromBackend(backendUrl: string = 'http://localhost:8000'): Promise<boolean> {
    try {
      const response = await fetch(`${backendUrl}/openapi.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const schema = await response.json();
      localStorage.setItem('openapi-schema', JSON.stringify(schema, null, 2));
      this.schema = schema;

      // Sauvegarder les infos de sync
      const syncData = {
        lastSync: new Date().toISOString(),
        status: 'success',
        message: 'Synchronisation automatique réussie',
        schemaInfo: {
          version: schema.info?.version || 'N/A',
          title: schema.info?.title || 'N/A',
          paths: Object.keys(schema.paths || {}).length,
          schemas: Object.keys(schema.components?.schemas || {}).length
        }
      };
      localStorage.setItem('admin-openapi-sync', JSON.stringify(syncData));

      return true;
    } catch (error) {
      console.error('Auto-sync failed:', error);
      return false;
    }
  }
}

// Instance singleton
export const openAPIService = new OpenAPIService();

// Utilitaires pour les développeurs
export const useOpenAPI = () => {
  const schema = openAPIService.getSchema();
  const endpoints = openAPIService.getEndpoints();
  const apiInfo = openAPIService.getApiInfo();
  
  return {
    schema,
    endpoints,
    apiInfo,
    isAvailable: openAPIService.isSchemaAvailable(),
    findEndpoint: openAPIService.findEndpointByOperationId.bind(openAPIService),
    buildUrl: openAPIService.buildEndpointUrl.bind(openAPIService),
    validate: openAPIService.validateEndpoint.bind(openAPIService),
    sync: openAPIService.syncFromBackend.bind(openAPIService)
  };
};

export default openAPIService;
