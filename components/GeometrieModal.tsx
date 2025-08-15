"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface GeometrieParams {
  types: string;
}

interface GeometrieModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: GeometrieParams) => void;
  initialParams?: GeometrieParams;
  level: string; // CP, CE1, CE2, CM1, CM2
  exerciseLimit?: number;
  currentTotalExercises?: number;
  domainKey?: string;
  canAddMoreExercises?: (domainKey?: string, additionalCount?: number) => boolean;
}

const GEOMETRY_TYPES = {
  CP: [
    { key: "formes_simples", label: "Formes simples", examples: "Cercle, carré, triangle..." },
    { key: "reconnaissance", label: "Reconnaissance de formes", examples: "Identifier les formes..." },
  ],
  CE1: [
    { key: "formes_simples", label: "Formes simples", examples: "Cercle, carré, triangle, rectangle..." },
    { key: "reconnaissance", label: "Reconnaissance de formes", examples: "Identifier et nommer..." },
    { key: "lignes", label: "Lignes", examples: "Droites, courbes..." },
  ],
  CE2: [
    { key: "polygones", label: "Polygones", examples: "Triangle, carré, rectangle, losange..." },
    { key: "lignes", label: "Lignes et segments", examples: "Droites, segments, parallèles..." },
    { key: "angles", label: "Angles", examples: "Angles droits, aigus, obtus..." },
    { key: "symetrie", label: "Symétrie", examples: "Axes de symétrie..." },
  ],
  CM1: [
    { key: "polygones", label: "Polygones", examples: "Propriétés des quadrilatères..." },
    { key: "angles", label: "Angles", examples: "Mesure d'angles, construction..." },
    { key: "symetrie", label: "Symétrie", examples: "Symétrie axiale..." },
    { key: "perimetre", label: "Périmètre", examples: "Calcul de périmètres..." },
  ],
  CM2: [
    { key: "polygones", label: "Polygones réguliers", examples: "Pentagone, hexagone..." },
    { key: "angles", label: "Angles", examples: "Construction, bissectrice..." },
    { key: "aires", label: "Aires", examples: "Calcul d'aires..." },
    { key: "volumes", label: "Volumes", examples: "Cube, parallélépipède..." },
    { key: "cercle", label: "Cercle", examples: "Rayon, diamètre, circonférence..." },
  ]
};

export default function GeometrieModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "espace-geometrie",
  canAddMoreExercises
}: GeometrieModalProps) {
  const { t } = useTranslation();
  
  // State for type selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["formes_simples"]);
  
  // Get level-specific options
  const currentTypes = GEOMETRY_TYPES[level as keyof typeof GEOMETRY_TYPES] || GEOMETRY_TYPES.CE1;
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const types = initialParams.types.split(",");
      setSelectedTypes(types);
    } else {
      // Reset to default for level
      setSelectedTypes([currentTypes[0]?.key || "formes_simples"]);
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
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-triangle me-2"></i>
          Configurer les exercices de géométrie - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">Sélectionnez les types d'exercices à inclure</h6>
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
