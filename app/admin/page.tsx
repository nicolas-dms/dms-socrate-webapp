"use client";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert, Badge, Form, Accordion, Table, Modal } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

interface OpenAPISync {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  schemaInfo: {
    version?: string;
    title?: string;
    paths?: number;
    schemas?: number;
  } | null;
}

interface SystemInfo {
  environment: string;
  version: string;
  nodeVersion: string;
  buildTime: string;
}

export default function AdminPage() {
  const { user, refreshUser } = useAuth();
  const [openAPISync, setOpenAPISync] = useState<OpenAPISync>({
    lastSync: null,
    status: 'idle',
    message: '',
    schemaInfo: null
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    environment: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    version: '1.0.0',
    nodeVersion: process.version || 'unknown',
    buildTime: new Date().toISOString()
  });

  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [rawJsonData, setRawJsonData] = useState<string>('');

  // Charger les informations sauvegardées au montage
  useEffect(() => {
    const saved = localStorage.getItem('admin-openapi-sync');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenAPISync(parsed);
      } catch (e) {
        console.error('Error parsing saved sync data:', e);
      }
    }

    const savedUrl = localStorage.getItem('admin-backend-url');
    if (savedUrl) {
      setBackendUrl(savedUrl);
    }
  }, []);

  // Sauvegarder les changements
  const saveData = (data: OpenAPISync) => {
    localStorage.setItem('admin-openapi-sync', JSON.stringify(data));
    localStorage.setItem('admin-backend-url', backendUrl);
  };

  const syncOpenAPI = async () => {
    setOpenAPISync(prev => ({ ...prev, status: 'syncing', message: 'Synchronisation en cours...' }));

    try {
      const response = await fetch(`${backendUrl}/openapi.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Analyser les informations du schéma
      const schemaInfo = {
        version: data.info?.version || 'N/A',
        title: data.info?.title || 'N/A',
        paths: Object.keys(data.paths || {}).length,
        schemas: Object.keys(data.components?.schemas || {}).length
      };

      // Sauvegarder le fichier dans le localStorage (ou vous pourriez l'envoyer à votre API)
      localStorage.setItem('openapi-schema', JSON.stringify(data, null, 2));
      setRawJsonData(JSON.stringify(data, null, 2));

      const newSyncData = {
        lastSync: new Date().toISOString(),
        status: 'success' as const,
        message: `Synchronisation réussie. ${schemaInfo.paths} endpoints, ${schemaInfo.schemas} schémas.`,
        schemaInfo
      };

      setOpenAPISync(newSyncData);
      saveData(newSyncData);

    } catch (error: any) {
      const errorSyncData = {
        ...openAPISync,
        status: 'error' as const,
        message: `Erreur: ${error.message}`
      };
      
      setOpenAPISync(errorSyncData);
      saveData(errorSyncData);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('openapi-schema');
    localStorage.removeItem('admin-openapi-sync');
    setOpenAPISync({
      lastSync: null,
      status: 'idle',
      message: '',
      schemaInfo: null
    });
  };

  // Nouvelle fonction pour nettoyer l'auth cache
  const clearAuthCache = async () => {
    try {
      // Nettoyer le token et forcer une déconnexion locale
      authService.clearAuth();
      
      // Nettoyer le localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-data');
      
      // Rafraîchir l'utilisateur pour forcer le rechargement des données mock
      await refreshUser();
      
      alert('Cache d\'authentification vidé avec succès !');
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache auth:', error);
      alert('Erreur lors du nettoyage du cache auth');
    }
  };

  const exportSchema = () => {
    const schema = localStorage.getItem('openapi-schema');
    if (schema) {
      const blob = new Blob([schema], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openapi-schema-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const viewRawJson = () => {
    const schema = localStorage.getItem('openapi-schema');
    if (schema) {
      setRawJsonData(schema);
      setShowJsonModal(true);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'syncing': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <ProtectedPage>
      <Container className="mt-4">
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="text-muted">🔧 Administration</h2>
              <Badge bg="warning">ADMIN ONLY</Badge>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Accordion defaultActiveKey="0">
              {/* Section OpenAPI */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <div className="d-flex align-items-center gap-2">
                    <span>🔄 Synchronisation OpenAPI</span>
                    <Badge bg={getStatusVariant(openAPISync.status)}>
                      {openAPISync.status}
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Card>
                    <Card.Body>
                      <Row className="mb-3">
                        <Col md={8}>
                          <Form.Group>
                            <Form.Label>URL du Backend</Form.Label>
                            <Form.Control
                              type="url"
                              value={backendUrl}
                              onChange={(e) => setBackendUrl(e.target.value)}
                              placeholder="http://localhost:8000"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                          <Button 
                            variant="primary" 
                            onClick={syncOpenAPI}
                            disabled={openAPISync.status === 'syncing'}
                            className="w-100"
                          >
                            {openAPISync.status === 'syncing' ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Sync...
                              </>
                            ) : (
                              '🔄 Synchroniser'
                            )}
                          </Button>
                        </Col>
                      </Row>

                      {openAPISync.message && (
                        <Alert variant={getStatusVariant(openAPISync.status)}>
                          {openAPISync.message}
                        </Alert>
                      )}

                      {openAPISync.schemaInfo && (
                        <div className="mb-3">
                          <h6>Informations du schéma :</h6>
                          <Table size="sm" striped>
                            <tbody>
                              <tr>
                                <td><strong>Titre</strong></td>
                                <td>{openAPISync.schemaInfo.title}</td>
                              </tr>
                              <tr>
                                <td><strong>Version</strong></td>
                                <td>{openAPISync.schemaInfo.version}</td>
                              </tr>
                              <tr>
                                <td><strong>Endpoints</strong></td>
                                <td>{openAPISync.schemaInfo.paths}</td>
                              </tr>
                              <tr>
                                <td><strong>Schémas</strong></td>
                                <td>{openAPISync.schemaInfo.schemas}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                      )}

                      {openAPISync.lastSync && (
                        <div className="mb-3">
                          <small className="text-muted">
                            Dernière synchronisation : {new Date(openAPISync.lastSync).toLocaleString('fr-FR')}
                          </small>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={viewRawJson}>
                          📄 Voir JSON
                        </Button>
                        <Button variant="outline-success" size="sm" onClick={exportSchema}>
                          💾 Exporter
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={clearCache}>
                          🗑️ Vider cache
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Accordion.Body>
              </Accordion.Item>

              {/* Section Système */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>📊 Informations Système</Accordion.Header>
                <Accordion.Body>
                  <Table striped>
                    <tbody>
                      <tr>
                        <td><strong>Environnement</strong></td>
                        <td>{systemInfo.environment}</td>
                      </tr>
                      <tr>
                        <td><strong>Version App</strong></td>
                        <td>{systemInfo.version}</td>
                      </tr>
                      <tr>
                        <td><strong>Node.js</strong></td>
                        <td>{systemInfo.nodeVersion}</td>
                      </tr>
                      <tr>
                        <td><strong>Build Time</strong></td>
                        <td>{new Date(systemInfo.buildTime).toLocaleString('fr-FR')}</td>
                      </tr>
                      <tr>
                        <td><strong>User Agent</strong></td>
                        <td style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Accordion.Body>
              </Accordion.Item>

              {/* Section Storage */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>💾 Local Storage</Accordion.Header>
                <Accordion.Body>
                  <div className="d-flex gap-2 mb-3">
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                    >
                      🗑️ Vider tout le storage
                    </Button>
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => {
                        const data = { ...localStorage };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `localstorage-backup-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      💾 Exporter storage
                    </Button>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>Clés stockées :</strong>
                    <ul className="mt-2">
                      {typeof window !== 'undefined' && Object.keys(localStorage).map(key => (
                        <li key={key} className="text-muted">
                          {key} ({Math.round(localStorage.getItem(key)?.length || 0 / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              {/* Section Authentification */}
              <Accordion.Item eventKey="3">
                <Accordion.Header>🔐 Authentification & Cache</Accordion.Header>
                <Accordion.Body>
                  <div className="mb-3">
                    <h6>Utilisateur actuel :</h6>
                    <Table size="sm" striped>
                      <tbody>
                        <tr>
                          <td><strong>Email</strong></td>
                          <td>{user?.email || 'Non connecté'}</td>
                        </tr>
                        <tr>
                          <td><strong>Nom</strong></td>
                          <td>{user?.username || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>ID</strong></td>
                          <td style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                            {user?.user_id || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Token présent</strong></td>
                          <td>
                            <Badge bg={authService.isAuthenticated() ? 'success' : 'danger'}>
                              {authService.isAuthenticated() ? 'Oui' : 'Non'}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={clearAuthCache}
                    >
                      🧹 Vider cache auth
                    </Button>
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={async () => {
                        try {
                          await refreshUser();
                          alert('Utilisateur rafraîchi !');
                        } catch (error) {
                          alert('Erreur lors du rafraîchissement');
                        }
                      }}
                    >
                      🔄 Rafraîchir user
                    </Button>
                  </div>

                  <Alert variant="info" className="mt-3 mb-0">
                    <small>
                      <strong>Note:</strong> Si vous voyez encore l'ancien email, utilisez "Vider cache auth" 
                      puis "Rafraîchir user" pour forcer la mise à jour des données mock.
                    </small>
                  </Alert>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>

          <Col lg={4}>
            <Card className="sticky-top">
              <Card.Header>
                <h6 className="mb-0">🚀 Actions Rapides</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={syncOpenAPI}>
                    🔄 Sync OpenAPI
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => window.location.reload()}
                  >
                    🔄 Recharger page
                  </Button>
                  <Button 
                    variant="outline-info"
                    onClick={() => {
                      console.log('System Info:', systemInfo);
                      console.log('OpenAPI Sync:', openAPISync);
                      console.log('LocalStorage:', { ...localStorage });
                    }}
                  >
                    🐛 Log Debug Info
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal pour afficher le JSON */}
        <Modal show={showJsonModal} onHide={() => setShowJsonModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>OpenAPI Schema JSON</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '0.375rem',
              fontSize: '0.8rem',
              maxHeight: '70vh',
              overflow: 'auto'
            }}>
              {rawJsonData}
            </pre>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowJsonModal(false)}>
              Fermer
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                navigator.clipboard.writeText(rawJsonData);
                alert('JSON copié dans le presse-papier !');
              }}
            >
              📋 Copier
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
