"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface CalculParams {
  operations: string;
}

interface CalculModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: CalculParams) => void;
  level: string;
  initialParams?: CalculParams;
  exerciseLimit: number;
  currentTotalExercises: number;
  domainKey: string;
  canAddMoreExercises: (domainKey?: string, additionalExercises?: number) => boolean;
  mathDomains?: any; // Add this prop
}

export default function CalculModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "nombres-calcul",
  canAddMoreExercises,
  mathDomains
}: CalculModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // State for exercise selection
  const [selectedExercises, setSelectedExercises] = useState<string[]>(["calcul-mental"]);
  
  // Get exercises for current level and domain
  const getAvailableExercises = () => {
    if (!mathDomains) return [];
    
    // Always use "Calculs" domain since this modal is now specifically for calculations
    const domain = mathDomains.find((d: any) => d.key === "Calculs");
    if (!domain || !domain.exercises[level]) return [];
    
    return domain.exercises[level];
  };
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const exercises = initialParams.operations.split(",");
      setSelectedExercises(exercises);
    } else {
      // Reset to default for level - use first available exercise
      const availableExercises = getAvailableExercises();
      if (availableExercises.length > 0) {
        setSelectedExercises([availableExercises[0].exercise]);
      } else {
        setSelectedExercises(["calcul-mental"]);
      }
    }
  }, [initialParams, level]);

  // Don't render on server side
  if (!mounted) {
    return null;
  }

  const toggleExercise = (exercise: string) => {
    if (selectedExercises.includes(exercise)) {
      // Don't allow removing the last exercise
      if (selectedExercises.length > 1) {
        setSelectedExercises(selectedExercises.filter((ex: string) => ex !== exercise));
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleSave = () => {
    if (selectedExercises.length === 0) {
      return; // Validation: at least one exercise required
    }

    const params: CalculParams = {
      operations: selectedExercises.join(",")
    };

    onSave(params);
    onHide();
  };

  const getExerciseIcon = (exerciseKey: string) => {
    if (exerciseKey.includes("addition")) return "➕";
    if (exerciseKey.includes("soustraction")) return "➖";
    if (exerciseKey.includes("multiplication")) return "✖️";
    if (exerciseKey.includes("division")) return "➗";
    if (exerciseKey.includes("fraction")) return "½";
    if (exerciseKey.includes("probleme")) return "🧠";
    if (exerciseKey.includes("nombre")) return "🔢";
    if (exerciseKey.includes("calcul-mental")) return "�";
    return "📝";
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      backdrop="static"
      container={typeof document !== 'undefined' ? document.body : undefined}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calculator me-2"></i>
          Exercices de Calculs - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="mb-3">
          <h6 className="mb-2">Exercices disponibles pour {level}</h6>
          <p className="text-muted small">
            Sélectionnez les exercices de calculs que vous souhaitez inclure. Au moins un exercice doit être sélectionné.
          </p>
        </div>

        <div className="mb-3">
          <Row className="g-2">
            {getAvailableExercises().map((exercise: any, index: number) => {
              const isSelected = selectedExercises.includes(exercise.exercise);
              const wouldExceedLimit = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              const isDisabled = (isSelected && selectedExercises.length === 1) || wouldExceedLimit;
              
              return (
                <Col key={exercise.exercise} md={6} lg={4}>
                  <div 
                    className={`border rounded p-2 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle'} ${isDisabled ? '' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && toggleExercise(exercise.exercise)}
                    style={{ 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      minHeight: '80px'
                    }}
                    title={
                      isDisabled && isSelected && selectedExercises.length === 1 ? "Au moins un exercice doit être sélectionné" :
                      wouldExceedLimit ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                    }
                  >
                    <div className="d-flex align-items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        <span style={{ fontSize: '1rem' }}>
                          {getExerciseIcon(exercise.exercise)}
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className="fw-semibold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
                            {exercise.exercise}
                          </span>
                          {isSelected && <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '0.8rem' }}></i>}
                          {isDisabled && isSelected && selectedExercises.length === 1 && <i className="bi bi-lock-fill text-muted" style={{ fontSize: '0.8rem' }}></i>}
                          {wouldExceedLimit && <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '0.8rem' }}></i>}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                          {exercise.contenu.length > 60 ? exercise.contenu.substring(0, 60) + '...' : exercise.contenu}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>

        <div className="border-top pt-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Sélection actuelle</h6>
            <small className="text-muted">
              {selectedExercises.length} exercice{selectedExercises.length > 1 ? 's' : ''} sélectionné{selectedExercises.length > 1 ? 's' : ''}
            </small>
          </div>
          <div className="d-flex flex-wrap gap-1 mt-2">
            {selectedExercises.map((exerciseKey) => {
              const exerciseData = getAvailableExercises().find((ex: any) => ex.exercise === exerciseKey);
              return (
                <Badge key={exerciseKey} bg="primary" className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  {getExerciseIcon(exerciseKey)}
                  {exerciseData?.exercise || exerciseKey}
                </Badge>
              );
            })}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={selectedExercises.length === 0}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
