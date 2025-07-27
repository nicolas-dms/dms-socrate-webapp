"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ConjugationParams {
  verbs: string;
  tenses: string;
}

interface ConjugationModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: ConjugationParams) => void;
  initialParams?: ConjugationParams;
  level: string; // CE1, CE2, etc.
}

const VERB_GROUPS = {
  CP: [
    { key: "1er_groupe_simple", label: "1er groupe - verbes simples", examples: "être, avoir, aller..." },
  ],
  CE1: [
    { key: "1er_groupe", label: "1er groupe (verbes en -er)", examples: "aimer, chanter, jouer..." },
    { key: "verbes_frequents", label: "Verbes fréquents", examples: "être, avoir, aller, faire..." }
  ],
  CE2: [
    { key: "1er_groupe", label: "1er groupe (verbes en -er)", examples: "aimer, chanter, jouer..." },
    { key: "2eme_groupe", label: "2ème groupe (verbes en -ir)", examples: "finir, grandir, choisir..." },
    { key: "verbes_frequents", label: "Verbes fréquents", examples: "être, avoir, aller, faire..." }
  ],
  CM1: [
    { key: "1er_groupe", label: "1er groupe (verbes en -er)", examples: "aimer, chanter, jouer..." },
    { key: "2eme_groupe", label: "2ème groupe (verbes en -ir)", examples: "finir, grandir, choisir..." },
    { key: "3eme_groupe", label: "3ème groupe (verbes irréguliers)", examples: "être, avoir, aller, faire..." }
  ],
  CM2: [
    { key: "1er_groupe", label: "1er groupe (verbes en -er)", examples: "aimer, chanter, jouer..." },
    { key: "2eme_groupe", label: "2ème groupe (verbes en -ir)", examples: "finir, grandir, choisir..." },
    { key: "3eme_groupe", label: "3ème groupe (verbes irréguliers)", examples: "être, avoir, aller, faire..." }
  ]
};

const TENSES = {
  CP: [
    { key: "present", label: "Présent" },
  ],
  CE1: [
    { key: "present", label: "Présent" },
    { key: "futur", label: "Futur simple" },
  ],
  CE2: [
    { key: "present", label: "Présent" },
    { key: "imparfait", label: "Imparfait" },
    { key: "futur", label: "Futur simple" },
  ],
  CM1: [
    { key: "present", label: "Présent" },
    { key: "imparfait", label: "Imparfait" },
    { key: "futur", label: "Futur simple" },
    { key: "passe_compose", label: "Passé composé" },
  ],
  CM2: [
    { key: "present", label: "Présent" },
    { key: "imparfait", label: "Imparfait" },
    { key: "futur", label: "Futur simple" },
    { key: "passe_compose", label: "Passé composé" },
    { key: "passe_simple", label: "Passé simple" },
    { key: "conditionnel", label: "Conditionnel" }
  ]
};

export default function ConjugationModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: ConjugationModalProps) {
  const { t } = useTranslation();
  
  // State for verb selection
  const [selectedVerbGroups, setSelectedVerbGroups] = useState<string[]>(["1er_groupe"]);
  const [customVerbs, setCustomVerbs] = useState("");
  const [useCustomVerbs, setUseCustomVerbs] = useState(false);
  
  // State for tense selection
  const [selectedTenses, setSelectedTenses] = useState<string[]>(["present"]);
  
  // Get level-specific options
  const currentVerbGroups = VERB_GROUPS[level as keyof typeof VERB_GROUPS] || VERB_GROUPS.CE1;
  const currentTenses = TENSES[level as keyof typeof TENSES] || TENSES.CE1;
  
  useEffect(() => {
    if (initialParams) {
      // Parse existing params if available
      const verbs = initialParams.verbs;
      const tenses = initialParams.tenses.split(",");
      
      setSelectedTenses(tenses);
      
      // Check if it's custom verbs or groups
      if (verbs.includes(",") && !currentVerbGroups.some(g => verbs.includes(g.key))) {
        setUseCustomVerbs(true);
        setCustomVerbs(verbs);
        setSelectedVerbGroups([]);
      } else {
        setUseCustomVerbs(false);
        setCustomVerbs("");
        const groups = currentVerbGroups.filter(g => verbs.includes(g.key)).map(g => g.key);
        setSelectedVerbGroups(groups);
      }
    } else {
      // Set defaults based on level
      const defaultGroups = level === "CP" ? ["1er_groupe_simple"] : ["1er_groupe"];
      const defaultTenses = ["present"];
      
      setSelectedVerbGroups(defaultGroups);
      setSelectedTenses(defaultTenses);
    }
  }, [initialParams, level, currentVerbGroups]);

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
      alert("Veuillez sélectionner au moins un temps de conjugaison");
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
    const defaultGroups = level === "CP" ? ["1er_groupe_simple"] : ["1er_groupe"];
    const defaultTenses = ["present"];
    
    setSelectedVerbGroups(defaultGroups);
    setSelectedTenses(defaultTenses);
    setUseCustomVerbs(false);
    setCustomVerbs("");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-cog me-2"></i>
          Paramètres de conjugaison - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          {/* Verb Selection Section */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Sélection des verbes
            </h6>
            
            <Form.Check
              type="radio"
              name="verbChoice"
              id="groups"
              label="Choisir par groupes de verbes"
              checked={!useCustomVerbs}
              onChange={() => setUseCustomVerbs(false)}
              className="mb-3"
            />
            
            {!useCustomVerbs && (
              <Row className="mb-3">
                {currentVerbGroups.map(group => (
                  <Col md={12} key={group.key} className="mb-2">
                    <div 
                      className={`p-3 border rounded cursor-pointer ${
                        selectedVerbGroups.includes(group.key) 
                          ? 'border-warning bg-warning' 
                          : 'border-secondary'
                      }`}
                      onClick={() => toggleVerbGroup(group.key)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{group.label}</strong>
                          <div className="text-muted small">{group.examples}</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            
            <Form.Check
              type="radio"
              name="verbChoice"
              id="custom"
              label="Verbes personnalisés"
              checked={useCustomVerbs}
              onChange={() => setUseCustomVerbs(true)}
              className="mb-3"
            />
            
            {useCustomVerbs && (
              <Form.Group className="mb-3">
                <Form.Label>Verbes (séparés par des virgules)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="être, avoir, aller, faire, dire, voir, venir..."
                  value={customVerbs}
                  onChange={(e) => setCustomVerbs(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Saisissez les verbes à l'infinitif, séparés par des virgules
                </Form.Text>
              </Form.Group>
            )}
          </div>

          {/* Tense Selection Section */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-clock me-2"></i>
              Temps de conjugaison
            </h6>
            
            <Row>
              {currentTenses.map(tense => (
                <Col md={6} key={tense.key} className="mb-2">
                  <div 
                    className={`p-2 border rounded text-center cursor-pointer ${
                      selectedTenses.includes(tense.key) 
                        ? 'border-warning bg-warning text-dark' 
                        : 'border-secondary'
                    }`}
                    onClick={() => toggleTense(tense.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tense.label}
                  </div>
                </Col>
              ))}
            </Row>
            
            <div className="mt-2">
              <small className="text-muted">
                Sélectionnés: {selectedTenses.length > 0 
                  ? currentTenses.filter(t => selectedTenses.includes(t.key)).map(t => t.label).join(", ")
                  : "Aucun"
                }
              </small>
            </div>
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
