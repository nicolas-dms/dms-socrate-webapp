"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface GrammarParams {
  types: string;
  modalities?: Record<string, ExerciceModalite>; // New: store modality for each grammar exercise
}

interface GrammarModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: GrammarParams) => void;
  initialParams?: GrammarParams;
  level: string; // CE1, CE2, etc.
}

export default function GrammarModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: GrammarModalProps) {
  const { t } = useTranslation();
  
  // Load grammar types from configuration - memoized to prevent infinite loops
  const grammarTypes = useMemo(() => formatExercisesForModal('grammaire', level), [level]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exerciseModalities, setExerciseModalities] = useState<Record<string, ExerciceModalite>>({});
  
  useEffect(() => {
    if (initialParams) {
      setSelectedTypes(initialParams.types.split(","));
      // setExerciseModalities(initialParams.modalities || {}); // DISABLED FOR NOW
    } else {
      // Set default to first available grammar type for this level
      const defaultType = grammarTypes.length > 0 ? grammarTypes[0].key : "";
      setSelectedTypes(defaultType ? [defaultType] : []);
      // setExerciseModalities({}); // DISABLED FOR NOW
    }
  }, [initialParams, grammarTypes]);

  const toggleType = (typeKey: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeKey)
        ? prev.filter(t => t !== typeKey)
        : [...prev, typeKey]
    );
  };

  const handleModalityChange = (exerciseKey: string, modality: ExerciceModalite) => {
    setExerciseModalities(prev => ({
      ...prev,
      [exerciseKey]: modality
    }));
  };

  const getCurrentModality = (exerciseKey: string): ExerciceModalite => {
    return exerciseModalities[exerciseKey] || getDefaultModalityForType('grammaire', level);
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un type d'exercice de grammaire");
      return;
    }

    const params: GrammarParams = {
      types: selectedTypes.join(",")
      // modalities: exerciseModalities // DISABLED FOR NOW - always use default
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    const defaultType = grammarTypes.length > 0 ? grammarTypes[0].key : "";
    setSelectedTypes(defaultType ? [defaultType] : []);
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
          <i className="fas fa-book me-2"></i>
          Configuration de l'exercice de grammaire - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          {/* Grammar Types Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Types d'exercices de grammaire
            </h6>
            
            <Row>
              {grammarTypes.map(type => (
                <Col md={6} key={type.key} className="mb-3">
                  <div 
                    className={`selector-card p-3 border rounded ${
                      selectedTypes.includes(type.key) 
                        ? 'border-warning-subtle bg-warning-subtle text-dark' 
                        : 'border-secondary bg-light'
                    }`}
                    style={{ 
                      border: selectedTypes.includes(type.key) ? '2px solid #ffc107' : '1px solid #dee2e6',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div 
                      className="d-flex align-items-center justify-content-between mb-2"
                      onClick={() => toggleType(type.key)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="fw-medium">{type.label}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedTypes.includes(type.key)}
                        onChange={() => toggleType(type.key)}
                        className="ms-2"
                      />
                    </div>
                    
                    {/* Modality selector - HIDDEN FOR NOW but structure kept for future use */}
                    {false && selectedTypes.includes(type.key) && (
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted mb-1 d-block">Format :</small>
                        <Dropdown className="w-100">
                          <Dropdown.Toggle 
                            variant="outline-secondary"
                            size="sm"
                            className="w-100 text-start d-flex justify-content-between align-items-center"
                          >
                            <span>{formatModalityLabel(getCurrentModality(type.key))}</span>
                            {getCurrentModality(type.key) === getDefaultModalityForType('grammaire', level) && (
                              <small className="text-primary ms-1">(recommandé)</small>
                            )}
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100">
                            {getAvailableModalitiesForType('grammaire').map((modality) => (
                              <Dropdown.Item
                                key={modality}
                                onClick={() => handleModalityChange(type.key, modality)}
                                active={modality === getCurrentModality(type.key)}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <span>{formatModalityLabel(modality)}</span>
                                {modality === getDefaultModalityForType('grammaire', level) && (
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
            
            <div className="mt-2">
              <small className="text-muted">
                Sélectionnés: {selectedTypes.length > 0 
                  ? grammarTypes.filter(t => selectedTypes.includes(t.key)).map(t => t.label).join(", ")
                  : "Aucun"
                }
              </small>
            </div>
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
