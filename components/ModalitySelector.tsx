"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';

interface ModalitySelectorProps {
  exerciseType: string;
  level: string;
  selectedModality?: ExerciceModalite;
  onModalityChange: (modality: ExerciceModalite) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary';
}

const ModalitySelector: React.FC<ModalitySelectorProps> = ({
  exerciseType,
  level,
  selectedModality,
  onModalityChange,
  className = '',
  variant = 'outline-primary'
}) => {
  const defaultModality = getDefaultModalityForType(exerciseType, level);
  const availableModalities = getAvailableModalitiesForType(exerciseType);
  const currentModality = selectedModality || defaultModality;
  
  // Don't show selector if only default modality is available or type doesn't support modalities
  if (availableModalities.length <= 1 || !['grammaire', 'conjugaison', 'vocabulaire'].includes(exerciseType)) {
    return null;
  }

  const handleModalitySelect = (modality: ExerciceModalite) => {
    onModalityChange(modality);
  };

  return (
    <Dropdown className={`d-inline-block ${className}`}>
      <Dropdown.Toggle 
        variant={variant}
        size="sm"
        className="border-0 text-decoration-none fw-normal"
        style={{ 
          fontSize: '0.85rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: variant.includes('outline') ? 'transparent' : undefined
        }}
      >
        {formatModalityLabel(currentModality)}
        {currentModality === defaultModality && (
          <small className="text-muted ms-1">(recommandé)</small>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {availableModalities.map((modality) => (
          <Dropdown.Item
            key={modality}
            onClick={() => handleModalitySelect(modality)}
            active={modality === currentModality}
            className="d-flex justify-content-between align-items-center"
          >
            <span>{formatModalityLabel(modality)}</span>
            {modality === defaultModality && (
              <small className="text-primary ms-2">
                <i className="bi bi-star-fill"></i>
              </small>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ModalitySelector;
