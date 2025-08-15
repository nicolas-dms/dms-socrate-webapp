'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface ComprehensionType {
  id: string;
  label: string;
}

interface ComprehensionData {
  [key: string]: ComprehensionType[];
}

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
}

const comprehensionData: ComprehensionData = {
  "CP": [
    { "id": "cp_questions_generales", "label": "Questions générales" },
    { "id": "cp_info_explicit", "label": "Trouver les infos du texte" },
    { "id": "cp_ordonner_evenements", "label": "Remettre l'histoire en ordre" }
  ],
  "CE1": [
    { "id": "ce1_questions_generales", "label": "Questions générales" },
    { "id": "ce1_vrai_faux", "label": "Vrai ou faux" }
  ],
  "CE2": [
    { "id": "ce2_questions_generales", "label": "Questions générales" },
    { "id": "ce2_repere_inference", "label": "Repérer et déduire" },
    { "id": "ce2_personnage_action", "label": "Associer personnage et action" }
  ],
  "CM1": [
    { "id": "cm1_questions_generales", "label": "Questions générales" },
    { "id": "cm1_inference", "label": "Deviner sentiments ou intentions" },
    { "id": "cm1_theme_morale", "label": "Trouver le thème ou la morale" }
  ],
  "CM2": [
    { "id": "cm2_questions_generales", "label": "Questions générales" },
    { "id": "cm2_point_de_vue", "label": "Analyser le point de vue" },
    { "id": "cm2_comparer_passages", "label": "Comparer deux passages" },
    { "id": "cm2_implicite", "label": "Comprendre l'implicite" }
  ]
};

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
  maxExercises
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  // const [modalities, setModalities] = useState<{ [key: string]: string }>({}); // Hidden but preserved

  const availableTypes = comprehensionData[currentLevel] || [];

  // Initialize with previous selection or default
  useEffect(() => {
    if (initialParams && initialParams.types) {
      const types = initialParams.types.split(',').map(t => t.trim()).filter(t => t);
      setSelectedTypes(types);
      
      // Initialize modalities (hidden but preserved structure)
      // const initialModalities: { [key: string]: string } = {};
      // types.forEach(type => {
      //   initialModalities[type] = initialParams.modalities?.[type] || modalityRecommendations[type] || 'defaut';
      // });
      // setModalities(initialModalities);
    } else {
      // Default selection: first exercise type
      if (availableTypes.length > 0) {
        const defaultType = availableTypes[0].id;
        setSelectedTypes([defaultType]);
        // const defaultModality = modalityRecommendations[defaultType] || 'defaut';
        // setModalities({ [defaultType]: defaultModality });
      }
    }
  }, [initialParams, currentLevel, show]);

  const handleTypeToggle = (typeId: string) => {
    const isSelected = selectedTypes.includes(typeId);
    let newSelectedTypes: string[];
    // let newModalities = { ...modalities }; // Hidden but preserved

    if (isSelected) {
      // Don't allow removing the last exercise
      if (selectedTypes.length > 1) {
        newSelectedTypes = selectedTypes.filter(t => t !== typeId);
        // delete newModalities[typeId]; // Hidden but preserved
      } else {
        return; // Keep at least one exercise selected
      }
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
      <Modal.Header closeButton>
        <Modal.Title>Configuration Compréhension - {currentLevel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          <strong>Choisissez les types d'exercices de compréhension :</strong>
          <br />
          <small className="text-muted">
            Sélectionné : {selectedTypes.length} / {maxExercises} exercices maximum
          </small>
        </p>

        <div className="row">
          {availableTypes.map((type) => (
            <div key={type.id} className="col-12 mb-3">
              <div className={`card h-100 ${selectedTypes.includes(type.id) ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        id={`comprehension-${type.id}`}
                        checked={selectedTypes.includes(type.id)}
                        onChange={() => handleTypeToggle(type.id)}
                        className="me-3"
                      />
                      <div>
                        <h6 className="card-title mb-1">{type.label}</h6>
                      </div>
                    </div>

                    {/* Modality selector - Hidden for now but structure preserved */}
                    {false && selectedTypes.includes(type.id) && (
                      <div style={{ minWidth: '120px' }}>
                        <Form.Select
                          size="sm"
                          // value={modalities[type.id] || 'defaut'}
                          // onChange={(e) => handleModalityChange(type.id, e.target.value)}
                        >
                          <option value="defaut">Par défaut</option>
                          <option value="qcm">QCM</option>
                          <option value="identification">Identification</option>
                          <option value="question">Question</option>
                          <option value="association">Association</option>
                        </Form.Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedTypes.length === 0 && (
          <div className="alert alert-warning">
            <strong>Attention :</strong> Vous devez sélectionner au moins un type d'exercice.
          </div>
        )}

        {selectedTypes.length >= maxExercises && (
          <div className="alert alert-info">
            <strong>Limite atteinte :</strong> Vous avez sélectionné le maximum d'exercices autorisés ({maxExercises}).
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={selectedTypes.length === 0}
        >
          Sauvegarder ({selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ComprehensionModal;
