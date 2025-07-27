"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface GrammarParams {
  types: string;
}

interface GrammarModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: GrammarParams) => void;
  initialParams?: GrammarParams;
  level: string; // CE1, CE2, etc.
}

const GRAMMAR_TYPES = {
  CP: [
    { key: "majuscules", label: "Majuscules et points" },
    { key: "genre", label: "Masculin/Féminin" },
    { key: "singulier_pluriel", label: "Singulier/Pluriel" }
  ],
  CE1: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "singulier_pluriel", label: "Singulier-Pluriel" },
    { key: "genre", label: "Masculin/Féminin" },
    { key: "determinants", label: "Les déterminants" }
  ],
  CE2: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "singulier_pluriel", label: "Singulier-Pluriel" },
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments" }
  ],
  CM1: [
    { key: "sujet_verbe", label: "Sujet-Verbe" },
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments du verbe" },
    { key: "propositions", label: "Propositions" }
  ],
  CM2: [
    { key: "accord_adjectif", label: "Accord des adjectifs" },
    { key: "complement", label: "Compléments" },
    { key: "propositions", label: "Propositions indépendantes" },
    { key: "voix", label: "Voix active/passive" }
  ]
};

export default function GrammarModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: GrammarModalProps) {
  const { t } = useTranslation();
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  useEffect(() => {
    if (initialParams) {
      setSelectedTypes(initialParams.types.split(","));
    } else {
      // Set defaults based on level
      setSelectedTypes(["sujet_verbe"]);
    }
  }, [initialParams, level]);

  const toggleType = (typeKey: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeKey)
        ? prev.filter(t => t !== typeKey)
        : [...prev, typeKey]
    );
  };

  const handleSave = () => {
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un type d'exercice de grammaire");
      return;
    }

    const params: GrammarParams = {
      types: selectedTypes.join(",")
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    setSelectedTypes(["sujet_verbe"]);
  };

  const currentTypes = GRAMMAR_TYPES[level as keyof typeof GRAMMAR_TYPES] || GRAMMAR_TYPES.CE1;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-book me-2"></i>
          Paramètres de grammaire - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          {/* Grammar Types Selection */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-list-ul me-2"></i>
              Types d'exercices de grammaire
            </h6>
            
            <Row>
              {currentTypes.map(type => (
                <Col md={6} key={type.key} className="mb-2">
                  <div 
                    className={`p-2 border rounded text-center cursor-pointer ${
                      selectedTypes.includes(type.key) 
                        ? 'border-warning bg-warning text-dark' 
                        : 'border-secondary'
                    }`}
                    onClick={() => toggleType(type.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {type.label}
                  </div>
                </Col>
              ))}
            </Row>
            
            <div className="mt-2">
              <small className="text-muted">
                Sélectionnés: {selectedTypes.length > 0 
                  ? currentTypes.filter(t => selectedTypes.includes(t.key)).map(t => t.label).join(", ")
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
