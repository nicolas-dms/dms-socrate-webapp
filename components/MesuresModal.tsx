"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

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
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'white' }}>
        <div 
          className="mb-3"
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            padding: '1rem'
          }}
        >
          <h6 className="mb-2" style={{ color: '#1e3a8a', fontWeight: 600 }}>Exercices disponibles pour {level}</h6>
          <p className="small mb-0" style={{ color: '#1d4ed8' }}>
            Sélectionnez les exercices de grandeurs et mesures que vous souhaitez inclure. Au moins un exercice doit être sélectionné.
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
                    className={`mesures-card border p-2 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{ 
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      backgroundColor: 'white'
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
                          flexShrink: 0,
                          marginTop: '2px'
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
                        <div className="small" style={{ fontSize: '0.75rem', lineHeight: '1.2', color: '#6b7280' }}>
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

        <div 
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1.5rem'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0" style={{ color: '#1e3a8a', fontWeight: 600 }}>Sélection actuelle</h6>
            <small style={{ color: '#1d4ed8', fontWeight: 500 }}>
              {selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
            </small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {selectedTypes.map((type) => {
              const exerciseData = getAvailableExercises().find((ex: any) => ex.exercise === type);
              return (
                <Badge 
                  key={type} 
                  className="d-flex align-items-center gap-1" 
                  style={{ 
                    fontSize: '0.75rem',
                    backgroundColor: '#3b82f6',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  <span>{getTypeIcon(type)}</span>
                  {exerciseData?.exercise || type}
                </Badge>
              );
            })}
          </div>
        </div>
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
