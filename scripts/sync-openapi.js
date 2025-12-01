#!/usr/bin/env node

/**
 * Script de synchronisation OpenAPI
 * 
 * Ce script récupère le schéma OpenAPI depuis le backend et le sauvegarde
 * dans le dossier du frontend pour maintenir la cohérence des appels API.
 * 
 * Usage:
 *   node scripts/sync-openapi.js
 *   npm run sync-api
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  // URL du backend OpenAPI
  backendUrl: 'http://localhost:8000/openapi.json',
  
  // Dossier de destination dans le frontend
  outputDir: path.join(__dirname, '..', 'api-schema'),
  
  // Nom du fichier de sortie
  outputFile: 'openapi.json',
  
  // Fichier TypeScript généré (optionnel)
  typesFile: 'api-types.ts',
  
  // Timeout pour les requêtes (en ms)
  timeout: 10000
};

/**
 * Fonction utilitaire pour faire une requête HTTP/HTTPS
 */
function fetchOpenApiSchema(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const httpModule = isHttps ? https : http;
    
    console.log(`🔄 Récupération du schéma OpenAPI depuis: ${url}`);
    
    const request = httpModule.get(url, {
      timeout: CONFIG.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Frontend-API-Sync/1.0'
      }
    }, (response) => {
      let data = '';
      
      // Vérification du code de statut
      if (response.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      // Vérification du type de contenu
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        reject(new Error(`Type de contenu invalide: ${contentType}. Attendu: application/json`));
        return;
      }
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Schéma OpenAPI récupéré avec succès (${data.length} caractères)`);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Erreur de parsing JSON: ${error.message}`));
        }
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout: Aucune réponse reçue après ${CONFIG.timeout}ms`));
    });
    
    request.on('error', (error) => {
      reject(new Error(`Erreur de connexion: ${error.message}`));
    });
  });
}

/**
 * Crée le dossier de destination s'il n'existe pas
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`📁 Dossier créé: ${CONFIG.outputDir}`);
  }
}

/**
 * Sauvegarde le schéma OpenAPI
 */
function saveOpenApiSchema(schema) {
  const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
  const formattedSchema = JSON.stringify(schema, null, 2);
  
  fs.writeFileSync(outputPath, formattedSchema, 'utf8');
  console.log(`💾 Schéma OpenAPI sauvegardé: ${outputPath}`);
  
  // Affichage des informations du schéma
  const info = schema.info || {};
  console.log(`📋 Informations du schéma:`);
  console.log(`   - Titre: ${info.title || 'Non spécifié'}`);
  console.log(`   - Version: ${info.version || 'Non spécifiée'}`);
  console.log(`   - Description: ${info.description || 'Non spécifiée'}`);
  
  // Compte des endpoints
  const paths = schema.paths || {};
  const endpointCount = Object.keys(paths).length;
  console.log(`   - Nombre d'endpoints: ${endpointCount}`);
  
  return outputPath;
}

/**
 * Génère des types TypeScript basiques (optionnel)
 */
function generateBasicTypes(schema) {
  const typesPath = path.join(CONFIG.outputDir, CONFIG.typesFile);
  
  let typesContent = `// Types générés automatiquement depuis le schéma OpenAPI
// Généré le: ${new Date().toISOString()}
// Source: ${CONFIG.backendUrl}

export interface ApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiSchema {
  openapi: string;
  info: ApiInfo;
  paths: Record<string, any>;
  components?: Record<string, any>;
}

// Schéma complet exporté
export const API_SCHEMA: OpenApiSchema = `;
  
  typesContent += JSON.stringify(schema, null, 2);
  typesContent += ';\n';
  
  // Ajout de constantes utiles
  const paths = schema.paths || {};
  const endpoints = Object.keys(paths);
  
  typesContent += `
// Endpoints disponibles
export const API_ENDPOINTS = {
${endpoints.map(endpoint => `  '${endpoint.replace(/\//g, '_').toUpperCase()}': '${endpoint}'`).join(',\n')}
} as const;

// URL de base (à configurer selon votre environnement)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
`;
  
  fs.writeFileSync(typesPath, typesContent, 'utf8');
  console.log(`🔧 Types TypeScript générés: ${typesPath}`);
  
  return typesPath;
}

/**
 * Génère un fichier de métadonnées
 */
function generateMetadata(schema) {
  const metadataPath = path.join(CONFIG.outputDir, 'metadata.json');
  
  const metadata = {
    lastSync: new Date().toISOString(),
    backendUrl: CONFIG.backendUrl,
    version: schema.info?.version || 'unknown',
    title: schema.info?.title || 'API',
    endpointCount: Object.keys(schema.paths || {}).length,
    hash: require('crypto').createHash('md5').update(JSON.stringify(schema)).digest('hex')
  };
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`📊 Métadonnées sauvegardées: ${metadataPath}`);
  
  return metadata;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage de la synchronisation OpenAPI...\n');
    
    // Vérification de la connectivité backend
    console.log('🔍 Vérification de la connectivité backend...');
    
    // Récupération du schéma
    const schema = await fetchOpenApiSchema(CONFIG.backendUrl);
    
    // Validation basique du schéma
    if (!schema.openapi && !schema.swagger) {
      throw new Error('Le fichier récupéré ne semble pas être un schéma OpenAPI/Swagger valide');
    }
    
    // Création du dossier de destination
    ensureOutputDirectory();
    
    // Sauvegarde du schéma
    const schemaPath = saveOpenApiSchema(schema);
    
    // Génération des types TypeScript
    const typesPath = generateBasicTypes(schema);
    
    // Génération des métadonnées
    const metadata = generateMetadata(schema);
    
    console.log('\n✅ Synchronisation terminée avec succès!');
    console.log(`📂 Fichiers générés dans: ${CONFIG.outputDir}`);
    console.log(`   - ${CONFIG.outputFile} (schéma OpenAPI)`);
    console.log(`   - ${CONFIG.typesFile} (types TypeScript)`);
    console.log(`   - metadata.json (métadonnées)`);
    
    // Suggestion d'utilisation
    console.log('\n💡 Utilisation suggérée:');
    console.log('   - Importez les types: import { API_ENDPOINTS, API_BASE_URL } from "./api-schema/api-types";');
    console.log('   - Utilisez les endpoints: fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS}`);');
    console.log('   - Ajoutez le script à vos tâches de build pour maintenir la synchronisation');
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:');
    console.error(`   ${error.message}`);
    
    // Suggestions de résolution
    console.log('\n🔧 Suggestions de résolution:');
    console.log('   1. Vérifiez que le backend est démarré sur http://localhost:8000');
    console.log('   2. Vérifiez que l\'endpoint /openapi.json est accessible');
    console.log('   3. Vérifiez votre connexion réseau');
    console.log(`   4. Testez manuellement: curl ${CONFIG.backendUrl}`);
    
    // Exit with 0 if we're in a Docker build or CI environment (backend not available)
    if (process.env.DOCKER_BUILD || process.env.CI || process.argv.includes('--optional')) {
      console.log('\n⚠️  Environnement de build détecté - continuant sans synchronisation API');
      process.exit(0);
    }
    
    process.exit(1);
  }
}

// Gestion des arguments de ligne de commande
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Script de synchronisation OpenAPI

Usage:
  node scripts/sync-openapi.js [options]

Options:
  --help, -h     Affiche cette aide
  --url <url>    URL personnalisée du backend (défaut: ${CONFIG.backendUrl})
  --output <dir> Dossier de sortie (défaut: ${CONFIG.outputDir})

Exemples:
  node scripts/sync-openapi.js
  node scripts/sync-openapi.js --url http://localhost:3001/openapi.json
  node scripts/sync-openapi.js --output ./src/api-schema
`);
  process.exit(0);
}

// Gestion de l'URL personnalisée
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  CONFIG.backendUrl = process.argv[urlIndex + 1];
}

// Gestion du dossier de sortie personnalisé
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1 && process.argv[outputIndex + 1]) {
  CONFIG.outputDir = path.resolve(process.argv[outputIndex + 1]);
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
