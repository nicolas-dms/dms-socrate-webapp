"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import mathExerciseNamingData from "../config/mathExerciseNaming.json";
import { MathExerciseNamingConfig } from "../types/mathExerciseNaming";

const mathExerciseNaming = mathExerciseNamingData as MathExerciseNamingConfig;

interface CalculExercise {
  id: string;
  label: string;
  levels: string[];
  description?: string;
}

// Parameters for table exercises (Tables d'addition, Tables de multiplication)
export interface TableExerciseParams {
  numbers?: number[];      // Numbers to include in tables (2-10) - for multiplication
  difficulty?: 'facile' | 'moyen' | 'difficile'; // Difficulty level - for addition
  fillPercentage: number; // Pre-fill percentage (0-50%)
}

export interface CalculParams {
  operations: string;
  tableParams?: {
    [exerciseId: string]: TableExerciseParams;
  };
}

interface CalculModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: CalculParams) => void;
  level: string;
  initialParams?: CalculParams;
  exerciseLimit: number;
  currentTotalExercises: number;
  domainKey: string;
  canAddMoreExercises: (domainKey?: string, additionalExercises?: number) => boolean;
  mathDomains?: any; // Add this prop
}

export default function CalculModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level,
  exerciseLimit = 10,
  currentTotalExercises = 0,
  domainKey = "nombres-calcul",
  canAddMoreExercises,
  mathDomains
}: CalculModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  // State for exercise selection
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // State for table parameters (default values: numbers 2-9, 20% fill)
  const [tableParams, setTableParams] = useState<{
    [exerciseId: string]: TableExerciseParams;
  }>({});
  
  // State to track which exercise's parameters are currently being configured
  const [focusedExerciseForParams, setFocusedExerciseForParams] = useState<string | null>(null);
  
  // Initialize default table params
  const getDefaultTableParams = (exerciseId?: string): TableExerciseParams => {
    if (exerciseId === 'calcul_mental') {
      return {
        difficulty: 'moyen',
        fillPercentage: 20
      };
    } else if (exerciseId === 'tables_addition') {
      return {
        difficulty: 'moyen',
        fillPercentage: 20
      };
    } else {
      // For tables_multiplication
      return {
        numbers: [2, 3, 4, 5, 6, 7],
        fillPercentage: 20
      };
    }
  };
  
  // Get exercises for current level from mathExerciseNaming.json
  const getAvailableExercises = (): CalculExercise[] => {
    const calculExercises = mathExerciseNaming.calculs || [];
    return calculExercises.filter(ex => ex.levels.includes(level));
  };
  
  // Check if an exercise needs table parameters
  const needsTableParams = (exerciseId: string): boolean => {
    return exerciseId === "tables_addition" || 
           exerciseId === "tables_multiplication" ||
           exerciseId === "calcul_mental";
  };
  
  // Get difficulty options based on level for addition tables
  const getDifficultyOptions = () => {
    return [
      { value: 'facile', label: 'Facile' },
      { value: 'moyen', label: 'Moyen' },
      { value: 'difficile', label: 'Difficile' }
    ];
  };
  
  // Handle difficulty change for addition tables
  const handleDifficultyChange = (exerciseId: string, difficulty: 'facile' | 'moyen' | 'difficile') => {
    const currentParams = tableParams[exerciseId] || getDefaultTableParams(exerciseId);
    setTableParams({
      ...tableParams,
      [exerciseId]: {
        ...currentParams,
        difficulty: difficulty
      }
    });
  };
  
  // Handle number selection toggle for table exercises
  const handleNumberToggle = (exerciseId: string, number: number) => {
    const currentParams = tableParams[exerciseId] || getDefaultTableParams(exerciseId);
    const currentNumbers = currentParams.numbers || [];
    
    if (currentNumbers.includes(number)) {
      // Don't allow deselection if only 2 numbers remain
      if (currentNumbers.length <= 2) {
        return;
      }
      setTableParams({
        ...tableParams,
        [exerciseId]: {
          ...currentParams,
          numbers: currentNumbers.filter(n => n !== number)
        }
      });
    } else {
      // Don't allow selection if 6 numbers already selected (max constraint)
      if (currentNumbers.length >= 6) {
        return;
      }
      setTableParams({
        ...tableParams,
        [exerciseId]: {
          ...currentParams,
          numbers: [...currentNumbers, number].sort((a, b) => a - b)
        }
      });
    }
  };
  
  // Handle fill percentage change for table exercises
  const handleFillPercentageChange = (exerciseId: string, percentage: number) => {
    const currentParams = tableParams[exerciseId] || getDefaultTableParams(exerciseId);
    setTableParams({
      ...tableParams,
      [exerciseId]: {
        ...currentParams,
        fillPercentage: percentage
      }
    });
  };
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    
    if (initialParams && initialParams.operations) {
      // Parse existing params if available
      const exercises = initialParams.operations.split(",");
      setSelectedExercises(exercises);
      
      // Load table params if available
      if (initialParams.tableParams) {
        setTableParams(initialParams.tableParams);
      } else {
        // Initialize default table params for any table exercises
        const newTableParams: { [key: string]: TableExerciseParams } = {};
        exercises.forEach(ex => {
          if (needsTableParams(ex)) {
            newTableParams[ex] = getDefaultTableParams(ex);
          }
        });
        setTableParams(newTableParams);
      }
      
      // Don't auto-focus any exercise params - user must click config icon
      setFocusedExerciseForParams(null);
    } else {
      // Reset to default for level - use first available exercise
      const availableExercises = getAvailableExercises();
      if (availableExercises.length > 0) {
        setSelectedExercises([availableExercises[0].id]);
        // Initialize table params if first exercise needs them
        if (needsTableParams(availableExercises[0].id)) {
          setTableParams({
            [availableExercises[0].id]: getDefaultTableParams(availableExercises[0].id)
          });
        } else {
          setTableParams({});
        }
      } else {
        setSelectedExercises([]);
        setTableParams({});
      }
      
      // Don't auto-focus any exercise params - user must click config icon
      setFocusedExerciseForParams(null);
    }
  }, [show, initialParams, level]);

  // Don't render on server side
  if (!mounted) {
    return null;
  }

  const toggleExercise = (exerciseId: string) => {
    if (selectedExercises.includes(exerciseId)) {
      // Don't allow removing the last exercise
      if (selectedExercises.length > 1) {
        setSelectedExercises(selectedExercises.filter((ex: string) => ex !== exerciseId));
        // Remove table params if exercise is deselected
        if (needsTableParams(exerciseId)) {
          const newTableParams = { ...tableParams };
          delete newTableParams[exerciseId];
          setTableParams(newTableParams);
          // Clear focus if this was the focused exercise
          if (focusedExerciseForParams === exerciseId) {
            setFocusedExerciseForParams(null);
          }
        }
      }
    } else {
      // Check if we can add more exercises
      if (canAddMoreExercises && !canAddMoreExercises(domainKey, 1)) {
        return; // Don't add if limit would be exceeded
      }
      setSelectedExercises([...selectedExercises, exerciseId]);
      // Initialize table params with defaults if needed
      if (needsTableParams(exerciseId)) {
        setTableParams({
          ...tableParams,
          [exerciseId]: getDefaultTableParams(exerciseId)
        });
        // Set this exercise as focused for parameter configuration
        setFocusedExerciseForParams(exerciseId);
      } else {
        // If the new exercise doesn't need params, clear the focused params
        setFocusedExerciseForParams(null);
      }
    }
  };

  const handleSave = () => {
    if (selectedExercises.length === 0) {
      return; // Validation: at least one exercise required
    }
    
    // Validate table params
    for (const exerciseId of selectedExercises) {
      if (needsTableParams(exerciseId)) {
        const params = tableParams[exerciseId];
        if (!params) {
          alert(`Veuillez configurer les paramètres pour "${exerciseId}"`);
          return;
        }
        // Validate multiplication tables need at least 2 numbers
        if (exerciseId === 'tables_multiplication' && (!params.numbers || params.numbers.length < 2)) {
          alert(`Veuillez sélectionner au moins 2 nombres pour les tables de multiplication`);
          return;
        }
        // Validate addition tables and calcul mental need a difficulty
        if ((exerciseId === 'tables_addition' || exerciseId === 'calcul_mental') && !params.difficulty) {
          alert(`Veuillez sélectionner un niveau de difficulté`);
          return;
        }
      }
    }

    const params: CalculParams = {
      operations: selectedExercises.join(","),
      tableParams: Object.keys(tableParams).length > 0 ? tableParams : undefined
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
      size="xl" 
      centered
      backdrop="static"
      container={typeof document !== 'undefined' ? document.body : undefined}
    >
      <style jsx>{`
        .calcul-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .calcul-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15) !important;
        }
        .calcul-card.selected {
          border-color: #3b82f6 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .calcul-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #3b82f6' }}>
        <Modal.Title style={{ color: '#1d4ed8', fontWeight: '600' }}>
          Configuration Calculs - {level}
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
              <i className="bi bi-calculator me-1" style={{ color: '#3b82f6' }}></i>
              Exercices de calculs - {level}
            </small>
            <Badge style={{ 
              backgroundColor: '#3b82f6',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem'
            }}>
              {selectedExercises.length} sélectionné{selectedExercises.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Row className="g-2">
          {getAvailableExercises().map((exercise: CalculExercise) => {
            const isSelected = selectedExercises.includes(exercise.id);
            const wouldExceedLimit = !isSelected && canAddMoreExercises && !canAddMoreExercises(domainKey, 1);
            const isDisabled = (isSelected && selectedExercises.length === 1) || wouldExceedLimit;
            
            return (
              <Col key={exercise.id} md={6} lg={4}>
                <div 
                  className={`calcul-card border p-3 h-100 ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && toggleExercise(exercise.id)}
                  style={{ 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? '#eff6ff' : 'white',
                    position: 'relative'
                  }}
                  title={
                    isDisabled && isSelected && selectedExercises.length === 1 ? "Au moins un exercice requis" :
                    wouldExceedLimit ? `Limite atteinte (${currentTotalExercises}/${exerciseLimit})` : ""
                  }
                >
                  {/* Config icon for exercises with parameters */}
                  {isSelected && needsTableParams(exercise.id) && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedExerciseForParams(exercise.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '4px',
                        backgroundColor: focusedExerciseForParams === exercise.id ? '#3b82f6' : '#93c5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Configurer les paramètres"
                    >
                      <i className="bi bi-gear-fill" style={{ color: 'white', fontSize: '0.7rem' }}></i>
                    </div>
                  )}
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
                    <div className="flex-grow-1" style={{ paddingRight: needsTableParams(exercise.id) && isSelected ? '24px' : '0' }}>
                      <div className="d-flex align-items-center gap-1">
                        <h6 className="fw-semibold mb-0" style={{ 
                          fontSize: '0.95rem', 
                          lineHeight: '1.3', 
                          color: isSelected ? '#1d4ed8' : '#374151' 
                        }}>
                          {exercise.label}
                        </h6>
                        {isDisabled && isSelected && selectedExercises.length === 1 && (
                          <i className="bi bi-lock-fill" style={{ fontSize: '0.8rem', color: '#9ca3af' }}></i>
                        )}
                        {wouldExceedLimit && (
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

        {/* Table Parameters Configuration Section - Only show focused exercise */}
        {focusedExerciseForParams && needsTableParams(focusedExerciseForParams) && (
          <div className="mt-3">
            {(() => {
              const exerciseId = focusedExerciseForParams;
              const currentParams = tableParams[exerciseId] || getDefaultTableParams();
              const exerciseData = getAvailableExercises().find(ex => ex.id === exerciseId);
              
              return (
                <div className="border rounded p-2" style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#3b82f6',
                  borderWidth: '2px'
                }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-semibold mb-0" style={{ color: '#1e40af', fontSize: '0.85rem' }}>
                      <i className="bi bi-gear-fill me-1" style={{ color: '#3b82f6', fontSize: '0.75rem' }}></i>
                      {exerciseData?.label || exerciseId}
                    </h6>
                    <i 
                      className="bi bi-x-lg" 
                      style={{ color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => setFocusedExerciseForParams(null)}
                      title="Fermer la configuration"
                    ></i>
                  </div>
                  
                  <Row className="g-2">
                    {/* Difficulty Selection for Addition Tables and Calcul Mental */}
                    {(exerciseId === 'tables_addition' || exerciseId === 'calcul_mental') && (
                      <Col md={7}>
                        <label className="form-label small fw-semibold mb-1" style={{ color: '#1e40af', fontSize: '0.75rem' }}>
                          Niveau de difficulté <span className="text-danger">*</span>
                        </label>
                        <div className="d-flex gap-2">
                          {getDifficultyOptions().map(option => {
                            const isSelected = currentParams.difficulty === option.value;
                            
                            return (
                              <div
                                key={option.value}
                                onClick={() => handleDifficultyChange(exerciseId, option.value as 'facile' | 'moyen' | 'difficile')}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? '#3b82f6' : 'white',
                                  border: isSelected ? '2px solid #3b82f6' : '2px solid #cbd5e1',
                                  color: isSelected ? 'white' : '#374151',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  userSelect: 'none',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? '600' : '500',
                                  flex: 1,
                                  textAlign: 'center'
                                }}
                              >
                                {option.label}
                              </div>
                            );
                          })}
                        </div>
                      </Col>
                    )}
                    
                    {/* Numbers Selection for Multiplication Tables */}
                    {exerciseId === 'tables_multiplication' && (
                      <Col md={7}>
                        <label className="form-label small fw-semibold mb-1" style={{ color: '#1e40af', fontSize: '0.75rem' }}>
                          Tables à inclure <span className="text-danger">*</span>
                          <small className="text-muted ms-2">(min 2, max 6)</small>
                        </label>
                        <div className="d-flex flex-wrap gap-1">
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                            const isSelected = currentParams.numbers?.includes(num);
                            const currentCount = currentParams.numbers?.length || 0;
                            const isDisabledMin = isSelected && currentCount === 2;
                            const isDisabledMax = !isSelected && currentCount >= 6;
                            const isDisabled = isDisabledMin || isDisabledMax;
                            
                            return (
                              <div
                                key={num}
                                onClick={() => !isDisabled && handleNumberToggle(exerciseId, num)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? '#3b82f6' : 'white',
                                  border: isSelected ? '2px solid #3b82f6' : '2px solid #cbd5e1',
                                  color: isSelected ? 'white' : '#374151',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.6 : 1,
                                  transition: 'all 0.2s ease',
                                  userSelect: 'none'
                                }}
                                title={
                                  isDisabledMin ? 'Minimum 2 tables requises' :
                                  isDisabledMax ? 'Maximum 6 tables atteint' : ''
                                }
                              >
                                {num}
                              </div>
                            );
                          })}
                        </div>
                      </Col>
                    )}
                    
                    {/* Fill Percentage - only for tables_addition and tables_multiplication */}
                    {(exerciseId === 'tables_addition' || exerciseId === 'tables_multiplication') && (
                      <Col md={5}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-semibold mb-0" style={{ color: '#1e40af', fontSize: '0.75rem' }}>
                            Pré-remplissage
                          </label>
                          <span style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.85rem' }}>
                            {currentParams.fillPercentage}%
                          </span>
                        </div>
                        <div style={{ position: 'relative', height: '20px', marginTop: '4px' }}>
                          {/* Background track */}
                          <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '20px',
                            backgroundColor: '#e0e7ff',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            {/* Filled portion */}
                            <div style={{
                              height: '100%',
                              width: `${((currentParams.fillPercentage || 0) / 50) * 100}%`,
                              backgroundColor: '#3b82f6',
                              transition: 'width 0.2s ease'
                            }}></div>
                          </div>
                          {/* Invisible input for interaction */}
                          <Form.Range
                            value={currentParams.fillPercentage || 0}
                            onChange={(e) => handleFillPercentageChange(exerciseId, parseInt(e.target.value))}
                            min={0}
                            max={50}
                            step={10}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              top: '0',
                              opacity: 0,
                              cursor: 'pointer',
                              height: '20px'
                            }}
                          />
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              );
            })()}
          </div>
        )}

        {selectedExercises.length > 0 && (
          <div className="mt-2 p-2" style={{ 
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #93c5fd'
          }}>
            <div className="d-flex flex-wrap gap-1">
              {selectedExercises.map((exerciseId) => {
                const exerciseData = getAvailableExercises().find((ex: CalculExercise) => ex.id === exerciseId);
                return (
                  <Badge key={exerciseId} style={{ 
                    fontSize: '0.7rem',
                    backgroundColor: '#3b82f6',
                    padding: '0.3rem 0.5rem'
                  }}>
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
          disabled={selectedExercises.length === 0}
          style={{
            background: selectedExercises.length > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedExercises.length > 0 ? '0 4px 15px rgba(59, 130, 246, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check me-2"></i>
          Valider la configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
