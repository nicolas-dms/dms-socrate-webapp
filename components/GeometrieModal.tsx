"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import mathExerciseNamingData from "../config/mathExerciseNaming.json";
import { MathExerciseNamingConfig } from "../types/mathExerciseNaming";

const mathExerciseNaming = mathExerciseNamingData as MathExerciseNamingConfig;

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
  mathDomains?: any;
}

interface GeometryExercise {
  id: string;
  label: string;
  levels: string[];
  description?: string;
  modality?: string;
}

export default function GeometrieModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "Geometrie",
  canAddMoreExercises,
  mathDomains
}: GeometrieModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Get exercises for current level from mathExerciseNaming.json
  const getAvailableExercises = (): GeometryExercise[] => {
    const geometryExercises = mathExerciseNaming.geometrie || [];
    return geometryExercises.filter(ex => 
      ex.levels.includes(level)
    );
  };
  
  // Group exercises by modality
  const getExercisesByModality = () => {
    const exercises = getAvailableExercises();
    const grouped: { [key: string]: GeometryExercise[] } = {
      identification: [],
      construction: [],
      mesure: [],
      other: []
    };
    
    exercises.forEach(ex => {
      const modality = ex.modality || 'other';
      if (grouped[modality]) {
        grouped[modality].push(ex);
      } else {
        grouped.other.push(ex);
      }
    });
    
    return grouped;
  };
  
  useEffect(() => {
    if (show) {
      if (initialParams && initialParams.types) {
        // Parse existing params if available
        const types = initialParams.types.split(",").map(t => t.trim()).filter(t => t);
        setSelectedTypes(types);
      } else {
        // Reset to default - start with empty selection
        setSelectedTypes([]);
      }
    }
  }, [show, initialParams, level]);

  const toggleType = (exerciseId: string) => {
    if (selectedTypes.includes(exerciseId)) {
      // Allow removing - can have 0 exercises selected
      setSelectedTypes(selectedTypes.filter(t => t !== exerciseId));
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

    const params: GeometrieParams = {
      types: selectedTypes.join(",")
    };

    onSave(params);
    onHide();
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case "identification": return "�️";
      case "construction": return "�";
      case "mesure": return "📏";
      default: return "�";
    }
  };
  
  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case "identification": return "Identification";
      case "construction": return "Construction";
      case "mesure": return "Mesure";
      default: return "Autre";
    }
  };
  
  const getModalityColor = (modality: string) => {
    // All modalities use blue color
    return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <style jsx>{`
        .geometrie-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .geometrie-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .geometrie-card.selected {
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .geometrie-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: '600' }}>
          Configuration Géométrie - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'white', padding: '1.25rem' }}>
        {/* Display exercises grouped by modality */}
        {Object.entries(getExercisesByModality()).map(([modality, exercises]) => {
          if (exercises.length === 0) return null;
          
          const modalityColors = getModalityColor(modality);
          
          return (
            <div key={modality} className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: modalityColors.bg,
                  border: `1px solid ${modalityColors.border}`,
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: modalityColors.text
                }}>
                  {getModalityIcon(modality)} {getModalityLabel(modality)}
                </div>
              </div>
              
              <Row className="g-2">
                {exercises.map((exercise: GeometryExercise) => {
                  const isSelected = selectedTypes.includes(exercise.id);
                  const cannotAddMore = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
                  const isDisabled = cannotAddMore;
                  
                  return (
                    <Col key={exercise.id} md={6}>
                      <div 
                        className={`geometrie-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        style={{ 
                          border: isSelected ? `2px solid ${modalityColors.border}` : '1px solid #e5e7eb',
                          backgroundColor: isSelected ? modalityColors.bg : 'white'
                        }}
                        onClick={() => !isDisabled && toggleType(exercise.id)}
                        title={
                          cannotAddMore ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : 
                          "Cliquer pour sélectionner/désélectionner"
                        }
                      >
                        <div className="d-flex align-items-start gap-2">
                          <div 
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: isSelected ? `2px solid ${modalityColors.border}` : '2px solid #d1d5db',
                              background: isSelected ? modalityColors.border : 'white',
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
                            <div className="d-flex align-items-center gap-1 mb-0">
                              <span className="fw-semibold" style={{ 
                                fontSize: '0.95rem', 
                                lineHeight: '1.3', 
                                color: isSelected ? modalityColors.text : '#374151' 
                              }}>
                                {exercise.label}
                              </span>
                              {cannotAddMore && !isSelected && (
                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.7rem', color: '#f59e0b' }}></i>
                              )}
                            </div>
                            <div className="small text-muted" style={{ 
                              fontSize: '0.85rem', 
                              lineHeight: '1.3', 
                              color: isSelected ? modalityColors.text : '#6b7280',
                              marginTop: '4px'
                            }}>
                              {exercise.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          );
        })}

        <div className="mt-2 p-2" style={{ 
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #93c5fd'
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <small className="fw-semibold" style={{ color: '#1e40af', fontSize: '0.8rem' }}>
              <i className="bi bi-list-check me-1" style={{ color: '#3b82f6' }}></i>
              Sélection actuelle
            </small>
            <small style={{ color: '#1e40af', fontWeight: '600', fontSize: '0.75rem' }}>
              {selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''}
            </small>
          </div>
          {selectedTypes.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mt-2">
              {selectedTypes.map((typeId) => {
                const exerciseData = getAvailableExercises().find((ex) => ex.id === typeId);
                if (!exerciseData) return null;
                
                const modalityColors = getModalityColor(exerciseData.modality || 'other');
                
                return (
                  <Badge key={typeId} style={{ 
                    backgroundColor: modalityColors.border,
                    fontSize: '0.7rem',
                    padding: '0.3rem 0.6rem',
                    fontWeight: '500',
                    color: 'white'
                  }}>
                    {getModalityIcon(exerciseData.modality || 'other')} {exerciseData.label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
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
          disabled={selectedTypes.length === 0}
          style={{
            background: selectedTypes.length > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedTypes.length > 0 ? '0 4px 15px rgba(59, 130, 246, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
