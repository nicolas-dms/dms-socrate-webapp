"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface EcritureParams {
  exerciseTypes: string[];
}

interface EcritureModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: EcritureParams) => void;
  initialParams?: EcritureParams;
  level: string; // CP, CE1, CE2, CM1, CM2
}

export default function EcritureModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: EcritureModalProps) {
  const { t } = useTranslation();
  
  // Load ecriture exercises from configuration - memoized to prevent infinite loops
  const ecritureExercises = useMemo(() => formatExercisesForModal('ecriture', level), [level]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  useEffect(() => {
    if (initialParams && initialParams.exerciseTypes) {
      setSelectedTypes(initialParams.exerciseTypes);
    } else {
      // Set defaults based on level - start with empty selection
      setSelectedTypes([]);
    }
  }, [initialParams, level]);

  const toggleExerciseType = (typeKey: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeKey)
        ? prev.filter(t => t !== typeKey)
        : [...prev, typeKey]
    );
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un type d'exercice d'écriture");
      return;
    }

    const params: EcritureParams = {
      exerciseTypes: selectedTypes
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    setSelectedTypes([]);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .ecriture-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .ecriture-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15) !important;
        }
        .ecriture-card.selected {
          border-color: #fbbf24 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #fbbf24' }}>
        <Modal.Title style={{ color: '#d97706', fontWeight: '600' }}>
          Configuration Écriture - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <Form>
          {/* Exercise Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-list-check me-2" style={{ color: '#fbbf24' }}></i>
              Sélection du contenu
            </h6>
            
            <Row className="g-2 mb-3">
              {ecritureExercises.map(exercise => (
                <Col md={6} key={exercise.key}>
                  <div 
                    className={`ecriture-card p-3 border ${selectedTypes.includes(exercise.key) ? 'selected' : ''}`}
                    style={{ 
                      border: selectedTypes.includes(exercise.key) ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                      position: 'relative',
                      backgroundColor: 'white'
                    }}
                    onClick={() => toggleExerciseType(exercise.key)}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: selectedTypes.includes(exercise.key) ? '2px solid #fbbf24' : '2px solid #d1d5db',
                          background: selectedTypes.includes(exercise.key) ? '#fbbf24' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          marginRight: '0.75rem',
                          flexShrink: 0
                        }}
                      >
                        {selectedTypes.includes(exercise.key) && (
                          <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                        )}
                      </div>
                      <span className="fw-medium" style={{ 
                        color: selectedTypes.includes(exercise.key) ? '#d97706' : '#374151',
                        fontSize: '0.9rem'
                      }}>
                        {exercise.label}
                      </span>
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
                  ? ecritureExercises.filter(e => selectedTypes.includes(e.key)).map(e => e.label).join(", ")
                  : "Aucun exercice sélectionné"
                }
              </small>
            </div>
            
            {ecritureExercises.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Aucun exercice d'écriture disponible pour le niveau {level}
              </div>
            )}
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
