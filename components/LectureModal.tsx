"use client";
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

// Import theme suggestions
import lectureThemesRaw from "../config/lectureThemes.json";

export interface LectureParams {
  theme: string;
  style: string; // histoire, dialogue, culture
  length: string; // court, moyen, long
  fluence?: boolean; // Évaluer la fluence sur le texte
}

interface ThemeSuggestion {
  theme: string;
  types_de_textes: string[];
  description: string;
  tags: string[];
}

interface LectureThemeLevel {
  niveau: string;
  themes: ThemeSuggestion[];
}

const lectureThemesData = lectureThemesRaw as LectureThemeLevel[];

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
  const [fluence, setFluence] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);

  // Get theme suggestions filtered by level and style
  const themeSuggestions = useMemo(() => {
    const levelData = lectureThemesData.find(item => item.niveau === level);
    if (!levelData) return [];

    const allThemes = levelData.themes;
    
    // Filter themes by text type (style)
    return allThemes.filter(t => 
      t.types_de_textes.includes(style)
    );
  }, [level, style]);

  // Get style options based on level
  const getStyleOptionsByLevel = (level: string) => {
    const allOptions = [
      { value: "histoire", label: "Histoire", icon: "📖" },
      { value: "culture", label: "Culture & découverte", icon: "🏛️" }
    ];

    const cpSpecialOption = { value: "syllabique", label: "Lecture syllabique", icon: "🔤" };

    switch (level) {
      case "CP":
        return [
          cpSpecialOption,
          ...allOptions.filter(opt => ["histoire"].includes(opt.value))
        ];
      case "CE1":
        return allOptions.filter(opt => ["histoire", "culture"].includes(opt.value));
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

  // Get length options - simplified to Court/Moyen/Long (backend will calculate lines)
  const getLengthOptionsByLevel = (level: string) => {
    return [
      { value: "court", label: "Court" },
      { value: "moyen", label: "Moyen" },
      { value: "long", label: "Long" }
    ];
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
      setFluence(initialParams.fluence || false);
    } else {
      // Set defaults based on level
      const defaultStyle = availableStyles[0]?.value || "histoire";
      setStyle(defaultStyle);
      
      // Pick a random theme from the level's themes that match the default style
      const levelData = lectureThemesData.find(item => item.niveau === level);
      const allThemes = levelData?.themes || [];
      const filteredThemes = allThemes.filter(t => 
        t.types_de_textes.includes(defaultStyle)
      );
      
      if (filteredThemes.length > 0) {
        const randomTheme = filteredThemes[Math.floor(Math.random() * filteredThemes.length)];
        setTheme(randomTheme.theme);
      } else {
        setTheme("");
      }
      
      setLength("moyen"); // Always default to "moyen" for all levels
      setFluence(false);
    }
  }, [initialParams, level]);

  const handleSave = () => {
    const params: LectureParams = {
      theme: theme.trim(),
      style: style,
      length: length,
      fluence: fluence
    };

    onSave(params);
    onHide();
  };

  const handleReset = () => {
    const availableStyles = getStyleOptionsByLevel(level);
    const defaultStyle = availableStyles[0]?.value || "histoire";
    
    // Pick a random theme from the level's themes that match the default style
    const levelData = lectureThemesData.find(item => item.niveau === level);
    const allThemes = levelData?.themes || [];
    const filteredThemes = allThemes.filter(t => 
      t.types_de_textes.includes(defaultStyle)
    );
    
    if (filteredThemes.length > 0) {
      const randomTheme = filteredThemes[Math.floor(Math.random() * filteredThemes.length)];
      setTheme(randomTheme.theme);
    } else {
      setTheme("");
    }
    
    setStyle(defaultStyle);
    setLength("moyen"); // Always default to "moyen" for all levels
    setFluence(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <style jsx>{`
        .lecture-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        .lecture-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.15) !important;
        }
        .lecture-card.selected {
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
          Configuration Lecture - {level}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ backgroundColor: 'white' }}>
        <Form>
          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-bookmark-fill me-2" style={{ color: '#fbbf24' }}></i>
              Style du texte
            </h6>
            
            <div className="row g-2">
              {currentStyleOptions.map((option) => (
                <div key={option.value} className={`col-${currentStyleOptions.length <= 3 ? '4' : '3'}`}>
                  <div 
                    className={`lecture-card card border ${style === option.value ? 'selected' : ''}`}
                    onClick={() => setStyle(option.value)}
                    style={{ 
                      border: style === option.value ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                  >
                    <div className="card-body text-center p-2">
                      <div className="fs-4 mb-1">{option.icon}</div>
                      <div className="fw-semibold small" style={{ color: style === option.value ? '#d97706' : '#374151' }}>
                        {option.label}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-palette-fill me-2" style={{ color: '#fbbf24' }}></i>
              Thème de lecture
            </h6>

            {/* Theme suggestions as clickable pills */}
            {themeSuggestions.length > 0 && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <small className="text-muted">
                    <i className="bi bi-lightbulb-fill me-1" style={{ color: '#fbbf24' }}></i>
                    Suggestions de thèmes :
                  </small>
                  {themeSuggestions.length > 6 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 text-decoration-none"
                      onClick={() => setShowAllThemes(!showAllThemes)}
                      style={{ color: '#d97706' }}
                    >
                      {showAllThemes ? 'Voir moins' : `Voir tout (${themeSuggestions.length})`}
                    </Button>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {(showAllThemes ? themeSuggestions : themeSuggestions.slice(0, 6)).map((suggestion, index) => (
                    <Badge
                      key={index}
                      bg="light"
                      text="dark"
                      className="border py-2 px-3"
                      style={{ 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'normal',
                        transition: 'all 0.2s ease',
                        borderColor: '#e5e7eb',
                        backgroundColor: 'white'
                      }}
                      onClick={() => setTheme(suggestion.theme)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fffbeb';
                        e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                      title={suggestion.description}
                    >
                      {suggestion.theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={2}
                value={theme}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 60) {
                    setTheme(value);
                  }
                }}
                placeholder={!theme.trim() ? "Veuillez saisir un thème" : "Thème personnalisé ou sélectionnez une suggestion ci-dessus"}
                className={!theme.trim() ? 'border-danger' : ''}
                style={{ 
                  resize: 'vertical', 
                  minHeight: '70px',
                  borderRadius: '8px',
                  border: theme.trim() ? '2px solid #fbbf24' : (!theme.trim() ? undefined : '1px solid #e5e7eb'),
                  backgroundColor: theme.trim() ? '#fffbeb' : 'white',
                  transition: 'all 0.3s ease'
                }}
                maxLength={60}
              />
              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Cliquez sur une suggestion ci-dessus ou saisissez votre propre thème. ({theme.length}/60 caractères)
              </Form.Text>
            </Form.Group>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#374151' }}>
              <i className="bi bi-rulers me-2" style={{ color: '#fbbf24' }}></i>
              Longueur du texte
            </h6>
            
            <div className="row g-2">
              {currentLengthOptions.map((option) => (
                <div key={option.value} className="col-4">
                  <div 
                    className={`lecture-card card border ${length === option.value ? 'selected' : ''}`}
                    onClick={() => setLength(option.value)}
                    style={{ 
                      border: length === option.value ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                      backgroundColor: 'white'
                    }}
                  >
                    <div className="card-body text-center p-2">
                      <div className="fw-semibold small" style={{ color: length === option.value ? '#d97706' : '#374151' }}>
                        {option.label}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3 p-3" style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #fcd34d'
          }}>
            <Form.Check 
              type="checkbox"
              id="fluence-checkbox"
              label={<span className="fw-medium" style={{ color: '#374151' }}>Fluence</span>}
              checked={fluence}
              onChange={(e) => setFluence(e.target.checked)}
              className="user-select-none"
            />
            <Form.Text style={{ fontSize: '0.8rem' }} className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Ajoute une évaluation de la vitesse et de la fluidité de lecture.
            </Form.Text>
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
          disabled={!theme.trim()}
          style={{
            background: theme.trim() ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            padding: '0.5rem 1.5rem',
            boxShadow: theme.trim() ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
