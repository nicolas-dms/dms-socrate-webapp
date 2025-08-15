"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';

export interface VocabularyParams {
  words: string;
  theme: string;
  modalities?: Record<string, ExerciceModalite>; // New: store modality for each theme
}

interface VocabularyModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: VocabularyParams) => void;
  initialParams?: VocabularyParams;
  level: string; // CE1, CE2, etc.
}

const VOCABULARY_THEMES = {
  CP: [
    { key: "animaux", label: "Les animaux" },
    { key: "couleurs", label: "Les couleurs" },
    { key: "famille", label: "La famille" },
    { key: "corps", label: "Le corps humain" }
  ],
  CE1: [
    { key: "ecole", label: "L'école" },
    { key: "maison", label: "La maison" },
    { key: "animaux", label: "Les animaux" },
    { key: "nourriture", label: "La nourriture" },
    { key: "vetements", label: "Les vêtements" }
  ],
  CE2: [
    { key: "nature", label: "La nature" },
    { key: "ville", label: "La ville" },
    { key: "metiers", label: "Les métiers" },
    { key: "transport", label: "Les transports" },
    { key: "emotions", label: "Les émotions" }
  ],
  CM1: [
    { key: "sciences", label: "Les sciences" },
    { key: "histoire", label: "L'histoire" },
    { key: "geographie", label: "La géographie" },
    { key: "arts", label: "Les arts" },
    { key: "sport", label: "Le sport" }
  ],
  CM2: [
    { key: "litterature", label: "La littérature" },
    { key: "philosophie", label: "La philosophie" },
    { key: "societe", label: "La société" },
    { key: "environnement", label: "L'environnement" },
    { key: "technologie", label: "La technologie" }
  ]
};

export default function VocabularyModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: VocabularyModalProps) {
  const { t } = useTranslation();
  
  const [customWords, setCustomWords] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [useCustomWords, setUseCustomWords] = useState(false);
  const [exerciseModalities, setExerciseModalities] = useState<Record<string, ExerciceModalite>>({});
  
  const handleModalityChange = (themeKey: string, modality: ExerciceModalite) => {
    setExerciseModalities(prev => ({
      ...prev,
      [themeKey]: modality
    }));
  };

  const getCurrentModality = (themeKey: string): ExerciceModalite => {
    return exerciseModalities[themeKey] || getDefaultModalityForType('vocabulaire', level);
  };
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      if (initialParams.words && !initialParams.theme) {
        setUseCustomWords(true);
        setCustomWords(initialParams.words);
        setSelectedTheme("");
      } else {
        setUseCustomWords(false);
        setCustomWords("");
        setSelectedTheme(initialParams.theme || "");
      }
      // setExerciseModalities(initialParams.modalities || {}); // DISABLED FOR NOW
    } else {
      // Set defaults
      setUseCustomWords(false);
      setCustomWords("");
      setSelectedTheme("animaux");
      // setExerciseModalities({}); // DISABLED FOR NOW
    }
  }, [initialParams, level]);

  const toggleTheme = (themeKey: string) => {
    if (useCustomWords) return;
    setSelectedTheme(themeKey);
  };

  const handleSave = () => {
    let wordsValue = "";
    let themeValue = "";

    if (useCustomWords) {
      if (!customWords.trim()) {
        alert("Veuillez saisir des mots personnalisés ou sélectionner un thème");
        return;
      }
      wordsValue = customWords.trim();
      themeValue = "";
    } else {
      if (!selectedTheme) {
        alert("Veuillez sélectionner un thème de vocabulaire");
        return;
      }
      wordsValue = "";
      themeValue = selectedTheme;
    }

    const params: VocabularyParams = {
      words: wordsValue,
      theme: themeValue
      // modalities: exerciseModalities // DISABLED FOR NOW - always use default
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    setUseCustomWords(false);
    setCustomWords("");
    setSelectedTheme("animaux");
  };

  const currentThemes = VOCABULARY_THEMES[level as keyof typeof VOCABULARY_THEMES] || VOCABULARY_THEMES.CE1;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .selector-card {
          transition: all 0.3s ease;
        }
        .selector-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-spell-check me-2"></i>
          Configuration de l'exercice de vocabulaire - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          {/* Theme vs Custom Words Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Sélection du vocabulaire
            </h6>
            
            <Form.Check
              type="radio"
              name="vocabChoice"
              id="themes"
              label="Choisir par thème"
              checked={!useCustomWords}
              onChange={() => setUseCustomWords(false)}
              className="mb-3"
            />
            
            {!useCustomWords && (
              <Row className="mb-3">
                {currentThemes.map(theme => (
                  <Col md={6} key={theme.key} className="mb-3">
                    <div 
                      className={`selector-card p-3 border rounded ${
                        selectedTheme === theme.key 
                          ? 'border-warning-subtle bg-warning-subtle text-dark' 
                          : 'border-secondary bg-light'
                      }`}
                      style={{ 
                        border: selectedTheme === theme.key ? '2px solid #ffc107' : '1px solid #dee2e6',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div 
                        className="d-flex align-items-center justify-content-between mb-2"
                        onClick={() => toggleTheme(theme.key)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="fw-medium">{theme.label}</span>
                        <input 
                          type="radio" 
                          name="themeSelection"
                          checked={selectedTheme === theme.key}
                          onChange={() => toggleTheme(theme.key)}
                          className="ms-2"
                        />
                      </div>
                      
                      {/* Modality selector - HIDDEN FOR NOW but structure kept for future use */}
                      {false && selectedTheme === theme.key && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted mb-1 d-block">Format :</small>
                          <Dropdown className="w-100">
                            <Dropdown.Toggle 
                              variant="outline-secondary"
                              size="sm"
                              className="w-100 text-start d-flex justify-content-between align-items-center"
                            >
                              <span>{formatModalityLabel(getCurrentModality(theme.key))}</span>
                              {getCurrentModality(theme.key) === getDefaultModalityForType('vocabulaire', level) && (
                                <small className="text-primary ms-1">(recommandé)</small>
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                              {getAvailableModalitiesForType('vocabulaire').map((modality) => (
                                <Dropdown.Item
                                  key={modality}
                                  onClick={() => handleModalityChange(theme.key, modality)}
                                  active={modality === getCurrentModality(theme.key)}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <span>{formatModalityLabel(modality)}</span>
                                  {modality === getDefaultModalityForType('vocabulaire', level) && (
                                    <small className="text-primary">
                                      <i className="bi bi-star-fill"></i>
                                    </small>
                                  )}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            
            <Form.Check
              type="radio"
              name="vocabChoice"
              id="custom"
              label="Mots personnalisés"
              checked={useCustomWords}
              onChange={() => setUseCustomWords(true)}
              className="mb-3"
            />
            
            {useCustomWords && (
              <Form.Group className="mb-3">
                <Form.Label>Mots de vocabulaire (séparés par des virgules)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="maison, école, livre, chien, chat, jardin, voiture..."
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Saisissez les mots de vocabulaire, séparés par des virgules
                </Form.Text>
              </Form.Group>
            )}
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleReset}>
          <i className="fas fa-undo me-2"></i>
          Réinitialiser
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <i className="fas fa-save me-2"></i>
          Valider les paramètres
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
