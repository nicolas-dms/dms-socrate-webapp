"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface GeometrieParams {
  types: string;
}

interface GeometrieModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: GeometrieParams) => void;
  level: string;
  initialParams?: GeometrieParams;
  exerciseLimit: number;
  currentTotalExercises: number;
  domainKey: string;
  canAddMoreExercises: (domainKey?: string, additionalExercises?: number) => boolean;
  mathDomains?: any; // Add this prop
}

export default function GeometrieModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "espace-geometrie",
  canAddMoreExercises,
  mathDomains
}: GeometrieModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Get exercises for current level and domain
  const getAvailableExercises = () => {
    if (!mathDomains) return [];
    
    const domain = mathDomains.find((d: any) => d.key === domainKey);
    if (!domain || !domain.exercises[level]) return [];
    
    return domain.exercises[level];
  };
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const types = initialParams.types.split(",");
      setSelectedTypes(types);
    } else {
      // Reset to default for level - use first available exercise
      const availableExercises = getAvailableExercises();
      if (availableExercises.length > 0) {
        setSelectedTypes([availableExercises[0].exercise]);
      } else {
        setSelectedTypes([]);
      }
    }
  }, [initialParams, level]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      // Don't allow removing the last type
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      return; // Validation: at least one type required
    }

    const params: GeometrieParams = {
      types: selectedTypes.join(",")
    };

    onSave(params);
    onHide();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "formes_simples": return "🔺";
      case "reconnaissance": return "👁️";
      case "polygones": return "⬡";
      case "lignes": return "📏";
      case "angles": return "📐";
      case "symetrie": return "🪞";
      case "perimetre": return "📦";
      case "aires": return "⬜";
      case "volumes": return "🧊";
      case "cercle": return "⭕";
      default: return "📐";
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-triangle me-2"></i>
          Configurer les exercices de géométrie - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="mb-3">
          <h6 className="mb-2">Exercices disponibles pour {level}</h6>
          <p className="text-muted small">
            Sélectionnez les exercices de géométrie que vous souhaitez inclure. Au moins un exercice doit être sélectionné.
          </p>
        </div>

        <div className="mb-3">
          <Row className="g-2">
            {getAvailableExercises().map((exercise: any, index: number) => {
              const isSelected = selectedTypes.includes(exercise.exercise);
              const canSelect = !isSelected && canAddMoreExercises && canAddMoreExercises(domainKey, 1);
              const cannotAddMore = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              const isDisabled = (isSelected && selectedTypes.length === 1) || cannotAddMore;
              
              return (
                <Col key={index} md={6} lg={4}>
                  <div 
                    className={`border rounded p-2 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : cannotAddMore ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary-subtle'} ${isDisabled ? '' : 'cursor-pointer'}`}
                    style={{ 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      minHeight: '80px'
                    }}
                    onClick={() => !isDisabled && toggleType(exercise.exercise)}
                    title={
                      isSelected && selectedTypes.length === 1 ? "Au moins un exercice doit être sélectionné" :
                      cannotAddMore ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                    }
                  >
                    <div className="d-flex align-items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        <span style={{ fontSize: '1rem' }}>
                          {getTypeIcon(exercise.exercise)}
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className="fw-semibold" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
                            {exercise.exercise}
                          </span>
                          {isSelected && <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '0.8rem' }}></i>}
                          {isSelected && selectedTypes.length === 1 && <i className="bi bi-lock-fill text-muted" style={{ fontSize: '0.8rem' }}></i>}
                          {cannotAddMore && <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '0.8rem' }}></i>}
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
              {selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
            </small>
          </div>
          <div className="d-flex flex-wrap gap-1 mt-2">
            {selectedTypes.map((type) => {
              const exerciseData = getAvailableExercises().find((ex: any) => ex.exercise === type);
              return (
                <Badge key={type} bg="primary" className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                  {getTypeIcon(type)}
                  {exerciseData?.exercise || type}
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
          disabled={selectedTypes.length === 0}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
