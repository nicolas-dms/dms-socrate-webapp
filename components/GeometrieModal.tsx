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
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'white' }}>
        <div className="mb-3">
          <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
            <i className="bi bi-check-circle me-2" style={{ color: '#3b82f6' }}></i>
            Exercices disponibles pour {level}
          </h6>
        </div>

        <div className="mb-3">
          <Row className="g-3">
            {getAvailableExercises().map((exercise: any, index: number) => {
              const isSelected = selectedTypes.includes(exercise.exercise);
              const canSelect = !isSelected && canAddMoreExercises && canAddMoreExercises(domainKey, 1);
              const cannotAddMore = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              const isDisabled = (isSelected && selectedTypes.length === 1) || cannotAddMore;
              
              return (
                <Col key={index} md={6} lg={4}>
                  <div 
                    className={`geometrie-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{ 
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      minHeight: '80px'
                    }}
                    onClick={() => !isDisabled && toggleType(exercise.exercise)}
                    title={
                      isSelected && selectedTypes.length === 1 ? "Au moins un exercice doit être sélectionné" :
                      cannotAddMore ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
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
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className="fw-semibold" style={{ fontSize: '0.85rem', lineHeight: '1.2', color: isSelected ? '#1d4ed8' : '#374151' }}>
                            {exercise.exercise}
                          </span>
                          {isSelected && selectedTypes.length === 1 && <i className="bi bi-lock-fill text-muted" style={{ fontSize: '0.8rem' }}></i>}
                          {cannotAddMore && <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.8rem', color: '#f59e0b' }}></i>}
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

        <div className="mt-3 p-3" style={{ 
          backgroundColor: '#eff6ff',
          borderRadius: '10px',
          border: '1px solid #93c5fd'
        }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-semibold" style={{ color: '#374151' }}>
              <i className="bi bi-list-check me-2" style={{ color: '#3b82f6' }}></i>
              Sélection actuelle
            </h6>
            <small style={{ color: '#1e3a8a' }}>
              {selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
            </small>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {selectedTypes.map((type) => {
              const exerciseData = getAvailableExercises().find((ex: any) => ex.exercise === type);
              return (
                <Badge key={type} style={{ 
                  backgroundColor: '#3b82f6',
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.6rem'
                }}>
                  {getTypeIcon(type)}
                  {exerciseData?.exercise || type}
                </Badge>
              );
            })}
          </div>
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
