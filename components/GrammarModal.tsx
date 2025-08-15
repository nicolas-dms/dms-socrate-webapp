"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';

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

const GRAMMAR_TYPES = {
  CP: [
    { key: "majuscules", label: "Majuscules et points" },
    { key: "genre", label: "Masculin/Féminin" },
    { key: "singulier_pluriel", label: "Singulier/Pluriel" }
  ],
  CE1: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "actif_passif", label: "Actif/Passif" },
    { key: "nombre", label: "Singulier-Pluriel" },
    { key: "genre", label: "Masculin/Féminin" },
    { key: "noms_propre_commun", label: "Noms Propres/Communs" },
    { key: "determinants", label: "Les déterminants" }
  ],
  CE2: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "nombre", label: "Singulier-Pluriel" },
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments" }
  ],
  CM1: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments du verbe" },
    { key: "propositions", label: "Propositions" }
  ],
  CM2: [
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments" },
    { key: "propositions", label: "Propositions indépendantes" },
    { key: "voix", label: "Voix active/passive" }
  ]
};

export default function GrammarModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: GrammarModalProps) {
  const { t } = useTranslation();
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exerciseModalities, setExerciseModalities] = useState<Record<string, ExerciceModalite>>({});
  
  useEffect(() => {
    if (initialParams) {
      setSelectedTypes(initialParams.types.split(","));
      // setExerciseModalities(initialParams.modalities || {}); // DISABLED FOR NOW
    } else {
      // Set defaults based on level
      setSelectedTypes(["sujet_verbe"]);
      // setExerciseModalities({}); // DISABLED FOR NOW
    }
  }, [initialParams, level]);

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
    setSelectedTypes(["sujet_verbe"]);
  };

  const currentTypes = GRAMMAR_TYPES[level as keyof typeof GRAMMAR_TYPES] || GRAMMAR_TYPES.CE1;

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
              {currentTypes.map(type => (
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
                  ? currentTypes.filter(t => selectedTypes.includes(t.key)).map(t => t.label).join(", ")
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
