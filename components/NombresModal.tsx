"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface NombresModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (selectedExercises: string[]) => void;
  level: string;
  initialSelections?: string[];
  exerciseLimit: number;
  currentTotalExercises: number;
  canAddMoreExercises: (domainKey?: string, additionalExercises?: number) => boolean;
  mathDomains?: any;
}

export default function NombresModal({ 
  show, 
  onHide, 
  onSave, 
  initialSelections,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  canAddMoreExercises,
  mathDomains
}: NombresModalProps) {
  const { t } = useTranslation();
  
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  // Initialize state with mathDomains data
  useEffect(() => {
    if (initialSelections) {
      setSelectedExercises([...initialSelections]);
    } else {
      setSelectedExercises([]);
    }
  }, [initialSelections, level, mathDomains]);

  // Get available exercises for current level
  const getAvailableExercises = () => {
    if (!mathDomains) return [];
    const domain = mathDomains.find((d: any) => d.key === "Nombres");
    return domain?.exercises[level] || [];
  };

  const toggleExercise = (exerciseName: string) => {
    const isSelected = selectedExercises.includes(exerciseName);
    
    if (!isSelected) {
      // Check if adding this exercise would exceed the limit
      if (canAddMoreExercises && !canAddMoreExercises("Nombres", 1)) {
        return; // Don't add if it would exceed the limit
      }
    }

    const newSelection = isSelected
      ? selectedExercises.filter(name => name !== exerciseName)
      : [...selectedExercises, exerciseName];

    setSelectedExercises(newSelection);
  };

  const handleSave = () => {
    onSave(selectedExercises);
  };

  const getTotalSelected = () => {
    return selectedExercises.length;
  };

  const canAddMore = () => {
    return canAddMoreExercises && canAddMoreExercises("Nombres", 1);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <style jsx>{`
        .nombres-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .nombres-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .nombres-card.selected {
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .nombres-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: '600' }}>
          Configuration Nombres - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ backgroundColor: 'white' }}>
        <div className="mb-3 p-3" style={{ 
          backgroundColor: '#eff6ff',
          borderRadius: '10px',
          border: '1px solid #93c5fd'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold" style={{ color: '#374151' }}>
              <i className="bi bi-info-circle me-2" style={{ color: '#3b82f6' }}></i>
              Sélectionnez les exercices de nombres
            </h6>
            <Badge style={{ 
              backgroundColor: getTotalSelected() >= exerciseLimit ? '#f59e0b' : '#3b82f6',
              fontSize: '0.85rem',
              padding: '0.4rem 0.7rem'
            }}>
              {getTotalSelected()}/{exerciseLimit} exercices
            </Badge>
          </div>
        </div>
        
        <Row className="g-3">
          {getAvailableExercises().map((exercise: any, index: number) => {
            const isSelected = selectedExercises.includes(exercise.exercise);
            const wouldExceedLimit = !isSelected && !canAddMore();
            
            return (
              <Col key={exercise.exercise} xl={4} lg={6} md={6}>
                <div 
                  className={`nombres-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${wouldExceedLimit ? 'disabled' : ''}`}
                  style={{ 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: 'white'
                  }}
                  onClick={() => !wouldExceedLimit && toggleExercise(exercise.exercise)}
                >
                  <div className="d-flex align-items-start mb-2">
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #3b82f6' : '2px solid #d1d5db',
                        background: isSelected ? '#3b82f6' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        marginRight: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && (
                        <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                      )}
                    </div>
                    <h6 className="fw-semibold mb-0" style={{ 
                      fontSize: '0.9rem',
                      color: isSelected ? '#1d4ed8' : '#374151'
                    }}>
                      {exercise.exercise}
                    </h6>
                  </div>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.3', paddingLeft: '2rem' }}>
                    {exercise.contenu}
                  </p>
                  {wouldExceedLimit && (
                    <small className="d-block mt-2" style={{ color: '#f59e0b', paddingLeft: '2rem' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Limite atteinte
                    </small>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
        
        {getAvailableExercises().length === 0 && (
          <div className="text-center py-4">
            <div className="text-muted">
              <i className="bi bi-info-circle fs-1 mb-3 d-block"></i>
              Aucun exercice de nombres disponible pour le niveau {level}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
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
          disabled={getTotalSelected() === 0}
          style={{
            background: getTotalSelected() > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: getTotalSelected() > 0 ? '0 4px 15px rgba(59, 130, 246, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Valider ({getTotalSelected()} exercice{getTotalSelected() > 1 ? 's' : ''})
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
