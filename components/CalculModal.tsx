"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface CalculParams {
  operations: string;
}

interface CalculModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: CalculParams) => void;
  initialParams?: CalculParams;
  level: string; // CP, CE1, CE2, CM1, CM2
  exerciseLimit?: number;
  currentTotalExercises?: number;
  domainKey?: string;
  canAddMoreExercises?: (domainKey?: string, additionalCount?: number) => boolean;
}

const EXERCISES_BY_LEVEL = {
  CP: [
    { key: "lire-ecrire-nombres", label: "Lire et écrire les nombres", description: "Reconnaître et écrire les nombres de 1 à 100" },
    { key: "additions-simples", label: "Additions simples", description: "Additions sans retenue jusqu'à 20" },
    { key: "soustractions-simples", label: "Soustractions simples", description: "Soustractions sans retenue jusqu'à 20" },
    { key: "calcul-mental", label: "Calcul mental", description: "Calculs simples de tête" },
    { key: "problemes-simples", label: "Problèmes simples", description: "Petits problèmes à une étape" }
  ],
  CE1: [
    { key: "lire-ecrire-nombres", label: "Lire et écrire les nombres", description: "Nombres jusqu'à 1000" },
    { key: "additions-simples", label: "Additions simples", description: "Additions sans retenue" },
    { key: "soustractions-simples", label: "Soustractions simples", description: "Soustractions sans retenue" },
    { key: "additions-retenue", label: "Additions avec retenue", description: "Additions avec retenue" },
    { key: "soustractions-retenue", label: "Soustractions avec retenue", description: "Soustractions avec retenue" },
    { key: "tables-multiplication", label: "Tables de multiplication", description: "Tables de 2, 3, 4, 5" },
    { key: "calcul-mental", label: "Calcul mental", description: "Calculs rapides" },
    { key: "problemes-simples", label: "Problèmes simples", description: "Problèmes à une étape" }
  ],
  CE2: [
    { key: "lire-ecrire-nombres", label: "Lire et écrire les nombres", description: "Nombres jusqu'à 10000" },
    { key: "additions-retenue", label: "Additions avec retenue", description: "Additions à plusieurs chiffres" },
    { key: "soustractions-retenue", label: "Soustractions avec retenue", description: "Soustractions à plusieurs chiffres" },
    { key: "tables-multiplication", label: "Tables de multiplication", description: "Toutes les tables jusqu'à 10" },
    { key: "multiplications-posees", label: "Multiplications posées", description: "Multiplications par un chiffre" },
    { key: "fractions-parts", label: "Fractions et parts", description: "Découverte des fractions" },
    { key: "calcul-mental", label: "Calcul mental", description: "Stratégies de calcul mental" },
    { key: "problemes-simples", label: "Problèmes simples", description: "Problèmes à une étape" },
    { key: "problemes-etapes", label: "Problèmes à étapes", description: "Problèmes à deux étapes" }
  ],
  CM1: [
    { key: "multiplications-posees", label: "Multiplications posées", description: "Multiplications par deux chiffres" },
    { key: "divisions-posees", label: "Divisions posées", description: "Divisions par un chiffre" },
    { key: "fractions-parts", label: "Fractions et parts", description: "Fractions simples et décimales" },
    { key: "calcul-mental", label: "Calcul mental", description: "Calcul mental avancé" },
    { key: "problemes-etapes", label: "Problèmes à étapes", description: "Problèmes complexes" }
  ],
  CM2: [
    { key: "multiplications-posees", label: "Multiplications posées", description: "Multiplications complexes" },
    { key: "divisions-posees", label: "Divisions posées", description: "Divisions par deux chiffres" },
    { key: "fractions-parts", label: "Fractions et parts", description: "Fractions et nombres décimaux" },
    { key: "calcul-mental", label: "Calcul mental", description: "Calcul mental expert" },
    { key: "problemes-etapes", label: "Problèmes à étapes", description: "Problèmes à plusieurs étapes" }
  ]
};

export default function CalculModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "nombres-calcul",
  canAddMoreExercises
}: CalculModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // State for exercise selection
  const [selectedExercises, setSelectedExercises] = useState<string[]>(["calcul-mental"]);
  
  // Get level-specific exercises
  const currentExercises = EXERCISES_BY_LEVEL[level as keyof typeof EXERCISES_BY_LEVEL] || EXERCISES_BY_LEVEL.CE1;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const exercises = initialParams.operations.split(",");
      setSelectedExercises(exercises);
    } else {
      // Reset to default for level
      setSelectedExercises(["calcul-mental"]);
    }
  }, [initialParams, level]);

  // Don't render on server side
  if (!mounted) {
    return null;
  }

  const toggleExercise = (exercise: string) => {
    if (selectedExercises.includes(exercise)) {
      // Don't allow removing the last exercise
      if (selectedExercises.length > 1) {
        setSelectedExercises(selectedExercises.filter((ex: string) => ex !== exercise));
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedExercises([...selectedExercises, exercise]);
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
      size="lg" 
      centered
      backdrop="static"
      container={typeof document !== 'undefined' ? document.body : undefined}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calculator me-2"></i>
          Nombres, calcul & problèmes - {level}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">Sélectionnez les exercices à inclure</h6>
          <p className="text-muted small">
            Les exercices seront adaptés au niveau {level}. Au moins un exercice doit être sélectionné.
          </p>
        </div>

        <div className="mb-4">
          <Row className="g-3">
            {currentExercises.map((exercise) => {
              const isSelected = selectedExercises.includes(exercise.key);
              const wouldExceedLimit = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
              const isDisabled = (isSelected && selectedExercises.length === 1) || wouldExceedLimit;
              
              return (
                <Col key={exercise.key} md={6}>
                  <div 
                    className={`border rounded p-3 h-100 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle'} ${isDisabled ? '' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && toggleExercise(exercise.key)}
                    style={{ 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    title={
                      isDisabled && isSelected && selectedExercises.length === 1 ? "Au moins un exercice doit être sélectionné" :
                      wouldExceedLimit ? `Limite d'exercices atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                    }
                  >
                    <div className="d-flex align-items-start gap-2">
                      <div className="flex-shrink-0">
                        <span style={{ fontSize: '1.2rem' }}>
                          {getExerciseIcon(exercise.key)}
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-semibold">{exercise.label}</span>
                          {isSelected && <i className="bi bi-check-circle-fill text-primary"></i>}
                          {isDisabled && isSelected && selectedExercises.length === 1 && <i className="bi bi-lock-fill text-muted"></i>}
                          {wouldExceedLimit && <i className="bi bi-exclamation-triangle-fill text-warning"></i>}
                        </div>
                        <div className="text-muted small">
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

        <div className="border-top pt-3">
          <h6 className="mb-2">Résumé de la sélection</h6>
          <div className="d-flex flex-wrap gap-1">
            {selectedExercises.map((exerciseKey) => {
              const exerciseData = currentExercises.find(ex => ex.key === exerciseKey);
              return (
                <Badge key={exerciseKey} bg="primary" className="d-flex align-items-center gap-1">
                  {getExerciseIcon(exerciseKey)}
                  {exerciseData?.label}
                </Badge>
              );
            })}
          </div>
          <small className="text-muted d-block mt-2">
            {selectedExercises.length} exercice{selectedExercises.length > 1 ? 's' : ''} sélectionné{selectedExercises.length > 1 ? 's' : ''}
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
          disabled={selectedExercises.length === 0}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
