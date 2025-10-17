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
        .selector-card {
          transition: all 0.3s ease;
        }
        .selector-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-pen me-2"></i>
          Configuration de l'exercice d'orthographe - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          {/* Exercise Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Sélection du contenu
            </h6>
            
            <Row className="mb-3">
              {orthographyRules.map(rule => (
                <Col md={6} key={rule.key} className="mb-2">
                  <div 
                    className={`selector-card p-2 border rounded text-center ${
                      selectedRules.includes(rule.key) 
                        ? 'border-warning-subtle bg-warning-subtle text-dark' 
                        : 'border-secondary bg-light'
                    }`}
                    onClick={() => toggleRule(rule.key)}
                    style={{ 
                      cursor: 'pointer',
                      border: selectedRules.includes(rule.key) ? '2px solid #ffc107' : '1px solid #dee2e6',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      position: 'relative'
                    }}
                  >
                    {rule.label}
                    {rule.isCustom && selectedRules.includes(rule.key) && (
                      <i className="bi bi-pencil-square position-absolute" style={{ top: '5px', right: '8px', fontSize: '0.8rem' }}></i>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
            
            {/* Custom Words Input - Show when dictée is selected */}
            {selectedRules.includes("dictee") && (
              <div className="mt-3 p-3 border rounded bg-light">
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-pencil me-2"></i>
                    Mots pour la dictée personnalisée
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="château, bâteau, forêt, être, avoir, mangé, mangée..."
                    value={customWords}
                    onChange={(e) => setCustomWords(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Saisissez les mots à travailler en dictée, séparés par des virgules
                  </Form.Text>
                </Form.Group>
              </div>
            )}
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleReset}>
          <i className="fas fa-undo me-2"></i>
          Réinitialiser
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <i className="fas fa-save me-2"></i>
          Valider les paramètres
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
