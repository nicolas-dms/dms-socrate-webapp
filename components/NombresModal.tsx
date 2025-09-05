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
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-123 me-2"></i>
          Exercices de Nombres - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">
              Sélectionnez les exercices de nombres que vous souhaitez inclure
            </span>
            <Badge bg={getTotalSelected() >= exerciseLimit ? 'warning' : 'primary'}>
              {getTotalSelected()}/{exerciseLimit} exercices sélectionnés
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
                  className={`border rounded p-3 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                  style={{ 
                    cursor: wouldExceedLimit ? 'not-allowed' : 'pointer',
                    opacity: wouldExceedLimit ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => !wouldExceedLimit && toggleExercise(exercise.exercise)}
                >
                  <div className="d-flex align-items-start mb-2">
                    <div className="me-2">
                      {isSelected ? (
                        <i className="bi bi-check-circle-fill text-primary"></i>
                      ) : (
                        <i className="bi bi-circle text-muted"></i>
                      )}
                    </div>
                    <h6 className={`fw-bold mb-0 ${isSelected ? 'text-primary' : 'text-dark'}`}>
                      <i className="bi bi-123 me-2"></i>
                      {exercise.exercise}
                    </h6>
                  </div>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                    {exercise.contenu}
                  </p>
                  {wouldExceedLimit && (
                    <small className="text-warning d-block mt-2">
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
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={getTotalSelected() === 0}
        >
          <i className="bi bi-check me-2"></i>
          Valider ({getTotalSelected()} exercice{getTotalSelected() > 1 ? 's' : ''})
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
