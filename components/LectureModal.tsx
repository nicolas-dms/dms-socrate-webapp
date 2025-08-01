"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface LectureParams {
  theme: string;
  style: string; // histoire, dialogue, culture
  length: string; // court, moyen, long
}

interface LectureModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (params: LectureParams) => void;
  initialParams?: LectureParams;
  level: string; // CE1, CE2, etc.
}

export default function LectureModal({ 
  show, 
  onHide, 
  onSave, 
  initialParams,
  level 
}: LectureModalProps) {
  const { t } = useTranslation();
  
  const [theme, setTheme] = useState("");
  const [style, setStyle] = useState("histoire");
  const [length, setLength] = useState("moyen");

  // Get style options based on level
  const getStyleOptionsByLevel = (level: string) => {
    const allOptions = [
      { value: "histoire", label: "Histoire", icon: "📖" },
      { value: "dialogue", label: "Dialogue", icon: "💬" },
      { value: "culture", label: "Culture", icon: "🏛️" },
      { value: "poeme", label: "Poème", icon: "✍️" }
    ];

    const cpSpecialOption = { value: "syllabique", label: "Lecture syllabique", icon: "🔤" };

    switch (level) {
      case "CP":
        return [
          cpSpecialOption,
          ...allOptions.filter(opt => ["histoire", "dialogue", "poeme"].includes(opt.value))
        ];
      case "CE1":
        return allOptions.filter(opt => ["histoire", "dialogue", "poeme", "culture"].includes(opt.value));
      case "CE2":
        return allOptions;
      case "CM1":
        return allOptions;
      case "CM2":
        return allOptions;
      default:
        return allOptions;
    }
  };

  // Get length options based on level
  const getLengthOptionsByLevel = (level: string) => {
    switch (level) {
      case "CP":
        return [
          { value: "court", label: "Court (3 lignes)" },
          { value: "moyen", label: "Moyen (5 lignes)" },
          { value: "long", label: "Long (10 lignes)" }
        ];
      case "CE1":
        return [
          { value: "court", label: "Court (5 lignes)" },
          { value: "moyen", label: "Moyen (10 lignes)" },
          { value: "long", label: "Long (15 lignes)" }
        ];
      case "CE2":
        return [
          { value: "court", label: "Court (8 lignes)" },
          { value: "moyen", label: "Moyen (15 lignes)" },
          { value: "long", label: "Long (20 lignes)" }
        ];
      case "CM1":
        return [
          { value: "court", label: "Court (10 lignes)" },
          { value: "moyen", label: "Moyen (20 lignes)" },
          { value: "long", label: "Long (30 lignes)" }
        ];
      case "CM2":
        return [
          { value: "court", label: "Court (15 lignes)" },
          { value: "moyen", label: "Moyen (25 lignes)" },
          { value: "long", label: "Long (40 lignes)" }
        ];
      default:
        return [
          { value: "court", label: "Court (10 lignes)" },
          { value: "moyen", label: "Moyen (20 lignes)" },
          { value: "long", label: "Long (30 lignes)" }
        ];
    }
  };

  // Get current options based on level
  const currentStyleOptions = getStyleOptionsByLevel(level);
  const currentLengthOptions = getLengthOptionsByLevel(level);
  
  useEffect(() => {
    const availableStyles = getStyleOptionsByLevel(level);
    const availableLengths = getLengthOptionsByLevel(level);

    if (initialParams) {
      setTheme(initialParams.theme || "");
      // Ensure the initial style is available for this level
      const validStyle = availableStyles.find(s => s.value === initialParams.style)?.value || availableStyles[0]?.value || "histoire";
      setStyle(validStyle);
      // Ensure the initial length is available for this level
      const validLength = availableLengths.find(l => l.value === initialParams.length)?.value || availableLengths[0]?.value || "moyen";
      setLength(validLength);
    } else {
      // Set defaults based on level
      setTheme("");
      setStyle(availableStyles[0]?.value || "histoire");
      setLength(availableLengths[0]?.value || "moyen");
    }
  }, [initialParams, level]);

  const handleSave = () => {
    const params: LectureParams = {
      theme: theme.trim(),
      style: style,
      length: length
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    const availableStyles = getStyleOptionsByLevel(level);
    const availableLengths = getLengthOptionsByLevel(level);
    
    setTheme("");
    setStyle(availableStyles[0]?.value || "histoire");
    setLength(availableLengths[0]?.value || "moyen");
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
          <i className="fas fa-book-open me-2 text-primary"></i>
          Configuration de l'exercice de lecture - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form>
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-palette me-2"></i>
              Thème de lecture
            </h6>
            
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={`Laissez vide pour un thème général adapté au niveau ${level}`}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
              <Form.Text className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Exemples : "Les animaux de la forêt", "Les saisons", "Les métiers".
              </Form.Text>
            </Form.Group>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-book-reader me-2"></i>
              Style du texte
            </h6>
            
            <div className="row g-2">
              {currentStyleOptions.map((option) => (
                <div key={option.value} className={`col-${currentStyleOptions.length <= 3 ? '4' : '3'}`}>
                  <div 
                    className={`card border border-2 selector-card ${style === option.value ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} h-100`}
                    onClick={() => setStyle(option.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body text-center p-2">
                      <div className="fs-4 mb-1">{option.icon}</div>
                      <div className={`fw-semibold small ${style === option.value ? 'text-dark-emphasis' : 'text-dark'}`}>{option.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-ruler me-2"></i>
              Longueur du texte
            </h6>
            
            <div className="row g-2">
              {currentLengthOptions.map((option) => (
                <div key={option.value} className="col-4">
                  <div 
                    className={`card border border-2 selector-card ${length === option.value ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} h-100`}
                    onClick={() => setLength(option.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body text-center p-2">
                      <div className={`fw-semibold small ${length === option.value ? 'text-dark-emphasis' : 'text-dark'}`}>{option.label}</div>
                    </div>
                  </div>
                </div>
              ))}
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
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
