"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import { parcoursService, ParcoursConfig, PARCOURS_TEMPLATES } from "../../../services/parcoursService";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const subjects = [
  { key: "french", label: "Français" },
  { key: "math", label: "Mathématiques" }
];

const frenchTypes = [
  { key: "lecture", label: "Lecture" },
  { key: "comprehension", label: "Compréhension" },
  { key: "grammaire", label: "Grammaire" },
  { key: "conjugaison", label: "Conjugaison" },
  { key: "vocabulaire", label: "Vocabulaire" },
  { key: "orthographe", label: "Orthographe" }
];

const mathTypes = [
  { key: "numeration", label: "Numération" },
  { key: "calcul", label: "Calcul" },
  { key: "geometrie", label: "Géométrie" },
  { key: "mesures", label: "Grandeurs et mesures" },
  { key: "problemes", label: "Résolution de problèmes" }
];

export default function ParcoursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [config, setConfig] = useState<ParcoursConfig>({
    name: "",
    level: "CE1",
    subject: "french",
    exerciseTypes: [],
    numberOfFiches: 8,
    specificRequirements: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Load template data if templateId is provided
  useEffect(() => {
    if (templateId) {
      const template = PARCOURS_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setConfig({
          templateId: template.id,
          name: template.name,
          level: template.level,
          subject: template.subject,
          exerciseTypes: [...template.exerciseTypes],
          numberOfFiches: template.estimatedWeeks * template.estimatedFichesPerWeek,
          specificRequirements: ""
        });
      }
    }
  }, [templateId]);

  const currentExerciseTypes = config.subject === "french" ? frenchTypes : mathTypes;

  const handleExerciseTypeToggle = (type: string) => {
    setConfig(prev => ({
      ...prev,
      exerciseTypes: prev.exerciseTypes.includes(type)
        ? prev.exerciseTypes.filter(t => t !== type)
        : [...prev.exerciseTypes, type]
    }));
  };

  const handleGenerate = async () => {
    if (!config.name.trim()) {
      setMessage({ type: 'danger', text: 'Veuillez saisir un nom pour votre parcours' });
      return;
    }

    if (config.exerciseTypes.length === 0) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner au moins un type d\'exercice' });
      return;
    }

    setIsGenerating(true);
    setMessage(null);

    try {
      const result = await parcoursService.generateParcours(config);
      setMessage({ 
        type: result.success ? 'success' : 'danger', 
        text: result.message 
      });
      
      if (result.success) {
        // Reset form after successful generation
        setTimeout(() => {
          router.push('/generate/french');
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating parcours:', error);
      setMessage({ 
        type: 'danger', 
        text: 'Erreur lors de la génération du parcours. Veuillez réessayer.' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isValid = config.name.trim() && config.exerciseTypes.length > 0;
  const preselectedTemplate = templateId ? PARCOURS_TEMPLATES.find(t => t.id === templateId) : null;

  return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
                <i className="bi bi-collection me-2"></i>
                {preselectedTemplate ? `Configuration - ${preselectedTemplate.name}` : 'Créer un Parcours Personnalisé'}
              </h2>
              <hr className="w-25 mx-auto mt-3 mb-4" style={{ height: '2px', background: 'linear-gradient(90deg, #6c757d, #adb5bd)', border: 'none', borderRadius: '1px' }} />
              <p className="text-muted">
                Configurez votre parcours pour générer plusieurs fiches d'exercices en une fois
              </p>
            </div>

            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                {preselectedTemplate && (
                  <Alert variant="info" className="mb-4">
                    <h6 className="fw-bold mb-2">
                      <i className={`bi ${preselectedTemplate.icon} me-2`}></i>
                      {preselectedTemplate.name}
                    </h6>
                    <p className="mb-2">{preselectedTemplate.description}</p>
                    <small>
                      Estimation : {preselectedTemplate.estimatedWeeks} semaines • {preselectedTemplate.estimatedFichesPerWeek} fiches/semaine
                    </small>
                  </Alert>
                )}

                {message && (
                  <Alert variant={message.type} className="mb-4">
                    {message.text}
                  </Alert>
                )}

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom du parcours</Form.Label>
                        <Form.Control
                          type="text"
                          value={config.name}
                          onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Révision grammaire CE1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Niveau</Form.Label>
                        <Form.Select
                          value={config.level}
                          onChange={(e) => setConfig(prev => ({ ...prev, level: e.target.value }))}
                          disabled={!!preselectedTemplate}
                        >
                          {levels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre de fiches</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          max={50}
                          value={config.numberOfFiches}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            numberOfFiches: parseInt(e.target.value) || 1 
                          }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Matière</Form.Label>
                    <div className="d-flex gap-2">
                      {subjects.map(subject => (
                        <Button
                          key={subject.key}
                          variant={config.subject === subject.key ? "primary" : "outline-primary"}
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              subject: subject.key as 'french' | 'math',
                              exerciseTypes: [] // Reset exercise types when changing subject
                            }));
                          }}
                          disabled={!!preselectedTemplate}
                        >
                          {subject.label}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Types d'exercices</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {currentExerciseTypes.map(type => (
                        <Button
                          key={type.key}
                          variant={config.exerciseTypes.includes(type.key) ? "primary" : "outline-primary"}
                          size="sm"
                          onClick={() => handleExerciseTypeToggle(type.key)}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Exigences spécifiques (optionnel)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={config.specificRequirements}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        specificRequirements: e.target.value 
                      }))}
                      placeholder="Ex: Insister sur les verbes du 3ème groupe, utiliser des textes sur les animaux..."
                    />
                  </Form.Group>

                  <div className="text-center">
                    <Button 
                      variant="secondary" 
                      className="me-3"
                      onClick={() => router.back()}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Retour
                    </Button>
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleGenerate}
                      disabled={!isValid || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <i className="bi bi-hourglass-split me-2"></i>
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-play-circle me-2"></i>
                          Générer le Parcours ({config.numberOfFiches} fiches)
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedPage>
  );
}
