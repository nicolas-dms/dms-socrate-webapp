"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import mathExerciseNamingData from "../config/mathExerciseNaming.json";
import { MathExerciseNamingConfig } from "../types/mathExerciseNaming";

const mathExerciseNaming = mathExerciseNamingData as MathExerciseNamingConfig;

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

interface NombresExercise {
  id: string;
  label: string;
  levels: string[];
  description?: string;
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

  // Initialize state
  useEffect(() => {
    if (show) {
      if (initialSelections && initialSelections.length > 0) {
        setSelectedExercises([...initialSelections]);
      } else {
        setSelectedExercises([]);
      }
    }
  }, [show, initialSelections, level]);

  // Get available exercises for current level from mathExerciseNaming.json
  const getAvailableExercises = (): NombresExercise[] => {
    const nombresExercises = mathExerciseNaming.nombres || [];
    return nombresExercises.filter(ex => 
      ex.levels.includes(level)
    );
  };

  const toggleExercise = (exerciseId: string) => {
    const isSelected = selectedExercises.includes(exerciseId);
    
    if (!isSelected) {
      // Check if adding this exercise would exceed the limit
      if (canAddMoreExercises && !canAddMoreExercises("Nombres", 1)) {
        return; // Don't add if it would exceed the limit
      }
    }

    const newSelection = isSelected
      ? selectedExercises.filter(id => id !== exerciseId)
      : [...selectedExercises, exerciseId];

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
      <Modal.Body className="p-3" style={{ backgroundColor: 'white', maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="mb-2 p-2" style={{ 
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #93c5fd'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <small className="fw-semibold" style={{ color: '#1e40af', fontSize: '0.8rem' }}>
              <i className="bi bi-info-circle me-1" style={{ color: '#3b82f6' }}></i>
              Sélectionnez les exercices de nombres
            </small>
            <Badge style={{ 
              backgroundColor: getTotalSelected() >= exerciseLimit ? '#f59e0b' : '#3b82f6',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem'
            }}>
              {getTotalSelected()}/{exerciseLimit}
            </Badge>
          </div>
        </div>
        
        <Row className="g-2">
          {getAvailableExercises().map((exercise: NombresExercise) => {
            const isSelected = selectedExercises.includes(exercise.id);
            const wouldExceedLimit = !isSelected && !canAddMore();
            
            return (
              <Col key={exercise.id} xl={4} lg={6} md={6}>
                <div 
                  className={`nombres-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${wouldExceedLimit ? 'disabled' : ''}`}
                  style={{ 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? '#eff6ff' : 'white'
                  }}
                  onClick={() => !wouldExceedLimit && toggleExercise(exercise.id)}
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
                      <h6 className="fw-semibold mb-0" style={{ 
                        fontSize: '0.95rem',
                        lineHeight: '1.3',
                        color: isSelected ? '#1d4ed8' : '#374151'
                      }}>
                        {exercise.label}
                      </h6>
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
                  {wouldExceedLimit && (
                    <small className="d-block mt-1 text-center" style={{ color: '#f59e0b', fontSize: '0.7rem' }}>
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
