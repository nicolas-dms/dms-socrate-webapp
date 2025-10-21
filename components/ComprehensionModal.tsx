'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface ComprehensionParams {
  types: string;
  // modalities: { [key: string]: string }; // Hidden for now but structure preserved
}

interface ComprehensionModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: ComprehensionParams) => void;
  currentLevel: string;
  initialParams?: ComprehensionParams;
  maxExercises: number;
  textType?: string; // Optional: Filter exercises by lecture text type (histoire, dialogue, poesie, culture)
}

// Modality recommendations (hidden for now)
// const modalityRecommendations: { [key: string]: string } = {
//   'cp_questions_generales': 'qcm',
//   'cp_info_explicit': 'identification',
//   'cp_ordonner_evenements': 'association',
//   'ce1_questions_generales': 'qcm',
//   'ce1_vrai_faux': 'qcm',
//   'ce2_questions_generales': 'question',
//   'ce2_repere_inference': 'identification',
//   'ce2_personnage_action': 'association',
//   'cm1_questions_generales': 'question',
//   'cm1_inference': 'question',
//   'cm1_theme_morale': 'question',
//   'cm2_questions_generales': 'question',
//   'cm2_point_de_vue': 'question',
//   'cm2_comparer_passages': 'question',
//   'cm2_implicite': 'question',
// };

const ComprehensionModal: React.FC<ComprehensionModalProps> = ({
  show,
  onHide,
  onSave,
  currentLevel,
  initialParams,
  maxExercises,
  textType
}) => {
  // Load comprehension types from configuration - memoized to prevent infinite loops
  const allAvailableTypes = useMemo(() => formatExercisesForModal('comprehension', currentLevel), [currentLevel]);
  
  // Filter by text type if provided (from lecture selection)
  const availableTypes = useMemo(() => {
    if (!textType) return allAvailableTypes;
    
    // Load the full config to access text_types
    const frenchExerciseNamingData = require('../config/frenchExerciseNaming.json');
    const comprehensionExercises = frenchExerciseNamingData.comprehension || [];
    
    // Filter exercises that support this text type
    return allAvailableTypes.filter(exercise => {
      const fullExercise = comprehensionExercises.find((ex: any) => ex.id === exercise.key);
      if (!fullExercise || !fullExercise.text_types) return true; // Include if no restriction
      
      // Check if the lecture text type is in the exercise's supported text_types
      return fullExercise.text_types.includes(textType);
    });
  }, [allAvailableTypes, textType]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  // const [modalities, setModalities] = useState<{ [key: string]: string }>({}); // Hidden but preserved

  // Initialize with previous selection or default - only when modal opens
  useEffect(() => {
    if (!show) return; // Only initialize when modal is shown
    
    if (initialParams && initialParams.types) {
      const types = initialParams.types.split(',').map(t => t.trim()).filter(t => t);
      // Filter out types that are no longer available (due to text type filtering)
      const validTypes = types.filter(t => availableTypes.some(at => at.key === t));
      setSelectedTypes(validTypes.length > 0 ? validTypes : []);
      
      // Initialize modalities (hidden but preserved structure)
      // const initialModalities: { [key: string]: string } = {};
      // types.forEach(type => {
      //   initialModalities[type] = initialParams.modalities?.[type] || modalityRecommendations[type] || 'defaut';
      // });
      // setModalities(initialModalities);
    } else {
      // Start with empty selection - user can select exercises
      setSelectedTypes([]);
    }
  }, [show]); // Only re-run when modal opens/closes

  const handleTypeToggle = (typeId: string) => {
    const isSelected = selectedTypes.includes(typeId);
    let newSelectedTypes: string[];
    // let newModalities = { ...modalities }; // Hidden but preserved

    if (isSelected) {
      // Allow removing exercises (can go down to 0)
      newSelectedTypes = selectedTypes.filter(t => t !== typeId);
      // delete newModalities[typeId]; // Hidden but preserved
    } else {
      // Check if we can add more exercises
      if (selectedTypes.length >= maxExercises) {
        return; // Don't exceed the limit
      }
      newSelectedTypes = [...selectedTypes, typeId];
      // newModalities[typeId] = modalityRecommendations[typeId] || 'defaut'; // Hidden but preserved
    }

    setSelectedTypes(newSelectedTypes);
    // setModalities(newModalities); // Hidden but preserved
  };

  // const handleModalityChange = (typeId: string, modality: string) => {
  //   setModalities(prev => ({
  //     ...prev,
  //     [typeId]: modality
  //   }));
  // };

  const handleSave = () => {
    if (selectedTypes.length === 0) return;

    const params: ComprehensionParams = {
      types: selectedTypes.join(','),
      // modalities // Hidden but structure preserved
    };

    onSave(params);
    onHide();
  };

  const handleClose = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <style jsx>{`
        .comprehension-card {
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        .comprehension-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.2) !important;
        }
        .comprehension-card.selected {
          border-color: #fbbf24 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
        .comprehension-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #fbbf24' }}>
        <Modal.Title style={{ color: '#d97706', fontWeight: '600' }}>
          Configuration Compréhension - {currentLevel}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <div className="mb-3 p-3" style={{ 
          backgroundColor: '#fffbeb',
          borderRadius: '10px',
          border: '1px solid #fcd34d'
        }}>
          <h6 className="fw-bold mb-2" style={{ color: '#374151' }}>
            <i className="bi bi-check-circle me-2" style={{ color: '#fbbf24' }}></i>
            Choisissez les types d'exercices de compréhension :
          </h6>
          <small style={{ color: '#92400e' }}>
            <i className="bi bi-info-circle me-1"></i>
            Sélectionné : <strong>{selectedTypes.length} / {maxExercises}</strong> exercices maximum
          </small>
          {textType && (
            <small className="d-block mt-1" style={{ color: '#0284c7' }}>
              <i className="bi bi-funnel me-1"></i>
              Exercices filtrés pour le type de texte : <strong>{textType}</strong>
            </small>
          )}
        </div>

        <div className="row g-3">
          {availableTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.key);
            const isDisabled = !isSelected && selectedTypes.length >= maxExercises;
            
            return (
              <div key={type.key} className="col-12">
                <div 
                  className={`card comprehension-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  style={{ 
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'white'
                  }}
                  onClick={() => !isDisabled && handleTypeToggle(type.key)}
                >
                  <div className="card-body p-3">
                    <div className="d-flex align-items-start">
                      <div className="me-3 mt-1">
                        <div 
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #fbbf24' : '2px solid #d1d5db',
                            background: isSelected ? '#fbbf24' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isSelected && (
                            <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                          )}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0" style={{ 
                          color: isSelected ? '#d97706' : '#374151',
                          fontWeight: '600',
                          fontSize: '0.95rem'
                        }}>
                          {type.label}
                        </h6>
                      </div>
                      {isDisabled && (
                        <i className="bi bi-dash-circle text-muted ms-2"></i>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedTypes.length === 0 && (
          <div className="alert alert-warning mt-3" style={{ 
            backgroundColor: '#fef3c7',
            borderColor: '#fbbf24',
            color: '#92400e'
          }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Attention :</strong> Vous devez sélectionner au moins un type d'exercice.
          </div>
        )}

        {selectedTypes.length >= maxExercises && (
          <div className="alert mt-3" style={{ 
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            color: '#1e40af'
          }}>
            <i className="bi bi-info-circle me-2"></i>
            <strong>Limite atteinte :</strong> Vous avez sélectionné le maximum d'exercices autorisés ({maxExercises}).
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
        <Button 
          variant="outline-secondary" 
          onClick={handleClose}
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
            background: selectedTypes.length > 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedTypes.length > 0 ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Sauvegarder ({selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ComprehensionModal;
