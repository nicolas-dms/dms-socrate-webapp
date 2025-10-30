"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import mathExerciseNaming from "../config/mathExerciseNaming.json";

interface GrandeursExercise {
  id: string;
  label: string;
  levels: string[];
  description: string;
}

export interface MesuresParams {
  types: string;
}

interface MesuresModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: MesuresParams) => void;
  level: string;
  initialParams?: MesuresParams;
  exerciseLimit: number;
  currentTotalExercises: number;
  domainKey: string;
  canAddMoreExercises: (domainKey?: string, additionalExercises?: number) => boolean;
  mathDomains?: any; // Add this prop
}

export default function MesuresModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "grandeurs-mesures",
  canAddMoreExercises,
  mathDomains
}: MesuresModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Get exercises for current level from mathExerciseNaming.json
  const getAvailableExercises = (): GrandeursExercise[] => {
    const grandeursExercises = (mathExerciseNaming as any).grandeurs || [];
    return grandeursExercises.filter((ex: GrandeursExercise) => ex.levels.includes(level));
  };
  
  useEffect(() => {
    if (!show) return;
    
    if (initialParams && initialParams.types) {
      // Parse existing params if available
      const types = initialParams.types.split(",");
      setSelectedTypes(types);
    } else {
      // Reset to default for level - use first available exercise
      const availableExercises = getAvailableExercises();
      if (availableExercises.length > 0) {
        setSelectedTypes([availableExercises[0].id]);
      } else {
        setSelectedTypes([]);
      }
    }
  }, [show, initialParams, level]);

  const toggleType = (exerciseId: string) => {
    if (selectedTypes.includes(exerciseId)) {
      // Don't allow removing the last type
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== exerciseId));
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedTypes([...selectedTypes, exerciseId]);
    }
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      return; // Validation: at least one type required
    }

    const params: MesuresParams = {
      types: selectedTypes.join(",")
    };

    onSave(params);
    onHide();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "longueur": return "📏";
      case "masse": return "⚖️";
      case "capacite": return "🥤";
      case "temps": return "⏰";
      case "monnaie": return "💰";
      case "aire": return "📐";
      default: return "📊";
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <style jsx global>{`
        .mesures-card {
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          background-color: white;
          min-height: 80px;
        }
        
        .mesures-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .mesures-card.selected {
          border: 2px solid #3b82f6 !important;
        }
        
        .mesures-card.disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: 600 }}>
          Configurer les exercices de mesures - {level}
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
              <i className="bi bi-rulers me-1" style={{ color: '#3b82f6' }}></i>
              Grandeurs et mesures - {level}
            </small>
            <Badge style={{ 
              backgroundColor: '#3b82f6',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem'
            }}>
              {selectedTypes.length} sélectionné{selectedTypes.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Row className="g-2">
          {getAvailableExercises().map((exercise: GrandeursExercise) => {
            const isSelected = selectedTypes.includes(exercise.id);
            const cannotAddMore = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
            const isDisabled = (isSelected && selectedTypes.length === 1) || cannotAddMore;
            
            return (
              <Col key={exercise.id} md={6} lg={4}>
                <div 
                  className={`mesures-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  style={{ 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? '#eff6ff' : 'white'
                  }}
                  onClick={() => !isDisabled && toggleType(exercise.id)}
                  title={
                    isSelected && selectedTypes.length === 1 ? "Au moins un exercice requis" :
                    cannotAddMore ? `Limite atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
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
                        {isSelected && selectedTypes.length === 1 && (
                          <i className="bi bi-lock-fill" style={{ fontSize: '0.8rem', color: '#9ca3af' }}></i>
                        )}
                        {cannotAddMore && (
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

        {selectedTypes.length > 0 && (
          <div className="mt-2 p-2" style={{ 
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #93c5fd'
          }}>
            <div className="d-flex flex-wrap gap-1">
              {selectedTypes.map((exerciseId) => {
                const exerciseData = getAvailableExercises().find((ex: GrandeursExercise) => ex.id === exerciseId);
                return (
                  <Badge 
                    key={exerciseId} 
                    style={{ 
                      fontSize: '0.7rem',
                      backgroundColor: '#3b82f6',
                      padding: '0.3rem 0.5rem'
                    }}
                  >
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
      <Modal.Footer style={{ backgroundColor: 'white' }}>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          disabled={selectedTypes.length === 0}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
          }}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
