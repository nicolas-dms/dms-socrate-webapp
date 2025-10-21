"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { formatExercisesForModal } from '../types/frenchExerciseNaming';

export interface OrthographyParams {
  words: string;
  rules: string;
}

interface OrthographyModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: OrthographyParams) => void;
  initialParams?: OrthographyParams;
  level: string; // CE1, CE2, etc.
}

export default function OrthographyModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: OrthographyModalProps) {
  const { t } = useTranslation();
  
  // Load orthography rules from configuration - memoized to prevent infinite loops
  const orthographyRules = useMemo(() => formatExercisesForModal('orthographe', level), [level]);
  
  const [customWords, setCustomWords] = useState("");
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  
  useEffect(() => {
    if (initialParams) {
      // Check if words contain the #dictee prefix
      if (initialParams.words && initialParams.words.startsWith("#dictee,")) {
        const wordsWithoutPrefix = initialParams.words.replace("#dictee,", "");
        setCustomWords(wordsWithoutPrefix);
        setSelectedRules(["dictee"]);
      } else {
        setCustomWords("");
        setSelectedRules(initialParams.rules ? initialParams.rules.split(",") : []);
      }
    } else {
      // Set defaults based on level
      setCustomWords("");
      setSelectedRules([]);
    }
  }, [initialParams, level]);

  const toggleRule = (ruleKey: string) => {
    const rule = orthographyRules.find(r => r.key === ruleKey);
    
    if (rule?.isCustom) {
      // If selecting custom dictée
      if (selectedRules.includes(ruleKey)) {
        // Deselecting dictée
        setSelectedRules(prev => prev.filter(r => r !== ruleKey));
        setCustomWords("");
      } else {
        // Selecting dictée - allow multiple selection
        setSelectedRules(prev => [...prev, ruleKey]);
      }
    } else {
      // Regular rule toggle - allow multiple selection
      setSelectedRules(prev => 
        prev.includes(ruleKey)
          ? prev.filter(r => r !== ruleKey)
          : [...prev, ruleKey]
      );
    }
  };

  const handleSave = () => {
    if (selectedRules.length === 0) {
      alert("Veuillez sélectionner au moins une règle d'orthographe ou la dictée personnalisée");
      return;
    }

    // Check if dictée is selected and if custom words are provided
    const hasDictee = selectedRules.includes("dictee");
    if (hasDictee && !customWords.trim()) {
      alert("Veuillez saisir des mots personnalisés pour la dictée");
      return;
    }

    let wordsValue = "";
    let rulesValue = "";

    if (hasDictee) {
      // If dictée is selected, include the prefix and custom words
      wordsValue = `#dictee,${customWords.trim()}`;
      // Include other rules (excluding dictée) in the rules parameter
      const otherRules = selectedRules.filter(rule => rule !== "dictee");
      rulesValue = otherRules.join(",");
    } else {
      // Only regular rules selected
      wordsValue = "";
      rulesValue = selectedRules.join(",");
    }

    const params: OrthographyParams = {
      words: wordsValue,
      rules: rulesValue
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    setCustomWords("");
    setSelectedRules([]);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .orthography-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .orthography-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15) !important;
        }
        .orthography-card.selected {
          border-color: #fbbf24 !important;
          border-width: 2px !important;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
      `}</style>
      <Modal.Header closeButton style={{ borderBottom: '2px solid #fbbf24' }}>
        <Modal.Title style={{ color: '#d97706', fontWeight: '600' }}>
          Configuration Orthographe - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <Form>
          {/* Exercise Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-list-check me-2" style={{ color: '#fbbf24' }}></i>
              Sélection du contenu
            </h6>
            
            <Row className="g-2 mb-3">
              {orthographyRules.map(rule => (
                <Col md={6} key={rule.key}>
                  <div 
                    className={`orthography-card p-3 border ${selectedRules.includes(rule.key) ? 'selected' : ''}`}
                    style={{ 
                      border: selectedRules.includes(rule.key) ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                      position: 'relative',
                      backgroundColor: 'white'
                    }}
                    onClick={() => toggleRule(rule.key)}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: selectedRules.includes(rule.key) ? '2px solid #fbbf24' : '2px solid #d1d5db',
                          background: selectedRules.includes(rule.key) ? '#fbbf24' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          marginRight: '0.75rem',
                          flexShrink: 0
                        }}
                      >
                        {selectedRules.includes(rule.key) && (
                          <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}></i>
                        )}
                      </div>
                      <span className="fw-medium" style={{ 
                        color: selectedRules.includes(rule.key) ? '#d97706' : '#374151',
                        fontSize: '0.9rem'
                      }}>
                        {rule.label}
                      </span>
                    </div>
                    {rule.isCustom && selectedRules.includes(rule.key) && (
                      <i className="bi bi-pencil-square position-absolute" 
                         style={{ 
                           top: '8px', 
                           right: '8px', 
                           fontSize: '0.9rem',
                           color: '#f59e0b' 
                         }}>
                      </i>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
            
            {/* Custom Words Input - Show when dictée is selected */}
            {selectedRules.includes("dictee") && (
              <div className="mt-3 p-3" style={{ 
                backgroundColor: '#fffbeb',
                borderRadius: '10px',
                border: '1px solid #fcd34d'
              }}>
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold mb-2" style={{ color: '#374151' }}>
                    <i className="bi bi-pencil-fill me-2" style={{ color: '#fbbf24' }}></i>
                    Mots pour la dictée personnalisée
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="château, bâteau, forêt, être, avoir, mangé, mangée..."
                    value={customWords}
                    onChange={(e) => setCustomWords(e.target.value)}
                    style={{ 
                      borderRadius: '8px',
                      borderColor: '#fcd34d',
                      backgroundColor: 'white'
                    }}
                  />
                  <Form.Text style={{ fontSize: '0.8rem', color: '#92400e' }}>
                    <i className="bi bi-info-circle-fill me-1"></i>
                    Saisissez les mots à travailler en dictée, séparés par des virgules
                  </Form.Text>
                </Form.Group>
              </div>
            )}
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
          disabled={selectedRules.length === 0}
          style={{
            background: selectedRules.length > 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: selectedRules.length > 0 ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Valider les paramètres
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
