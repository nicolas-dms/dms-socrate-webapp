"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface MesuresParams {
  types: string;
}

interface MesuresModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: MesuresParams) => void;
  initialParams?: MesuresParams;
  level: string; // CP, CE1, CE2, CM1, CM2
  exerciseLimit?: number;
  currentTotalExercises?: number;
  domainKey?: string;
  canAddMoreExercises?: (domainKey?: string, additionalCount?: number) => boolean;
}

const MEASURE_TYPES = {
  CP: [
    { key: "longueur", label: "Longueur", examples: "Comparer des longueurs..." },
    { key: "temps", label: "Temps", examples: "Matin, après-midi, jour, nuit..." },
  ],
  CE1: [
    { key: "longueur", label: "Longueur", examples: "Mètre, centimètre..." },
    { key: "masse", label: "Masse", examples: "Kilogramme, gramme..." },
    { key: "temps", label: "Temps", examples: "Heure, minute..." },
    { key: "monnaie", label: "Monnaie", examples: "Euro, centime..." },
  ],
  CE2: [
    { key: "longueur", label: "Longueur", examples: "km, m, cm, mm..." },
    { key: "masse", label: "Masse", examples: "kg, g..." },
    { key: "capacite", label: "Capacité", examples: "Litre, centilitre..." },
    { key: "temps", label: "Temps", examples: "Année, mois, semaine..." },
  ],
  CM1: [
    { key: "longueur", label: "Longueur", examples: "Conversions, calculs..." },
    { key: "masse", label: "Masse", examples: "Conversions kg, g..." },
    { key: "capacite", label: "Capacité", examples: "Conversions L, cL, mL..." },
    { key: "aire", label: "Aire", examples: "m², cm²..." },
  ],
  CM2: [
    { key: "longueur", label: "Longueur", examples: "Toutes unités et conversions..." },
    { key: "masse", label: "Masse", examples: "Toutes unités et conversions..." },
    { key: "capacite", label: "Capacité", examples: "Toutes unités et conversions..." },
    { key: "aire", label: "Aire", examples: "Calculs d'aires complexes..." },
  ]
};

export default function MesuresModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "grandeurs-mesures",
  canAddMoreExercises
}: MesuresModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["longueur"]);
  
  // Get level-specific options
  const currentTypes = MEASURE_TYPES[level as keyof typeof MEASURE_TYPES] || MEASURE_TYPES.CE1;
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const types = initialParams.types.split(",");
      setSelectedTypes(types);
    } else {
      // Reset to default for level
      setSelectedTypes([currentTypes[0]?.key || "longueur"]);
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
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-rulers me-2"></i>
          Configurer les exercices de mesures - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">Sélectionnez les types de mesures à inclure</h6>
          <p className="text-muted small">
            Les exercices seront adaptés au niveau {level}. Au moins un type doit être sélectionné.
          </p>
        </div>

        <div className="mb-4">
          <Row className="g-3">
            {currentTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.key);
              const isDisabled = isSelected && selectedTypes.length === 1;
              const cannotAddMore = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              
              return (
                <Col key={type.key} sm={6}>
                  <div 
                    className={`border rounded p-3 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : cannotAddMore ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary-subtle'} ${isDisabled || cannotAddMore ? '' : 'cursor-pointer'}`}
                    onClick={() => !(isDisabled || cannotAddMore) && toggleType(type.key)}
                    style={{ 
                      cursor: isDisabled || cannotAddMore ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.7 : cannotAddMore ? 0.8 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    title={
                      isDisabled ? "Au moins un type doit être sélectionné" : 
                      cannotAddMore ? "Limite d'exercices atteinte" : ""
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
                          {isDisabled && <i className="bi bi-lock-fill text-muted"></i>}
                          {cannotAddMore && <i className="bi bi-exclamation-triangle-fill text-warning"></i>}
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
            {selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
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
