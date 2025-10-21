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
        .grammar-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .grammar-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15) !important;
        }
        .grammar-card.selected {
          border-color: #fbbf24 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #fbbf24' }}>
        <Modal.Title style={{ color: '#d97706', fontWeight: '600' }}>
          Configuration Grammaire - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <Form>
          {/* Grammar Types Selection */}
          <div className="mb-3">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-check-circle me-2" style={{ color: '#fbbf24' }}></i>
              Types d'exercices de grammaire
            </h6>
            
            <Row className="g-3">
              {grammarTypes.map(type => (
                <Col md={6} key={type.key}>
                  <div 
                    className={`grammar-card p-3 border ${selectedTypes.includes(type.key) ? 'selected' : ''}`}
                    style={{ 
                      border: selectedTypes.includes(type.key) ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                    onClick={() => toggleType(type.key)}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div 
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: selectedTypes.includes(type.key) ? '2px solid #fbbf24' : '2px solid #d1d5db',
                            background: selectedTypes.includes(type.key) ? '#fbbf24' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            marginRight: '0.75rem',
                            flexShrink: 0
                          }}
                        >
                          {selectedTypes.includes(type.key) && (
                            <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                          )}
                        </div>
                        <span className="fw-medium" style={{ 
                          color: selectedTypes.includes(type.key) ? '#d97706' : '#374151',
                          fontSize: '0.95rem'
                        }}>
                          {type.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            
            <div className="mt-3 p-2" style={{ 
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <small style={{ color: '#92400e' }}>
                <i className="bi bi-list-check me-1"></i>
                <strong>Sélectionnés:</strong> {selectedTypes.length > 0 
                  ? grammarTypes.filter(t => selectedTypes.includes(t.key)).map(t => t.label).join(", ")
                  : "Aucun exercice sélectionné"
                }
              </small>
            </div>
          </div>

        </Form>
      </Modal.Body>
      
      <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
        <Button 
          variant="outline-secondary" 
          onClick={handleReset}
          style={{
            borderRadius: '8px',
            fontWeight: '500'
          }}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Réinitialiser
        </Button>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          style={{
            borderRadius: '8px',
            fontWeight: '500'
          }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          disabled={selectedTypes.length === 0}
          style={{
            background: selectedTypes.length > 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedTypes.length > 0 ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Valider les paramètres
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
