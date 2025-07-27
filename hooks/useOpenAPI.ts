import { useState, useEffect } from 'react';
import { openAPIService, EndpointInfo } from '../services/openApiService';

interface UseOpenAPIResult {
  isLoaded: boolean;
  endpoints: EndpointInfo[];
  apiInfo: { title: string; version: string; description?: string } | null;
  totalEndpoints: number;
  totalSchemas: number;
  lastSync: string | null;
  refresh: () => void;
  findEndpoint: (operationId: string) => EndpointInfo | null;
  buildUrl: (basePath: string, endpointPath: string, params?: Record<string, any>) => string;
}

export const useOpenAPI = (): UseOpenAPIResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [endpoints, setEndpoints] = useState<EndpointInfo[]>([]);
  const [apiInfo, setApiInfo] = useState<{ title: string; version: string; description?: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadData = () => {
    const schema = openAPIService.loadSchema();
    setIsLoaded(schema !== null);
    
    if (schema) {
      setEndpoints(openAPIService.getEndpoints());
      setApiInfo(openAPIService.getApiInfo());
    }

    // Charger les infos de dernière sync
    try {
      const syncData = localStorage.getItem('admin-openapi-sync');
      if (syncData) {
        const parsed = JSON.parse(syncData);
        setLastSync(parsed.lastSync);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = () => {
    loadData();
  };

  const findEndpoint = (operationId: string): EndpointInfo | null => {
    return openAPIService.findEndpointByOperationId(operationId);
  };

  const buildUrl = (basePath: string, endpointPath: string, params?: Record<string, any>): string => {
    return openAPIService.buildEndpointUrl(basePath, endpointPath, params);
  };

  return {
    isLoaded,
    endpoints,
    apiInfo,
    totalEndpoints: endpoints.length,
    totalSchemas: Object.keys(openAPIService.getSchemas()).length,
    lastSync,
    refresh,
    findEndpoint,
    buildUrl
  };
};
