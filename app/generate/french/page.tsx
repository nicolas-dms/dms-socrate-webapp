"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import LectureModal, { LectureParams } from "../../../components/LectureModal";
import ConjugationModal, { ConjugationParams } from "../../../components/ConjugationModal";
import GrammarModal, { GrammarParams } from "../../../components/GrammarModal";
import VocabularyModal, { VocabularyParams } from "../../../components/VocabularyModal";
import OrthographyModal, { OrthographyParams } from "../../../components/OrthographyModal";
import { useSubscription } from "../../../context/SubscriptionContext";
import { pdfGenerationService, GenerationResponse } from "../../../services/pdfGenerationService";
import { ExerciceDomain, ExerciceTypeParam } from "../../../types/exerciceTypes";
import { EXERCISE_CONTENT_CALCULATOR } from "../../../utils/pdfGenerationConfig";
import { previewBackendRequest } from "../../../utils/requestPreview";
import styles from "../../page.module.css";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const durations = ["20 min", "30 min", "40 min"];

interface ExercisePreview {
  level: string;
  duration: string;
  types: string[];
  theme: string;
  content: {
    readingTexts: number;
    comprehensionQuestions: number;
    grammarExercises: number;
    conjugationExercises: number;
    vocabularyExercises: number;
    spellingExercises: number;
  };
}

export default function GenerateFrenchPage() {
  const { t } = useTranslation();
  const { subscription, canGenerateMore, getRemainingFiches, useCredit } = useSubscription();
  
  // Form state
  const [level, setLevel] = useState("CE1");
  const [duration, setDuration] = useState("30 min");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Exercise type parameters
  const [exerciceTypeParams, setExerciceTypeParams] = useState<ExerciceTypeParam>({});
  
  // Modal states
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showConjugationModal, setShowConjugationModal] = useState(false);
  const [showGrammarModal, setShowGrammarModal] = useState(false);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [showOrthographyModal, setShowOrthographyModal] = useState(false);
    // Modal and generation state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);
  const [preview, setPreview] = useState<ExercisePreview | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  const frenchTypes = [
    { key: "lecture", label: "Lecture" },
    { key: "comprehension", label: "Compréhension" },
    { key: "grammaire", label: "Grammaire" },
    { key: "conjugaison", label: "Conjugaison" },
    { key: "vocabulaire", label: "Vocabulaire" },
    { key: "orthographe", label: "Orthographe" },
  ];  
  const toggleType = (type: string) => {
    const exerciseTypesWithModals = ["lecture", "conjugaison", "grammaire", "vocabulaire", "orthographe"];
    
    // Special handling for comprehension - cannot be selected without lecture
    if (type === "comprehension") {
      if (!selectedTypes.includes("lecture")) {
        // Cannot select comprehension without lecture
        alert("Vous devez d'abord sélectionner 'Lecture' pour pouvoir choisir 'Compréhension'");
        return;
      }
      // Simple toggle for comprehension when lecture is selected
      setSelectedTypes(selectedTypes.includes(type)
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes, type]);
      return;
    }
    
    if (exerciseTypesWithModals.includes(type)) {
      if (selectedTypes.includes(type)) {
        // Special handling for lecture - remove comprehension too if present
        if (type === "lecture") {
          setSelectedTypes(selectedTypes.filter(t => t !== type && t !== "comprehension"));
        } else {
          setSelectedTypes(selectedTypes.filter(t => t !== type));
        }
        
        // Remove exercise type params
        const newParams = { ...exerciceTypeParams };
        delete newParams[type];
        setExerciceTypeParams(newParams);
      } else {
        // Show modal to configure parameters
        switch (type) {
          case "lecture":
            setShowLectureModal(true);
            break;
          case "conjugaison":
            setShowConjugationModal(true);
            break;
          case "grammaire":
            setShowGrammarModal(true);
            break;
          case "vocabulaire":
            setShowVocabularyModal(true);
            break;
          case "orthographe":
            setShowOrthographyModal(true);
            break;
        }
      }
    } else {
      // Simple toggle for other types without parameters
      setSelectedTypes(selectedTypes.includes(type)
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes, type]);
    }
  };

  const handleLectureSave = (params: LectureParams) => {
    // Add lecture to selected types
    if (!selectedTypes.includes("lecture")) {
      setSelectedTypes([...selectedTypes, "lecture"]);
    }
    
    // Save lecture parameters
    setExerciceTypeParams({
      ...exerciceTypeParams,
      lecture: {
        theme: params.theme
      }
    });
  };

  const handleConjugationSave = (params: ConjugationParams) => {
    // Add conjugaison to selected types
    if (!selectedTypes.includes("conjugaison")) {
      setSelectedTypes([...selectedTypes, "conjugaison"]);
    }
    
    // Save conjugaison parameters (convert to Record<string, string>)
    setExerciceTypeParams({
      ...exerciceTypeParams,
      conjugaison: {
        verbs: params.verbs,
        tenses: params.tenses
      }
    });
  };

  const handleGrammarSave = (params: GrammarParams) => {
    if (!selectedTypes.includes("grammaire")) {
      setSelectedTypes([...selectedTypes, "grammaire"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      grammaire: {
        types: params.types
      }
    });
  };

  const handleVocabularySave = (params: VocabularyParams) => {
    if (!selectedTypes.includes("vocabulaire")) {
      setSelectedTypes([...selectedTypes, "vocabulaire"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      vocabulaire: {
        words: params.words,
        theme: params.theme
      }
    });
  };

  const handleOrthographySave = (params: OrthographyParams) => {
    if (!selectedTypes.includes("orthographe")) {
      setSelectedTypes([...selectedTypes, "orthographe"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      orthographe: {
        words: params.words,
        rules: params.rules
      }
    });
  };

  const handleEditLectureParams = () => {
    setShowLectureModal(true);
  };

  const handleEditConjugationParams = () => {
    setShowConjugationModal(true);
  };

  const handleEditGrammarParams = () => {
    setShowGrammarModal(true);
  };

  const handleEditVocabularyParams = () => {
    setShowVocabularyModal(true);
  };

  const handleEditOrthographyParams = () => {
    setShowOrthographyModal(true);
  };
  // Generate preview based on selections
  const generatePreview = (): ExercisePreview => {
    const lectureTheme = exerciceTypeParams.lecture?.theme || "";
    const content = EXERCISE_CONTENT_CALCULATOR.calculateContent(duration, selectedTypes, level);

    return {
      level,
      duration,
      types: selectedTypes,
      theme: lectureTheme,
      content,
    };
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un type d'exercice");
      return;
    }
    
    const previewData = generatePreview();
    setPreview(previewData);
    setShowPreviewModal(true);
  };
  const handleConfirmGeneration = async () => {
    setShowPreviewModal(false);
    setShowGeneratingModal(true);
    
    try {
      // Check subscription limits before generation
      if (!canGenerateMore()) {
        throw new Error("Limite d'abonnement atteinte pour ce mois");
      }      // Use 1 fiche from subscription allowance
      await useCredit();
      
      // Get lecture theme from parameters
      const lectureTheme = exerciceTypeParams.lecture?.theme || "";
      
      // Preview the backend request (for debugging)
      previewBackendRequest(level, duration, selectedTypes, lectureTheme || "Exercices généraux");
      
      // Call the PDF generation service
      const response = await pdfGenerationService.generatePDF(
        level,
        duration,
        selectedTypes,
        lectureTheme || "Exercices généraux",
        ExerciceDomain.FRANCAIS,
        exerciceTypeParams, // Pass exercise type parameters
        undefined // specific requirements
      );
      
      setCurrentGenerationId(response.id);
      
      // For mock API, we simulate immediate completion
      // In real implementation, you would poll for status
      setTimeout(() => {
        if (response.status === 'completed' && response.pdf_url) {
          setPdfUrl(response.pdf_url);
          setShowGeneratingModal(false);
          setShowSuccessModal(true);
          setCanRegenerate(true);
        } else {
          throw new Error(response.error_message || "Erreur lors de la génération du PDF");
        }
      }, 2000);
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      setErrorMessage(error.message || "Une erreur inattendue s'est produite");
      setShowGeneratingModal(false);
      setShowErrorModal(true);
    }
  };
  const handleRegenerate = async () => {
    if (!canRegenerate || !currentGenerationId) return;
    
    setShowErrorModal(false);
    setShowGeneratingModal(true);
    setCanRegenerate(false); // Only one free regeneration
    
    try {
      // Call the regeneration service
      const response = await pdfGenerationService.regeneratePDF(currentGenerationId);
      
      // For mock API, we simulate immediate completion
      setTimeout(() => {
        if (response.status === 'completed' && response.pdf_url) {
          setPdfUrl(response.pdf_url);
          setShowGeneratingModal(false);
          setShowSuccessModal(true);
        } else {
          throw new Error(response.error_message || "Erreur lors de la régénération du PDF");
        }
      }, 1500);
      
    } catch (error: any) {
      console.error("Regeneration failed:", error);
      setErrorMessage(error.message || "Une erreur inattendue s'est produite lors de la régénération");
      setShowGeneratingModal(false);
      setShowErrorModal(true);
    }
  };
  const resetFlow = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowPreviewModal(false);
    setShowGeneratingModal(false);
    setPdfUrl(null);
    setCanRegenerate(false);
    setErrorMessage("");
    setCurrentGenerationId(null);
  };return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row className="justify-content-center">
          <Col lg={10}>
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
                Exercices de Français
              </h2>
              <hr className="w-25 mx-auto mt-3 mb-4" style={{ height: '2px', background: 'linear-gradient(90deg, #6c757d, #adb5bd)', border: 'none', borderRadius: '1px' }} />
            </div>
            
              <Card className="shadow-sm border-0">
              <Card.Body className="p-3">                <form onSubmit={handlePreview}>
                  {/* Level and Duration Selection - Side by Side */}
                  <Row className="mb-3">
                    <Col md={6}>
                      <h5 className="mb-2 fw-semibold text-dark">
                        <i className="fas fa-graduation-cap me-2 text-primary"></i>
                        Niveau
                      </h5>
                      <div className="d-flex gap-2 flex-wrap">
                        {levels.map((lvl) => (
                          <Button
                            key={lvl}
                            variant={level === lvl ? "warning" : "outline-secondary"}
                            className={styles.selectorBtn}
                            onClick={() => setLevel(lvl)}
                            type="button"
                          >
                            {lvl}
                          </Button>
                        ))}
                      </div>
                    </Col>
                    <Col md={6}>
                      <h5 className="mb-2 fw-semibold text-dark">
                        <i className="fas fa-clock me-2 text-primary"></i>
                        Durée de la séance
                      </h5>
                      <div className="d-flex gap-2 flex-wrap">
                        {durations.map((dur) => (
                          <Button
                            key={dur}
                            variant={duration === dur ? "warning" : "outline-secondary"}
                            className={styles.selectorBtn}
                            onClick={() => setDuration(dur)}
                            type="button"
                          >
                            {dur}
                          </Button>
                        ))}
                      </div>
                    </Col>
                  </Row>                  {/* Exercise Types Selection */}
                  <div className="mb-3">
                    <h5 className="mb-2">Types d'exercices</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      {frenchTypes.map(type => {
                        const hasSettings = ["lecture", "conjugaison", "grammaire", "vocabulaire", "orthographe"].includes(type.key);
                        const isComprehensionDisabled = type.key === "comprehension" && !selectedTypes.includes("lecture");
                        
                        return (
                          <div key={type.key} className="position-relative">
                            <Button
                              variant={selectedTypes.includes(type.key) ? "warning" : "outline-secondary"}
                              className={styles.selectorBtn}
                              onClick={() => toggleType(type.key)}
                              type="button"
                              disabled={isComprehensionDisabled}
                              title={isComprehensionDisabled ? "Vous devez d'abord sélectionner 'Lecture'" : ""}
                            >
                              {type.label}
                              {isComprehensionDisabled && (
                                <span className="ms-1 text-muted">
                                  <i className="fas fa-lock" style={{ fontSize: '0.8em' }}></i>
                                </span>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <small className="text-muted">Sélectionnez un ou plusieurs types d'exercices</small>
                  </div>

                  {/* Exercise Parameters Section */}
                  <div className="mb-3">
                    {(selectedTypes.some(type => exerciceTypeParams[type])) && (
                      <div>
                        <h6 className="mb-2 text-muted">Paramètres des exercices</h6>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Lecture parameters */}
                          {selectedTypes.includes("lecture") && exerciceTypeParams.lecture && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditLectureParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                                e.currentTarget.style.borderColor = '#007bff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }}
                              title="Cliquer pour modifier les paramètres"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="fas fa-book-open me-1"></i>
                                  Lecture
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.lecture.theme || "Thème général"}
                                </div>
                              </div>
                              <i className="fas fa-edit text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}
                          
                          {/* Conjugation parameters */}
                          {selectedTypes.includes("conjugaison") && exerciceTypeParams.conjugaison && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditConjugationParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                                e.currentTarget.style.borderColor = '#007bff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }}
                              title="Cliquer pour modifier les paramètres"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="fas fa-cog me-1"></i>
                                  Conjugaison
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.conjugaison.verbs} • {exerciceTypeParams.conjugaison.tenses}
                                </div>
                              </div>
                              <i className="fas fa-edit text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}

                          {/* Grammar parameters */}
                          {selectedTypes.includes("grammaire") && exerciceTypeParams.grammaire && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditGrammarParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                                e.currentTarget.style.borderColor = '#007bff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }}
                              title="Cliquer pour modifier les paramètres"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="fas fa-book me-1"></i>
                                  Grammaire
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.grammaire.types}
                                </div>
                              </div>
                              <i className="fas fa-edit text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}

                          {/* Vocabulary parameters */}
                          {selectedTypes.includes("vocabulaire") && exerciceTypeParams.vocabulaire && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditVocabularyParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                                e.currentTarget.style.borderColor = '#007bff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }}
                              title="Cliquer pour modifier les paramètres"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="fas fa-spell-check me-1"></i>
                                  Vocabulaire
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.vocabulaire.words || exerciceTypeParams.vocabulaire.theme}
                                </div>
                              </div>
                              <i className="fas fa-edit text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}

                          {/* Orthography parameters */}
                          {selectedTypes.includes("orthographe") && exerciceTypeParams.orthographe && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditOrthographyParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e9ecef';
                                e.currentTarget.style.borderColor = '#007bff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }}
                              title="Cliquer pour modifier les paramètres"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="fas fa-pen me-1"></i>
                                  Orthographe
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.orthographe.words || exerciceTypeParams.orthographe.rules}
                                </div>
                              </div>
                              <i className="fas fa-edit text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <div className="d-grid gap-2 mt-3">
                    <Button 
                      type="submit" 
                      disabled={selectedTypes.length === 0}
                      className={styles.ctaPrimary}
                      size="lg"
                    >
                      Aperçu de la fiche ({level} - {duration})
                    </Button>                    {subscription && (() => {
                      const remainingFiches = getRemainingFiches();
                      const monthlyLimit = subscription.monthlyLimit || 0;
                      const tenPercentLimit = Math.floor(monthlyLimit * 0.1);
                      
                      return remainingFiches <= tenPercentLimit && (
                        <small className="text-center text-warning">
                          ⚠️ Attention : Il vous reste seulement {remainingFiches} fiches ce mois • Coût : 1 fiche
                        </small>
                      );
                    })()}
                  </div>
                </form>
              </Card.Body>
            </Card>
          </Col>
        </Row>        {/* Preview Modal */}
        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered className="preview-modal">
          <Modal.Header closeButton>
            <Modal.Title>Aperçu de votre fiche</Modal.Title>
          </Modal.Header>
          <Modal.Body className="preview-content">
            {preview && (
              <div>
                <Alert variant="info" className="mb-3">
                  <h6 className="mb-2">Cette fiche contiendra :</h6>
                  <ul className="mb-0">
                    {preview.content.readingTexts > 0 && (
                      <li>{preview.content.readingTexts} texte{preview.content.readingTexts > 1 ? 's' : ''} de lecture
                        {preview.theme && <span> sur le thème "{preview.theme}"</span>}
                      </li>
                    )}
                    {preview.content.comprehensionQuestions > 0 && (
                      <li>{preview.content.comprehensionQuestions} questions de compréhension</li>
                    )}
                    {preview.content.grammarExercises > 0 && (
                      <li>{preview.content.grammarExercises} exercices de grammaire</li>
                    )}
                    {preview.content.conjugationExercises > 0 && (
                      <li>{preview.content.conjugationExercises} exercices de conjugaison</li>
                    )}
                    {preview.content.vocabularyExercises > 0 && (
                      <li>{preview.content.vocabularyExercises} exercices de vocabulaire</li>
                    )}
                    {preview.content.spellingExercises > 0 && (
                      <li>{preview.content.spellingExercises} exercices d'orthographe</li>
                    )}
                  </ul>
                </Alert>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <strong>Niveau :</strong>
                    <Badge bg="light" text="dark" className="border">
                      {preview.level}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <strong>Durée :</strong>
                    <Badge bg="light" text="dark" className="border">
                      {preview.duration}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <strong>Types d'exercices :</strong>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {preview.types.map(t => (
                        <Badge key={t} bg="light" text="dark" className="border">
                          {frenchTypes.find(ft => ft.key === t)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {preview.theme && (
                    <div className="text-start">
                      <strong>Thème de lecture :</strong> {preview.theme}
                    </div>
                  )}
                </div>

                {/* Exercise Parameters Display */}
                {preview.types.length > 0 && (
                  <div className="mb-3">
                    <h6 className="mb-2">📋 Paramètres des exercices :</h6>
                    <div className="row g-2">
                      {preview.types.includes('lecture') && (
                        <div className="col-md-6">
                          <div className="card border-primary">
                            <div className="card-body p-2">
                              <h6 className="card-title text-primary mb-1">📖 Lecture</h6>
                              {exerciceTypeParams.lecture && Object.keys(exerciceTypeParams.lecture).length > 0 ? (
                                <small className="text-muted">
                                  {exerciceTypeParams.lecture.theme && (
                                    <div>Thème : {exerciceTypeParams.lecture.theme}</div>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">Paramètres par défaut</small>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {preview.types.includes('conjugation') && (
                        <div className="col-md-6">
                          <div className="card border-warning">
                            <div className="card-body p-2">
                              <h6 className="card-title text-warning mb-1">🔄 Conjugaison</h6>
                              {exerciceTypeParams.conjugaison && Object.keys(exerciceTypeParams.conjugaison).length > 0 ? (
                                <small className="text-muted">
                                  {exerciceTypeParams.conjugaison.verbs && (
                                    <div>Verbes : {exerciceTypeParams.conjugaison.verbs}</div>
                                  )}
                                  {exerciceTypeParams.conjugaison.tenses && (
                                    <div>Temps : {exerciceTypeParams.conjugaison.tenses}</div>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">Paramètres par défaut</small>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {preview.types.includes('grammar') && (
                        <div className="col-md-6">
                          <div className="card border-info">
                            <div className="card-body p-2">
                              <h6 className="card-title text-info mb-1">📚 Grammaire</h6>
                              {exerciceTypeParams.grammaire && Object.keys(exerciceTypeParams.grammaire).length > 0 ? (
                                <small className="text-muted">
                                  {exerciceTypeParams.grammaire.types && (
                                    <div>Types : {exerciceTypeParams.grammaire.types}</div>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">Paramètres par défaut</small>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {preview.types.includes('vocabulary') && (
                        <div className="col-md-6">
                          <div className="card border-success">
                            <div className="card-body p-2">
                              <h6 className="card-title text-success mb-1">📖 Vocabulaire</h6>
                              {exerciceTypeParams.vocabulaire && Object.keys(exerciceTypeParams.vocabulaire).length > 0 ? (
                                <small className="text-muted">
                                  {exerciceTypeParams.vocabulaire.theme && (
                                    <div>Thème : {exerciceTypeParams.vocabulaire.theme}</div>
                                  )}
                                  {exerciceTypeParams.vocabulaire.words && (
                                    <div>Mots : {exerciceTypeParams.vocabulaire.words}</div>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">Paramètres par défaut</small>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {preview.types.includes('orthography') && (
                        <div className="col-md-6">
                          <div className="card border-danger">
                            <div className="card-body p-2">
                              <h6 className="card-title text-danger mb-1">✏️ Orthographe</h6>
                              {exerciceTypeParams.orthographe && Object.keys(exerciceTypeParams.orthographe).length > 0 ? (
                                <small className="text-muted">
                                  {exerciceTypeParams.orthographe.rules && (
                                    <div>Règles : {exerciceTypeParams.orthographe.rules}</div>
                                  )}
                                  {exerciceTypeParams.orthographe.words && (
                                    <div>Mots : {exerciceTypeParams.orthographe.words}</div>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">Paramètres par défaut</small>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Alert variant="warning" className="mb-0">
                  <small>
                    <strong>⚠️ Important :</strong> En confirmant, 1 crédit sera consommé pour générer cette fiche.
                    {canRegenerate && " Vous pourrez la regénérer gratuitement une fois en cas de problème."}
                  </small>
                </Alert>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Modifier les paramètres
            </Button>            <Button 
              variant="success" 
              onClick={handleConfirmGeneration}
              disabled={!canGenerateMore()}
            >
              {!canGenerateMore() ? 'Limite d\'abonnement atteinte' : 'Confirmer et générer (1 fiche)'}
            </Button>
          </Modal.Footer>
        </Modal>        {/* Generating Modal */}
        <Modal show={showGeneratingModal} backdrop="static" keyboard={false} centered className="generation-loading">
          <Modal.Body className="text-center py-4">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Génération en cours...</span>
            </div>
            <h5>Génération de votre fiche en cours...</h5>
            <p className="text-muted mb-0">Veuillez patienter quelques instants</p>
          </Modal.Body>
        </Modal>

        {/* Success Modal */}
        <Modal show={showSuccessModal} onHide={resetFlow} size="lg" centered className="success-modal">
          <Modal.Header closeButton>
            <Modal.Title className="text-success">🎉 Fiche générée avec succès !</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="success">
              <h6>Votre fiche est prête !</h6>
              <div className="mb-2">
                <strong>Fiche de français</strong>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <Badge bg="light" text="dark" className="border">
                    {level}
                  </Badge>
                  <Badge bg="light" text="dark" className="border">
                    {duration}
                  </Badge>
                </div>
              </div>
              <p className="mb-2">
                <strong>Types d'exercices :</strong>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {selectedTypes.map(t => (
                    <Badge key={t} bg="light" text="dark" className="border">
                      {frenchTypes.find(ft => ft.key === t)?.label}
                    </Badge>
                  ))}
                </div>
              </p>
              {exerciceTypeParams.lecture?.theme && (
                <p className="mb-0">
                  <strong>Thème de lecture :</strong> {exerciceTypeParams.lecture.theme}
                </p>
              )}
            </Alert>
            
            <div className="d-grid">
              <a 
                href={pdfUrl || '#'} 
                download 
                className="btn btn-success btn-lg"
              >
                📥 Télécharger la fiche PDF
              </a>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={resetFlow}>
              Créer une nouvelle fiche
            </Button>
          </Modal.Footer>
        </Modal>        {/* Error Modal */}
        <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered className="error-modal">
          <Modal.Header closeButton>
            <Modal.Title className="text-danger">❌ Erreur de génération</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="danger">
              <p className="mb-2">{errorMessage}</p>
              {canRegenerate && (
                <p className="mb-0">
                  <strong>Bonne nouvelle :</strong> Vous pouvez regénérer cette fiche gratuitement une fois.
                </p>
              )}
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
              Fermer
            </Button>
            {canRegenerate && (
              <Button variant="warning" onClick={handleRegenerate}>
                🔄 Regénérer gratuitement
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Exercise Type Modals */}
        <LectureModal
          show={showLectureModal}
          onHide={() => setShowLectureModal(false)}
          onSave={handleLectureSave}
          level={level}
          initialParams={exerciceTypeParams.lecture ? {
            theme: exerciceTypeParams.lecture.theme
          } : undefined}
        />

        <ConjugationModal
          show={showConjugationModal}
          onHide={() => setShowConjugationModal(false)}
          onSave={handleConjugationSave}
          level={level}
          initialParams={exerciceTypeParams.conjugaison ? {
            verbs: exerciceTypeParams.conjugaison.verbs,
            tenses: exerciceTypeParams.conjugaison.tenses
          } : undefined}
        />

        <GrammarModal
          show={showGrammarModal}
          onHide={() => setShowGrammarModal(false)}
          onSave={handleGrammarSave}
          level={level}
          initialParams={exerciceTypeParams.grammaire ? {
            types: exerciceTypeParams.grammaire.types
          } : undefined}
        />

        <VocabularyModal
          show={showVocabularyModal}
          onHide={() => setShowVocabularyModal(false)}
          onSave={handleVocabularySave}
          level={level}
          initialParams={exerciceTypeParams.vocabulaire ? {
            words: exerciceTypeParams.vocabulaire.words,
            theme: exerciceTypeParams.vocabulaire.theme
          } : undefined}
        />

        <OrthographyModal
          show={showOrthographyModal}
          onHide={() => setShowOrthographyModal(false)}
          onSave={handleOrthographySave}
          level={level}
          initialParams={exerciceTypeParams.orthographe ? {
            words: exerciceTypeParams.orthographe.words,
            rules: exerciceTypeParams.orthographe.rules
          } : undefined}
        />
      </Container>
    </ProtectedPage>
  );
}
