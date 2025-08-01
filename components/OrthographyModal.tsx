"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

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

const ORTHOGRAPHY_RULES = {
  CP: [
    { key: "sons_simples", label: "Sons simples (a, e, i, o, u)" },
    { key: "consonnes", label: "Consonnes de base" },
    { key: "syllabes", label: "Syllabes simples" }
  ],
  CE1: [
    { key: "sons_complexes", label: "Sons complexes (ou, on, an, in)" },
    { key: "lettres_muettes", label: "Lettres muettes" },
    { key: "doubles_consonnes", label: "Doubles consonnes" },
    { key: "accents", label: "Les accents" }
  ],
  CE2: [
    { key: "homophones", label: "Homophones (a/à, et/est, son/sont)" },
    { key: "pluriels", label: "Pluriels en -s, -x" },
    { key: "feminins", label: "Féminins des mots" },
    { key: "g_gu", label: "g/gu devant e, i" }
  ],
  CM1: [
    { key: "homophones_complexes", label: "Homophones complexes" },
    { key: "accord_participe", label: "Accord du participe passé" },
    { key: "mots_invariables", label: "Mots invariables" },
    { key: "prefixes_suffixes", label: "Préfixes et suffixes" }
  ],
  CM2: [
    { key: "accord_participe_avance", label: "Accord du participe passé avancé" },
    { key: "subjonctif", label: "Terminaisons du subjonctif" },
    { key: "mots_complexes", label: "Orthographe des mots complexes" },
    { key: "etymologie", label: "Étymologie et orthographe" }
  ]
};

export default function OrthographyModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: OrthographyModalProps) {
  const { t } = useTranslation();
  
  const [customWords, setCustomWords] = useState("");
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [useCustomWords, setUseCustomWords] = useState(false);
  
  useEffect(() => {
    if (initialParams) {
      setCustomWords(initialParams.words || "");
      setSelectedRules(initialParams.rules ? initialParams.rules.split(",") : []);
      setUseCustomWords(!!initialParams.words);
    } else {
      // Set defaults based on level
      setCustomWords("");
      setSelectedRules(["sons_simples"]);
      setUseCustomWords(false);
    }
  }, [initialParams, level]);

  const toggleRule = (ruleKey: string) => {
    if (useCustomWords) return;
    
    setSelectedRules(prev => 
      prev.includes(ruleKey)
        ? prev.filter(r => r !== ruleKey)
        : [...prev, ruleKey]
    );
  };

  const handleSave = () => {
    let wordsValue = "";
    let rulesValue = "";

    if (useCustomWords) {
      if (!customWords.trim()) {
        alert("Veuillez saisir des mots personnalisés ou sélectionner des règles d'orthographe");
        return;
      }
      wordsValue = customWords.trim();
      rulesValue = "";
    } else {
      if (selectedRules.length === 0) {
        alert("Veuillez sélectionner au moins une règle d'orthographe");
        return;
      }
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
    setUseCustomWords(false);
    setCustomWords("");
    setSelectedRules(["sons_simples"]);
  };

  const currentRules = ORTHOGRAPHY_RULES[level as keyof typeof ORTHOGRAPHY_RULES] || ORTHOGRAPHY_RULES.CE1;

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
          {/* Rules vs Custom Words Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Sélection du contenu
            </h6>
            
            <Form.Check
              type="radio"
              name="orthoChoice"
              id="rules"
              label="Choisir par règles d'orthographe"
              checked={!useCustomWords}
              onChange={() => setUseCustomWords(false)}
              className="mb-3"
            />
            
            {!useCustomWords && (
              <Row className="mb-3">
                {currentRules.map(rule => (
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
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {rule.label}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            
            <Form.Check
              type="radio"
              name="orthoChoice"
              id="custom"
              label="Mots personnalisés"
              checked={useCustomWords}
              onChange={() => setUseCustomWords(true)}
              className="mb-3"
            />
            
            {useCustomWords && (
              <Form.Group className="mb-3">
                <Form.Label>Mots pour les exercices d'orthographe (séparés par des virgules)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="château, bâteau, forêt, être, avoir, mangé, mangée..."
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Saisissez les mots à travailler en orthographe, séparés par des virgules
                </Form.Text>
              </Form.Group>
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
