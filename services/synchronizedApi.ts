/**
 * Service d'API synchronisé avec le backend
 * 
 * Ce fichier utilise les données synchronisées depuis le backend
 * pour maintenir la cohérence des appels API.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Import du schéma synchronisé (sera généré par le script)
let API_SCHEMA: any = null;
let API_ENDPOINTS: Record<string, string> = {};
let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Chargement dynamique du schéma
try {
  const apiTypes = require('../api-schema/api-types');
  API_SCHEMA = apiTypes.API_SCHEMA;
  API_ENDPOINTS = apiTypes.API_ENDPOINTS;
  API_BASE_URL = apiTypes.API_BASE_URL;
} catch (error) {
  console.warn('⚠️ Schéma API non trouvé. Exécutez "npm run sync-api" pour synchroniser avec le backend.');
}

/**
 * Interface pour les options de requête
 */
export interface ApiRequestOptions extends AxiosRequestConfig {
  endpoint?: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, any>;
}

/**
 * Classe de service API synchronisé
 */
class SynchronizedApiService {
  private client: AxiosInstance;
  private schema: any;

  constructor() {
    this.schema = API_SCHEMA;
    
    // Configuration d'Axios avec l'URL de base synchronisée
    this.client = axios.create({
      baseURL: API_BASE_URL,
      // Increase default timeout to 60s to handle slow backend responses during heavy operations
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour les requêtes
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour les réponses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtient les informations du schéma API
   */
  getApiInfo() {
    return this.schema?.info || {
      title: 'API Backend',
      version: 'unknown',
      description: 'Schéma non synchronisé'
    };
  }

  /**
   * Liste tous les endpoints disponibles
   */
  getEndpoints() {
    return API_ENDPOINTS;
  }

  /**
   * Construit une URL avec des paramètres de chemin
   */
  private buildUrl(endpoint: string, pathParams?: Record<string, string | number>): string {
    let url = endpoint;
    
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, String(value));
      });
    }
    
    return url;
  }

  /**
   * Effectue une requête GET
   */
  async get<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { pathParams, queryParams, ...axiosConfig } = options;
    const url = this.buildUrl(endpoint, pathParams);
    
    const response = await this.client.get(url, {
      ...axiosConfig,
      params: queryParams,
    });
    
    return response.data;
  }

  /**
   * Effectue une requête POST
   */
  async post<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    const { pathParams, queryParams, ...axiosConfig } = options;
    const url = this.buildUrl(endpoint, pathParams);
    
    const response = await this.client.post(url, data, {
      ...axiosConfig,
      params: queryParams,
    });
    
    return response.data;
  }

  /**
   * Effectue une requête PUT
   */
  async put<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    const { pathParams, queryParams, ...axiosConfig } = options;
    const url = this.buildUrl(endpoint, pathParams);
    
    const response = await this.client.put(url, data, {
      ...axiosConfig,
      params: queryParams,
    });
    
    return response.data;
  }

  /**
   * Effectue une requête DELETE
   */
  async delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { pathParams, queryParams, ...axiosConfig } = options;
    const url = this.buildUrl(endpoint, pathParams);
    
    const response = await this.client.delete(url, {
      ...axiosConfig,
      params: queryParams,
    });
    
    return response.data;
  }

  /**
   * Effectue une requête PATCH
   */
  async patch<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    const { pathParams, queryParams, ...axiosConfig } = options;
    const url = this.buildUrl(endpoint, pathParams);
    
    const response = await this.client.patch(url, data, {
      ...axiosConfig,
      params: queryParams,
    });
    
    return response.data;
  }

  /**
   * Valide si un endpoint existe dans le schéma
   */
  validateEndpoint(endpoint: string): boolean {
    if (!this.schema?.paths) {
      console.warn('⚠️ Schéma API non disponible pour la validation');
      return true; // On permet la requête si pas de schéma
    }
    
    const exists = Object.keys(this.schema.paths).includes(endpoint);
    if (!exists) {
      console.warn(`⚠️ Endpoint non trouvé dans le schéma: ${endpoint}`);
    }
    
    return exists;
  }

  /**
   * Obtient la documentation d'un endpoint
   */
  getEndpointDocumentation(endpoint: string, method: string = 'get') {
    if (!this.schema?.paths?.[endpoint]?.[method.toLowerCase()]) {
      return null;
    }
    
    return this.schema.paths[endpoint][method.toLowerCase()];
  }
}

// Instance globale du service
export const apiService = new SynchronizedApiService();

// Export des endpoints pour faciliter l'utilisation
export { API_ENDPOINTS, API_BASE_URL };

// Helper functions pour les endpoints courants
export const endpoints = {
  // Exemple d'utilisation des endpoints synchronisés
  users: '/users',
  exercises: '/exercises',
  sessions: '/sessions',
  // Ces valeurs seront remplacées par les vraies lors de la synchronisation
};

// Types d'assistance pour TypeScript
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default apiService;
