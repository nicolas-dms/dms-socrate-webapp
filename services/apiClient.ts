/**
 * Exemple d'utilisation du service OpenAPI dans vos appels d'API
 */

import { openAPIService } from './openApiService';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Effectue un appel d'API en validant d'abord avec le schéma OpenAPI
   */
  async call(
    operationId: string, 
    params?: Record<string, any>, 
    body?: any,
    options?: RequestInit
  ): Promise<Response> {
    // Trouver l'endpoint dans le schéma
    const endpoint = openAPIService.findEndpointByOperationId(operationId);
    
    if (!endpoint) {
      console.warn(`Endpoint non trouvé pour operationId: ${operationId}`);
      throw new Error(`Unknown endpoint: ${operationId}`);
    }

    // Construire l'URL
    const url = openAPIService.buildEndpointUrl(this.baseUrl, endpoint.path, params);

    // Valider l'endpoint
    if (!openAPIService.validateEndpoint(endpoint.method, endpoint.path)) {
      throw new Error(`Invalid endpoint: ${endpoint.method} ${endpoint.path}`);
    }

    // Effectuer l'appel
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return response;
  }

  /**
   * Méthode helper pour les appels GET
   */
  async get(operationId: string, params?: Record<string, any>): Promise<Response> {
    return this.call(operationId, params);
  }

  /**
   * Méthode helper pour les appels POST
   */
  async post(operationId: string, body?: any, params?: Record<string, any>): Promise<Response> {
    return this.call(operationId, params, body);
  }

  /**
   * Méthode helper pour les appels PUT
   */
  async put(operationId: string, body?: any, params?: Record<string, any>): Promise<Response> {
    return this.call(operationId, params, body);
  }

  /**
   * Méthode helper pour les appels DELETE
   */
  async delete(operationId: string, params?: Record<string, any>): Promise<Response> {
    return this.call(operationId, params);
  }
}

// Instance par défaut
export const apiClient = new ApiClient();

// Exemples d'utilisation :
/*
// Dans vos services existants, vous pourriez remplacer :
const response = await fetch('http://localhost:8000/api/exercises', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(exerciseData)
});

// Par :
const response = await apiClient.post('createExercise', exerciseData);

// Ou pour un GET avec paramètres :
const response = await apiClient.get('getExercise', { id: '123' });
*/
