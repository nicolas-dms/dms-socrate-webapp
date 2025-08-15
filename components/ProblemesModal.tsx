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
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-lightbulb me-2"></i>
          Configurer les problèmes - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">Sélectionnez les types de problèmes à inclure</h6>
          <p className="text-muted small">
            Les problèmes seront adaptés au niveau {level}. Maximum 3 types peuvent être sélectionnés pour garder les exercices gérables.
          </p>
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
                    className={`border rounded p-3 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle'} ${isDisabled ? '' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && toggleType(type.key)}
                    style={{ 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    title={
                      isDisabled && isSelected && selectedTypes.length === 1 ? "Au moins un type doit être sélectionné" :
                      isDisabled && !isSelected && selectedTypes.length >= 3 ? "Maximum 3 types peuvent être sélectionnés" :
                      wouldExceedLimit ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                    }
                  >
                    <div className="d-flex align-items-start gap-2">
                      <div className="flex-shrink-0">
                        <span style={{ fontSize: '1.2rem' }}>
                          {getTypeIcon(type.key)}
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-semibold">{type.label}</span>
                          {isSelected && <i className="bi bi-check-circle-fill text-primary"></i>}
                          {isDisabled && isSelected && selectedTypes.length === 1 && <i className="bi bi-lock-fill text-muted"></i>}
                          {isDisabled && !isSelected && selectedTypes.length >= 3 && <i className="bi bi-x-circle-fill text-muted"></i>}
                          {wouldExceedLimit && <i className="bi bi-exclamation-triangle-fill text-warning"></i>}
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

        <div className="border-top pt-3">
          <h6 className="mb-2">Résumé de la sélection</h6>
          <div className="d-flex flex-wrap gap-1">
            {selectedTypes.map((type) => {
              const typeData = currentTypes.find(t => t.key === type);
              return (
                <Badge key={type} bg="primary" className="d-flex align-items-center gap-1">
                  {getTypeIcon(type)}
                  {typeData?.label}
                </Badge>
              );
            })}
          </div>
          <small className="text-muted d-block mt-2">
            {selectedTypes.length}/3 type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
          </small>
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
