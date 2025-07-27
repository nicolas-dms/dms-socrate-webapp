"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface LectureParams {
  theme: string;
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
  
  useEffect(() => {
    if (initialParams) {
      setTheme(initialParams.theme || "");
    } else {
      // Set defaults based on level
      setTheme("");
    }
  }, [initialParams, level]);

  const handleSave = () => {
    const params: LectureParams = {
      theme: theme.trim()
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    setTheme("");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-book-open me-2 text-primary"></i>
          Configuration des exercices de lecture
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
              <Form.Label className="fw-semibold">
                Thème ou sujet souhaité (optionnel)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Décrivez le thème ou le sujet que vous souhaitez pour les exercices de lecture..."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
              <Form.Text className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Exemples : "Les animaux de la forêt", "Les saisons", "Les métiers", etc.
                Laissez vide pour un thème général adapté au niveau {level}.
              </Form.Text>
            </Form.Group>
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
