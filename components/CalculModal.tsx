"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import mathExerciseNaming from "../config/mathExerciseNaming.json";

interface CalculExercise {
  id: string;
  label: string;
  levels: string[];
  description: string;
}

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
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // Get exercises for current level from mathExerciseNaming.json
  const getAvailableExercises = (): CalculExercise[] => {
    const calculExercises = (mathExerciseNaming as any).calculs || [];
    return calculExercises.filter((ex: CalculExercise) => ex.levels.includes(level));
  };
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    
    if (initialParams && initialParams.operations) {
      // Parse existing params if available
      const exercises = initialParams.operations.split(",");
      setSelectedExercises(exercises);
    } else {
      // Reset to default for level - use first available exercise
      const availableExercises = getAvailableExercises();
      if (availableExercises.length > 0) {
        setSelectedExercises([availableExercises[0].id]);
      } else {
        setSelectedExercises([]);
      }
    }
  }, [show, initialParams, level]);

  // Don't render on server side
  if (!mounted) {
    return null;
  }

  const toggleExercise = (exerciseId: string) => {
    if (selectedExercises.includes(exerciseId)) {
      // Don't allow removing the last exercise
      if (selectedExercises.length > 1) {
        setSelectedExercises(selectedExercises.filter((ex: string) => ex !== exerciseId));
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedExercises([...selectedExercises, exerciseId]);
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
      <style jsx>{`
        .calcul-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .calcul-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .calcul-card.selected {
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .calcul-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: '600' }}>
          Configuration Calculs - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3" style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'white' }}>
        <div className="mb-2 p-2" style={{ 
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #93c5fd'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <small className="fw-semibold" style={{ color: '#1e40af', fontSize: '0.8rem' }}>
              <i className="bi bi-calculator me-1" style={{ color: '#3b82f6' }}></i>
              Exercices de calculs - {level}
            </small>
            <Badge style={{ 
              backgroundColor: '#3b82f6',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem'
            }}>
              {selectedExercises.length} sélectionné{selectedExercises.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Row className="g-2">
          {getAvailableExercises().map((exercise: CalculExercise) => {
            const isSelected = selectedExercises.includes(exercise.id);
            const wouldExceedLimit = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
            const isDisabled = (isSelected && selectedExercises.length === 1) || wouldExceedLimit;
            
            return (
              <Col key={exercise.id} md={6} lg={4}>
                <div 
                  className={`calcul-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && toggleExercise(exercise.id)}
                  style={{ 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? '#eff6ff' : 'white'
                  }}
                  title={
                    isDisabled && isSelected && selectedExercises.length === 1 ? "Au moins un exercice requis" :
                    wouldExceedLimit ? `Limite atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                  }
                >
                  <div className="d-flex align-items-start gap-2">
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
                        flexShrink: 0
                      }}
                    >
                      {isSelected && (
                        <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-1">
                        <h6 className="fw-semibold mb-0" style={{ 
                          fontSize: '0.95rem', 
                          lineHeight: '1.3', 
                          color: isSelected ? '#1d4ed8' : '#374151' 
                        }}>
                          {exercise.label}
                        </h6>
                        {isDisabled && isSelected && selectedExercises.length === 1 && (
                          <i className="bi bi-lock-fill" style={{ fontSize: '0.8rem', color: '#9ca3af' }}></i>
                        )}
                        {wouldExceedLimit && (
                          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.8rem', color: '#f59e0b' }}></i>
                        )}
                      </div>
                      <p className="small text-muted mb-0" style={{ 
                        fontSize: '0.85rem', 
                        lineHeight: '1.3', 
                        color: isSelected ? '#1e40af' : '#6b7280',
                        marginTop: '4px'
                      }}>
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        {selectedExercises.length > 0 && (
          <div className="mt-2 p-2" style={{ 
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #93c5fd'
          }}>
            <div className="d-flex flex-wrap gap-1">
              {selectedExercises.map((exerciseId) => {
                const exerciseData = getAvailableExercises().find((ex: CalculExercise) => ex.id === exerciseId);
                return (
                  <Badge key={exerciseId} style={{ 
                    fontSize: '0.7rem',
                    backgroundColor: '#3b82f6',
                    padding: '0.3rem 0.5rem'
                  }}>
                    {exerciseData?.label || exerciseId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
        
        {getAvailableExercises().length === 0 && (
          <div className="text-center py-3">
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-info-circle fs-3 mb-2 d-block"></i>
              Aucun exercice disponible pour {level}
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
          disabled={selectedExercises.length === 0}
          style={{
            background: selectedExercises.length > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedExercises.length > 0 ? '0 4px 15px rgba(59, 130, 246, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
