"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Badge, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface ConjugationParams {
  verbs: string;
  tenses: string;
  modalities?: Record<string, ExerciceModalite>; // Store modality for each tense
}

interface ConjugationModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: ConjugationParams) => void;
  initialParams?: ConjugationParams;
  level: string; // CE1, CE2, etc.
}

export default function ConjugationModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: ConjugationModalProps) {
  const { t } = useTranslation();
  
  // Load tenses and verb groups from configuration - memoized to prevent infinite loops
  const availableTenses = useMemo(() => 
    formatExercisesForModal('conjugaison', level),
    [level]
  );
  const availableVerbGroups = useMemo(() => 
    formatExercisesForModal('verb_groups', level),
    [level]
  );
  
  // State for verb selection
  const [selectedVerbGroups, setSelectedVerbGroups] = useState<string[]>([]);
  const [customVerbs, setCustomVerbs] = useState("");
  const [useCustomVerbs, setUseCustomVerbs] = useState(false);
  
  // State for tense selection
  const [selectedTenses, setSelectedTenses] = useState<string[]>([]);
  
  // State for modalities
  const [exerciseModalities, setExerciseModalities] = useState<Record<string, ExerciceModalite>>({});
  
  const handleModalityChange = (tenseKey: string, modality: ExerciceModalite) => {
    setExerciseModalities(prev => ({
      ...prev,
      [tenseKey]: modality
    }));
  };

  const getCurrentModality = (tenseKey: string): ExerciceModalite => {
    return exerciseModalities[tenseKey] || getDefaultModalityForType('conjugaison', level);
  };
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const verbs = initialParams.verbs;
      const tenses = initialParams.tenses.split(",");
      
      setSelectedTenses(tenses);
      
      // Check if it's custom verbs or groups
      if (verbs.includes(",") && !availableVerbGroups.some(g => verbs.includes(g.key))) {
        setUseCustomVerbs(true);
        setCustomVerbs(verbs);
        setSelectedVerbGroups([]);
      } else {
        setUseCustomVerbs(false);
        setCustomVerbs("");
        const groups = availableVerbGroups.filter(g => verbs.includes(g.key)).map(g => g.key);
        setSelectedVerbGroups(groups);
      }
    } else {
      // Set defaults based on level
      const defaultGroups = availableVerbGroups.length > 0 ? [availableVerbGroups[0].key] : [];
      const defaultTenses = availableTenses.length > 0 ? [availableTenses[0].key] : [];
      
      setSelectedVerbGroups(defaultGroups);
      setSelectedTenses(defaultTenses);
    }
  }, [initialParams, availableVerbGroups, availableTenses]);

  const toggleVerbGroup = (groupKey: string) => {
    if (useCustomVerbs) return;
    
    setSelectedVerbGroups(prev => 
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    );
  };

  const toggleTense = (tenseKey: string) => {
    setSelectedTenses(prev => 
      prev.includes(tenseKey)
        ? prev.filter(t => t !== tenseKey)
        : [...prev, tenseKey]
    );
  };

  const handleSave = () => {
    if (selectedTenses.length === 0) {
      alert("Veuillez sélectionner au moins un exercice de conjugaison");
      return;
    }

    let verbsValue: string;
    if (useCustomVerbs) {
      if (!customVerbs.trim()) {
        alert("Veuillez saisir des verbes personnalisés ou sélectionner des groupes");
        return;
      }
      verbsValue = customVerbs.trim();
    } else {
      if (selectedVerbGroups.length === 0) {
        alert("Veuillez sélectionner au moins un groupe de verbes");
        return;
      }
      verbsValue = selectedVerbGroups.join(",");
    }

    const params: ConjugationParams = {
      verbs: verbsValue,
      tenses: selectedTenses.join(",")
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    const defaultGroups = availableVerbGroups.length > 0 ? [availableVerbGroups[0].key] : [];
    const defaultTenses = availableTenses.length > 0 ? [availableTenses[0].key] : [];
    
    setSelectedVerbGroups(defaultGroups);
    setSelectedTenses(defaultTenses);
    setUseCustomVerbs(false);
    setCustomVerbs("");
  };

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
          <i className="fas fa-cog me-2 text-primary"></i>
          Configuration de l'exercice de conjugaison - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Form>
          {/* Tense Selection Section */}
          <div className="mb-3">
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
              <i className="fas fa-clock me-2"></i>
              Exercices de conjugaison
            </h6>
            
            <Row>
              {availableTenses.map(tense => (
                <Col md={6} key={tense.key} className="mb-2">
                  <div 
                    className={`selector-card p-2 border rounded ${
                        selectedTenses.includes(tense.key) 
                          ? 'border-warning-subtle bg-warning-subtle text-dark' 
                          : 'border-secondary bg-light'
                      }`}
                      style={{ 
                        border: selectedTenses.includes(tense.key) ? '2px solid #ffc107' : '1px solid #dee2e6',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div 
                        className="d-flex align-items-center justify-content-between"
                        onClick={() => toggleTense(tense.key)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{tense.label}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedTenses.includes(tense.key)}
                          onChange={() => toggleTense(tense.key)}
                          className="ms-2"
                        />
                      </div>
                      
                      {/* Modality selector - HIDDEN FOR NOW but structure kept for future use */}
                      {false && selectedTenses.includes(tense.key) && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted mb-1 d-block">Format :</small>
                          <Dropdown className="w-100">
                            <Dropdown.Toggle 
                              variant="outline-secondary"
                              size="sm"
                              className="w-100 text-start d-flex justify-content-between align-items-center"
                            >
                              <span>{formatModalityLabel(getCurrentModality(tense.key))}</span>
                              {getCurrentModality(tense.key) === getDefaultModalityForType('conjugaison', level) && (
                                <small className="text-primary ms-1">(recommandé)</small>
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                              {getAvailableModalitiesForType('conjugaison').map((modality) => (
                                <Dropdown.Item
                                  key={modality}
                                  onClick={() => handleModalityChange(tense.key, modality)}
                                  active={modality === getCurrentModality(tense.key)}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <span>{formatModalityLabel(modality)}</span>
                                  {modality === getDefaultModalityForType('conjugaison', level) && (
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
            
            <div className="mt-1">
              <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                Sélectionnés: {selectedTenses.length > 0 
                  ? availableTenses.filter(t => selectedTenses.includes(t.key)).map(t => t.label).join(", ")
                  : "Aucun"
                }
              </small>
            </div>
          </div>

          {/* Verb Selection Section */}
          <div className="mb-3">
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
              <i className="fas fa-list-ul me-2"></i>
              Sélection des verbes
            </h6>
            
            <Form.Check
              type="radio"
              name="verbChoice"
              id="groups"
              label="Choisir par groupes de verbes"
              checked={!useCustomVerbs}
              onChange={() => setUseCustomVerbs(false)}
              className="mb-2"
            />
            
            {!useCustomVerbs && (
              <Row className="mb-2">
                {availableVerbGroups.map(group => (
                  <Col md={12} key={group.key} className="mb-2">
                    <div 
                      className={`selector-card p-2 border rounded ${
                        selectedVerbGroups.includes(group.key) 
                          ? 'border-warning-subtle bg-warning-subtle' 
                          : 'border-secondary bg-light'
                      }`}
                      onClick={() => toggleVerbGroup(group.key)}
                      style={{ 
                        cursor: 'pointer',
                        border: selectedVerbGroups.includes(group.key) ? '2px solid #ffc107' : '1px solid #dee2e6',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{group.label}</strong>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{group.examples}</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            
            <Form.Check
              type="radio"
              name="verbChoice"
              id="custom"
              label="Verbes personnalisés"
              checked={useCustomVerbs}
              onChange={() => setUseCustomVerbs(true)}
              className="mb-2"
            />
            
            {useCustomVerbs && (
              <Form.Group className="mb-2">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="être, avoir, aller, faire, dire, voir, venir..."
                  value={customVerbs}
                  onChange={(e) => setCustomVerbs(e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Saisissez les verbes à l'infinitif, séparés par des virgules
                </Form.Text>
              </Form.Group>
            )}
          </div>
        </Form>
      </Modal.Body>      <Modal.Footer>
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
