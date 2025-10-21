"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Badge, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { ExerciceModalite, getDefaultModalityForType, getAvailableModalitiesForType, formatModalityLabel } from '../types/exerciceTypes';
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface ConjugationParams {
  verbs: string;
  tenses: string;
  modalities?: Record<string, ExerciceModalite>; // Store modality for each tense
}

interface ConjugationModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: ConjugationParams) => void;
  initialParams?: ConjugationParams;
  level: string; // CE1, CE2, etc.
}

export default function ConjugationModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: ConjugationModalProps) {
  const { t } = useTranslation();
  
  // Load tenses and verb groups from configuration - memoized to prevent infinite loops
  const availableTenses = useMemo(() => 
    formatExercisesForModal('conjugaison', level),
    [level]
  );
  const availableVerbGroups = useMemo(() => 
    formatExercisesForModal('verb_groups', level),
    [level]
  );
  
  // State for verb selection
  const [selectedVerbGroups, setSelectedVerbGroups] = useState<string[]>([]);
  const [customVerbs, setCustomVerbs] = useState("");
  const [useCustomVerbs, setUseCustomVerbs] = useState(false);
  
  // State for tense selection
  const [selectedTenses, setSelectedTenses] = useState<string[]>([]);
  
  // State for modalities
  const [exerciseModalities, setExerciseModalities] = useState<Record<string, ExerciceModalite>>({});
  
  const handleModalityChange = (tenseKey: string, modality: ExerciceModalite) => {
    setExerciseModalities(prev => ({
      ...prev,
      [tenseKey]: modality
    }));
  };

  const getCurrentModality = (tenseKey: string): ExerciceModalite => {
    return exerciseModalities[tenseKey] || getDefaultModalityForType('conjugaison', level);
  };
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const verbs = initialParams.verbs;
      const tenses = initialParams.tenses.split(",");
      
      setSelectedTenses(tenses);
      
      // Check if it's custom verbs or groups
      if (verbs.includes(",") && !availableVerbGroups.some(g => verbs.includes(g.key))) {
        setUseCustomVerbs(true);
        setCustomVerbs(verbs);
        setSelectedVerbGroups([]);
      } else {
        setUseCustomVerbs(false);
        setCustomVerbs("");
        const groups = availableVerbGroups.filter(g => verbs.includes(g.key)).map(g => g.key);
        setSelectedVerbGroups(groups);
      }
    } else {
      // Set defaults based on level
      const defaultGroups = availableVerbGroups.length > 0 ? [availableVerbGroups[0].key] : [];
      const defaultTenses = availableTenses.length > 0 ? [availableTenses[0].key] : [];
      
      setSelectedVerbGroups(defaultGroups);
      setSelectedTenses(defaultTenses);
    }
  }, [initialParams, availableVerbGroups, availableTenses]);

  const toggleVerbGroup = (groupKey: string) => {
    if (useCustomVerbs) return;
    
    setSelectedVerbGroups(prev => 
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    );
  };

  const toggleTense = (tenseKey: string) => {
    setSelectedTenses(prev => 
      prev.includes(tenseKey)
        ? prev.filter(t => t !== tenseKey)
        : [...prev, tenseKey]
    );
  };

  const handleSave = () => {
    if (selectedTenses.length === 0) {
      alert("Veuillez sélectionner au moins un exercice de conjugaison");
      return;
    }

    let verbsValue: string;
    if (useCustomVerbs) {
      if (!customVerbs.trim()) {
        alert("Veuillez saisir des verbes personnalisés ou sélectionner des groupes");
        return;
      }
      verbsValue = customVerbs.trim();
    } else {
      if (selectedVerbGroups.length === 0) {
        alert("Veuillez sélectionner au moins un groupe de verbes");
        return;
      }
      verbsValue = selectedVerbGroups.join(",");
    }

    const params: ConjugationParams = {
      verbs: verbsValue,
      tenses: selectedTenses.join(",")
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    const defaultGroups = availableVerbGroups.length > 0 ? [availableVerbGroups[0].key] : [];
    const defaultTenses = availableTenses.length > 0 ? [availableTenses[0].key] : [];
    
    setSelectedVerbGroups(defaultGroups);
    setSelectedTenses(defaultTenses);
    setUseCustomVerbs(false);
    setCustomVerbs("");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .conjugation-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .conjugation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15) !important;
        }
        .conjugation-card.selected {
          border-color: #fbbf24 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
        .form-check-input {
          border-radius: 50% !important;
          width: 1.2em;
          height: 1.2em;
          border: 2px solid #d1d5db;
          cursor: pointer;
        }
        .form-check-input:checked {
          background-color: #fbbf24;
          border-color: #fbbf24;
        }
        .form-check-input:focus {
          border-color: #fbbf24;
          box-shadow: 0 0 0 0.25rem rgba(251, 191, 36, 0.25);
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #fbbf24' }}>
        <Modal.Title style={{ color: '#d97706', fontWeight: '600' }}>
          Configuration Conjugaison - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'white' }}>
        <Form>
          {/* Tense Selection Section */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-clock-history me-2" style={{ color: '#fbbf24' }}></i>
              Temps de conjugaison
            </h6>
            
            <Row className="g-2">
              {availableTenses.map(tense => (
                <Col md={6} key={tense.key}>
                  <div 
                    className={`conjugation-card p-3 border ${selectedTenses.includes(tense.key) ? 'selected' : ''}`}
                    style={{ 
                      border: selectedTenses.includes(tense.key) ? '2px solid #fbbf24' : '1px solid #e5e7eb'
                    }}
                    onClick={() => toggleTense(tense.key)}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: selectedTenses.includes(tense.key) ? '2px solid #fbbf24' : '2px solid #d1d5db',
                          background: selectedTenses.includes(tense.key) ? '#fbbf24' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          marginRight: '0.75rem',
                          flexShrink: 0
                        }}
                      >
                        {selectedTenses.includes(tense.key) && (
                          <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                        )}
                      </div>
                      <span className="fw-medium" style={{ 
                        color: selectedTenses.includes(tense.key) ? '#d97706' : '#374151',
                        fontSize: '0.9rem'
                      }}>
                        {tense.label}
                      </span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            
            <div className="mt-3 p-2" style={{ 
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <small style={{ color: '#92400e' }}>
                <i className="bi bi-list-check me-1"></i>
                <strong>Temps sélectionnés:</strong> {selectedTenses.length > 0 
                  ? availableTenses.filter(t => selectedTenses.includes(t.key)).map(t => t.label).join(", ")
                  : "Aucun"
                }
              </small>
            </div>
          </div>

          {/* Verb Selection Section */}
          <div className="mb-3">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-list-ul me-2" style={{ color: '#fbbf24' }}></i>
              Sélection des verbes
            </h6>
            
            <div className="mb-3 p-3" style={{ 
              backgroundColor: '#fff',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <Form.Check
                type="radio"
                name="verbChoice"
                id="groups"
                label={<span style={{ fontWeight: '500', color: '#374151' }}>Choisir par groupes de verbes</span>}
                checked={!useCustomVerbs}
                onChange={() => setUseCustomVerbs(false)}
                className="mb-3"
              />
              
              {!useCustomVerbs && (
                <div className="ps-4">
                  {availableVerbGroups.map(group => (
                    <div 
                      key={group.key}
                      className={`conjugation-card p-3 border mb-2 ${selectedVerbGroups.includes(group.key) ? 'selected' : ''}`}
                      style={{ 
                        border: selectedVerbGroups.includes(group.key) ? '2px solid #fbbf24' : '1px solid #e5e7eb'
                      }}
                      onClick={() => toggleVerbGroup(group.key)}
                    >
                      <div className="d-flex align-items-start">
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: selectedVerbGroups.includes(group.key) ? '2px solid #fbbf24' : '2px solid #d1d5db',
                            background: selectedVerbGroups.includes(group.key) ? '#fbbf24' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            marginRight: '0.75rem',
                            marginTop: '0.1rem',
                            flexShrink: 0
                          }}
                        >
                          {selectedVerbGroups.includes(group.key) && (
                            <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}></i>
                          )}
                        </div>
                        <div>
                          <div className="fw-semibold mb-1" style={{ 
                            color: selectedVerbGroups.includes(group.key) ? '#d97706' : '#374151',
                            fontSize: '0.9rem'
                          }}>
                            {group.label}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{group.examples}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Form.Check
                type="radio"
                name="verbChoice"
                id="custom"
                label={<span style={{ fontWeight: '500', color: '#374151' }}>Verbes personnalisés</span>}
                checked={useCustomVerbs}
                onChange={() => setUseCustomVerbs(true)}
                className="mb-2 mt-3"
              />
              
              {useCustomVerbs && (
                <div className="ps-4">
                  <Form.Group className="mb-2">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="être, avoir, aller, faire, dire, voir, venir..."
                      value={customVerbs}
                      onChange={(e) => setCustomVerbs(e.target.value)}
                      style={{ 
                        fontSize: '0.9rem',
                        borderRadius: '8px',
                        borderColor: '#fed7aa',
                        backgroundColor: '#fffbeb'
                      }}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-pencil me-1"></i>
                      Saisissez les verbes à l'infinitif, séparés par des virgules
                    </Form.Text>
                  </Form.Group>
                </div>
              )}
            </div>
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
        <Button 
          variant="outline-secondary" 
          onClick={handleReset}
          style={{
            borderRadius: '8px',
            fontWeight: '500'
          }}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Réinitialiser
        </Button>
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
          disabled={selectedTenses.length === 0}
          style={{
            background: selectedTenses.length > 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedTenses.length > 0 ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Valider les paramètres
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
