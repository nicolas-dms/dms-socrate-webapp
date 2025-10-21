"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ProblemesParams {
  types: string;
}

interface ProblemesModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: ProblemesParams) => void;
  initialParams?: ProblemesParams;
  level: string; // CP, CE1, CE2, CM1, CM2
  exerciseLimit?: number;
  currentTotalExercises?: number;
  domainKey?: string;
  canAddMoreExercises?: (domainKey?: string, additionalCount?: number) => boolean;
}

const PROBLEM_TYPES = {
  CP: [
    { key: "addition_simple", label: "Problèmes d'addition", examples: "Jean a 3 billes, Marie lui en donne 2..." },
    { key: "soustraction_simple", label: "Problèmes de soustraction", examples: "Il y avait 5 oiseaux, 2 s'envolent..." },
  ],
  CE1: [
    { key: "addition", label: "Problèmes d'addition", examples: "Calculs avec des nombres plus grands..." },
    { key: "soustraction", label: "Problèmes de soustraction", examples: "Situations de retrait, différence..." },
    { key: "monnaie", label: "Problèmes de monnaie", examples: "Achats, rendu de monnaie..." },
  ],
  CE2: [
    { key: "addition_soustraction", label: "Addition et soustraction", examples: "Problèmes à plusieurs étapes..." },
    { key: "multiplication", label: "Problèmes de multiplication", examples: "Situations de groupements..." },
    { key: "mesures", label: "Problèmes de mesures", examples: "Longueurs, masses, durées..." },
  ],
  CM1: [
    { key: "quatre_operations", label: "Quatre opérations", examples: "Problèmes complexes multi-étapes..." },
    { key: "proportionnalite", label: "Proportionnalité", examples: "Règle de trois, pourcentages..." },
    { key: "geometrie", label: "Problèmes géométriques", examples: "Périmètres, aires..." },
  ],
  CM2: [
    { key: "operations_complexes", label: "Opérations complexes", examples: "Problèmes avec fractions, décimaux..." },
    { key: "proportionnalite_avancee", label: "Proportionnalité avancée", examples: "Échelles, vitesses, pourcentages..." },
    { key: "geometrie_avancee", label: "Géométrie avancée", examples: "Volumes, constructions..." },
  ]
};

export default function ProblemesModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "donnees",
  canAddMoreExercises
}: ProblemesModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Get level-specific options
  const currentTypes = PROBLEM_TYPES[level as keyof typeof PROBLEM_TYPES] || PROBLEM_TYPES.CE1;
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const types = initialParams.types.split(",");
      setSelectedTypes(types);
    } else {
      // Reset to default for level - select first type
      setSelectedTypes([currentTypes[0]?.key || "addition"]);
    }
  }, [initialParams, level, currentTypes]);

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
      
      // For problems, limit to 3 selections to keep exercises manageable
      if (selectedTypes.length < 3) {
        setSelectedTypes([...selectedTypes, type]);
      }
    }
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      return; // Validation: at least one type required
    }

    const params: ProblemesParams = {
      types: selectedTypes.join(",")
    };

    onSave(params);
    onHide();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "addition_simple":
      case "addition": return "➕";
      case "soustraction_simple":
      case "soustraction": return "➖";
      case "addition_soustraction": return "🔢";
      case "multiplication": return "✖️";
      case "monnaie": return "💰";
      case "mesures": return "📏";
      case "quatre_operations": return "🧮";
      case "operations_complexes": return "🔬";
      case "proportionnalite":
      case "proportionnalite_avancee": return "📊";
      case "geometrie":
      case "geometrie_avancee": return "📐";
      default: return "🧠";
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .problemes-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .problemes-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .problemes-card.selected {
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .problemes-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: '600' }}>
          Configuration Problèmes - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <div className="mb-4">
          <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
            <i className="bi bi-check-circle me-2" style={{ color: '#3b82f6' }}></i>
            Sélectionnez les types de problèmes à inclure
          </h6>
          <div className="p-3" style={{ 
            backgroundColor: '#eff6ff',
            borderRadius: '10px',
            border: '1px solid #93c5fd'
          }}>
            <small style={{ color: '#1e3a8a' }}>
              <i className="bi bi-info-circle me-1"></i>
              Les problèmes seront adaptés au niveau {level}. Maximum 3 types peuvent être sélectionnés.
            </small>
          </div>
        </div>

        <div className="mb-4">
          <Row className="g-3">
            {currentTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.key);
              const wouldExceedLimit = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              const isDisabled = (isSelected && selectedTypes.length === 1) || (!isSelected && selectedTypes.length >= 3) || wouldExceedLimit;
              
              return (
                <Col key={type.key} md={12}>
                  <div 
                    className={`problemes-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && toggleType(type.key)}
                    style={{ 
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                    title={
                      isDisabled && isSelected && selectedTypes.length === 1 ? "Au moins un type doit être sélectionné" :
                      isDisabled && !isSelected && selectedTypes.length >= 3 ? "Maximum 3 types peuvent être sélectionnés" :
                      wouldExceedLimit ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
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
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-semibold" style={{ color: isSelected ? '#1d4ed8' : '#374151' }}>{type.label}</span>
                          {isDisabled && isSelected && selectedTypes.length === 1 && <i className="bi bi-lock-fill text-muted"></i>}
                          {isDisabled && !isSelected && selectedTypes.length >= 3 && <i className="bi bi-x-circle-fill text-muted"></i>}
                          {wouldExceedLimit && <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b' }}></i>}
                        </div>
                        <div className="text-muted small">
                          {type.examples}
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
          <h6 className="mb-2" style={{ color: '#1e3a8a', fontWeight: 600 }}>Résumé de la sélection</h6>
          <div className="d-flex flex-wrap gap-2">
            {selectedTypes.map((type) => {
              const typeData = currentTypes.find(t => t.key === type);
              return (
                <Badge 
                  key={type} 
                  className="d-flex align-items-center gap-1"
                  style={{
                    backgroundColor: '#3b82f6',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <span>{getTypeIcon(type)}</span>
                  {typeData?.label}
                </Badge>
              );
            })}
          </div>
          <small style={{ color: '#1d4ed8', fontWeight: 500 }} className="d-block mt-2">
            {selectedTypes.length}/3 type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
          </small>
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
