"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import LectureModal, { LectureParams } from "../../../components/LectureModal";
import ConjugationModal, { ConjugationParams } from "../../../components/ConjugationModal";
import GrammarModal, { GrammarParams } from "../../../components/GrammarModal";
import VocabularyModal, { VocabularyParams } from "../../../components/VocabularyModal";
import OrthographyModal, { OrthographyParams } from "../../../components/OrthographyModal";
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";
import { exerciseService, ExerciseGenerationResponse } from "../../../services/exerciseService";
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
  const { user } = useAuth();
  const router = useRouter();
  
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
  
  // Level change confirmation modal
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<string>("");
  
    // Modal and generation state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [preview, setPreview] = useState<ExercisePreview | null>(null);
  const [generatedExercise, setGeneratedExercise] = useState<ExerciseGenerationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const frenchTypes = [
    { key: "lecture", label: "Lecture" },
    { key: "comprehension", label: "Compréhension" },
    { key: "grammaire", label: "Grammaire" },
    { key: "conjugaison", label: "Conjugaison" },
    { key: "vocabulaire", label: "Vocabulaire" },
    { key: "orthographe", label: "Orthographe" },
  ];

  // Helper function to get icons for exercise types
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lecture": return "bi-book";
      case "comprehension": return "bi-lightbulb";
      case "grammaire": return "bi-pencil-square";
      case "conjugaison": return "bi-gear";
      case "vocabulaire": return "bi-chat-dots";
      case "orthographe": return "bi-check2-square";
      default: return "bi-circle";
    }
  };

  // Helper function to format style labels
  const formatStyleLabel = (style: string) => {
    const styleLabels: Record<string, string> = {
      "histoire": "Histoire",
      "dialogue": "Dialogue", 
      "culture": "Culture",
      "poeme": "Poème"
    };
    return styleLabels[style] || style;
  };

  // Helper function to format length labels
  const formatLengthLabel = (length: string) => {
    const lengthLabels: Record<string, string> = {
      "court": "Court (10 lignes)",
      "moyen": "Moyen (20 lignes)",
      "long": "Long (30 lignes)"
    };
    return lengthLabels[length] || length;
  };  

  // Exercise limits based on duration
  const getExerciseLimits = (duration: string): number => {
    switch (duration) {
      case "20 min": return 3;
      case "30 min": return 4;
      case "40 min": return 5;
      default: return 4;
    }
  };

  // Check if user can add more exercises
  const canAddMoreExercises = (): boolean => {
    const limit = getExerciseLimits(duration);
    return selectedTypes.length < limit;
  };

  // Get limit message
  const getLimitMessage = (): string => {
    const limit = getExerciseLimits(duration);
    return `Vous avez atteint la limite de ${limit} exercices pour la durée sélectionnée`;
  };

  // Handle duration change with exercise limit adjustment
  const handleDurationChange = (newDuration: string) => {
    const newLimit = getExerciseLimits(newDuration);
    
    // If current selection exceeds new limit, trim to fit
    if (selectedTypes.length > newLimit) {
      const trimmedTypes = selectedTypes.slice(0, newLimit);
      setSelectedTypes(trimmedTypes);
      
      // Also clean up exercise params for removed types
      const newParams = { ...exerciceTypeParams };
      Object.keys(newParams).forEach(key => {
        if (!trimmedTypes.includes(key)) {
          delete newParams[key];
        }
      });
      setExerciceTypeParams(newParams);
    }
    
    setDuration(newDuration);
  };

  // Handle level change with intelligent validation
  const handleLevelChange = (newLevel: string) => {
    const hasSelectedExercises = selectedTypes.length > 0;
    const hasConfiguredParams = Object.keys(exerciceTypeParams).length > 0;
    
    if (hasSelectedExercises || hasConfiguredParams) {
      // Show confirmation modal
      setPendingLevel(newLevel);
      setShowLevelChangeModal(true);
    } else {
      // Direct change if nothing is selected
      setLevel(newLevel);
    }
  };

  // Confirm level change and reset selections
  const confirmLevelChange = () => {
    setLevel(pendingLevel);
    setSelectedTypes([]);
    setExerciceTypeParams({});
    setShowLevelChangeModal(false);
    setPendingLevel("");
  };

  // Cancel level change
  const cancelLevelChange = () => {
    setShowLevelChangeModal(false);
    setPendingLevel("");
  };  
  const toggleType = (type: string) => {
    const exerciseTypesWithModals = ["lecture", "conjugaison", "grammaire", "vocabulaire", "orthographe"];
    
    // Check if trying to add a new exercise when at limit
    if (!selectedTypes.includes(type) && !canAddMoreExercises()) {
      alert(getLimitMessage());
      return;
    }
    
    // Special handling for comprehension - cannot be selected without lecture
    if (type === "comprehension") {
      if (!selectedTypes.includes("lecture")) {
        // Cannot select comprehension without lecture
        alert("Vous devez d'abord sélectionner 'Lecture' pour pouvoir choisir 'Compréhension'");
        return;
      }
      // Check limit only if adding comprehension
      if (!selectedTypes.includes(type) && !canAddMoreExercises()) {
        alert(getLimitMessage());
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
        theme: params.theme,
        style: params.style,
        length: params.length
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
      
      // Validate user authentication
      if (!user?.user_id) {
        throw new Error("Utilisateur non authentifié");
      }

      // Preview the backend request (for debugging)
      previewBackendRequest(level, duration, selectedTypes, lectureTheme || "Exercices généraux");
      
      // Call the unified exercise service
      const response = await exerciseService.generateExercise(
        user.user_id,
        level,
        duration,
        selectedTypes,
        lectureTheme || "Exercices généraux",
        ExerciceDomain.FRANCAIS,
        exerciceTypeParams, // Pass exercise type parameters
        undefined // specific requirements
      );
      
      // Check if generation was successful
      if (response.success && response.pdf_path) {
        // Store the full response for download handling
        setGeneratedExercise(response);
        setShowGeneratingModal(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(response.error_message || "Erreur lors de la génération du PDF");
      }
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      setErrorMessage(error.message || "Une erreur inattendue s'est produite");
      setShowGeneratingModal(false);
      setShowErrorModal(true);
    }
  };

  const handleDownload = async () => {
    if (!generatedExercise?.pdf_path && !generatedExercise?.pdf_base64) return;
    
    try {
      let blob: Blob;
      
      // Prefer base64 data if available (faster, no additional request)
      if (generatedExercise.pdf_base64) {
        blob = exerciseService.base64ToBlob(generatedExercise.pdf_base64);
      } else if (generatedExercise.pdf_path) {
        blob = await exerciseService.downloadExercisePDF(generatedExercise.pdf_path);
      } else {
        throw new Error('No PDF data available');
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `french-exercises-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setErrorMessage("Erreur lors du téléchargement du PDF");
      setShowErrorModal(true);
    }
  };

  const handleViewPDF = async () => {
    if (!generatedExercise) return;
    
    try {
      let blob: Blob;
      
      // Try base64 first (faster), fallback to URL download
      if (generatedExercise.pdf_base64) {
        blob = exerciseService.base64ToBlob(generatedExercise.pdf_base64);
      } else if (generatedExercise.pdf_path) {
        blob = await exerciseService.downloadExercisePDF(generatedExercise.pdf_path);
      } else {
        throw new Error("Aucune donnée PDF disponible");
      }
      
      const url = URL.createObjectURL(blob);
      setPdfViewerUrl(url);
      setShowPDFViewerModal(true);
    } catch (err) {
      console.error('Failed to view PDF:', err);
      setErrorMessage("Erreur lors de l'affichage du PDF");
      setShowErrorModal(true);
    }
  };

  const handlePrintPDF = () => {
    if (pdfViewerUrl) {
      const printWindow = window.open(pdfViewerUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const closePDFViewer = () => {
    setShowPDFViewerModal(false);
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl);
      setPdfViewerUrl(null);
    }
  };

  const resetFlow = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowPreviewModal(false);
    setShowGeneratingModal(false);
    setGeneratedExercise(null);
    setErrorMessage("");
    closePDFViewer();
  };

  return (
    <ProtectedPage>
      <style jsx>{`
        .parcours-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .parcours-card {
          transition: all 0.2s ease;
        }
      `}</style>
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
                <Card.Body className="p-4">
                  <form onSubmit={handlePreview}>
                    <div className="row g-3">
                      {/* Level Selection */}
                      <div className="col-12">
                        <h6 className="mb-3">Niveau</h6>
                        <div className="d-flex gap-2 flex-wrap">
                          {levels.map((lvl) => (
                            <Card 
                              key={lvl}
                              className={`${styles.selectorCard} border border-2 ${level === lvl ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow flex-fill`}
                              onClick={() => handleLevelChange(lvl)}
                              style={{ cursor: 'pointer', minWidth: '60px' }}
                            >
                              <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
                                <span className={`fw-bold ${level === lvl ? 'text-dark-emphasis' : 'text-dark'}`}>
                                  {lvl}
                                </span>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Duration Selection */}
                      <div className="col-12">
                        <h6 className="mb-3">Durée de la séance</h6>
                        <div className="d-flex gap-2">
                          {durations.map((dur) => (
                            <div key={dur} className="flex-fill">
                              <Card 
                                className={`${styles.selectorCard} border border-2 ${duration === dur ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow`}
                                onClick={() => handleDurationChange(dur)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
                                  <span className={`fw-bold ${duration === dur ? 'text-dark-emphasis' : 'text-dark'}`}>
                                    {dur}
                                  </span>
                                </Card.Body>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exercise Types Selection */}
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">Types d'exercices</h6>
                          <div className="d-flex align-items-center gap-2">
                            <Badge 
                              bg={selectedTypes.length >= getExerciseLimits(duration) ? 'warning' : 'secondary'} 
                              className="d-flex align-items-center gap-1"
                            >
                              <i className="bi bi-list-ol"></i>
                              {selectedTypes.length}/{getExerciseLimits(duration)}
                            </Badge>
                            <small className="text-muted">
                              {selectedTypes.length >= getExerciseLimits(duration) ? (
                                <>
                                  <i className="bi bi-info-circle me-1"></i>
                                  Limite atteinte
                                </>
                              ) : (
                                <>Limite: {getExerciseLimits(duration)} exercices pour {duration}</>
                              )}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          {frenchTypes.map(type => {
                            const hasSettings = ["lecture", "conjugaison", "grammaire", "vocabulaire", "orthographe"].includes(type.key);
                            const isComprehensionDisabled = type.key === "comprehension" && !selectedTypes.includes("lecture");
                            const isSelected = selectedTypes.includes(type.key);
                            const isLimitReached = !isSelected && !canAddMoreExercises();
                            const isDisabled = isComprehensionDisabled || isLimitReached;
                            
                            return (
                              <Card 
                                key={type.key}
                                className={`${styles.selectorCard} border border-2 ${isSelected ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow flex-fill`}
                                onClick={() => !isDisabled && toggleType(type.key)}
                                style={{ 
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.6 : 1,
                                  minWidth: '120px'
                                }}
                                title={
                                  isComprehensionDisabled ? "Vous devez d'abord sélectionner 'Lecture'" : 
                                  isLimitReached ? getLimitMessage() : ""
                                }
                              >
                                <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center" style={{ position: 'relative' }}>
                                  <span className={`fw-bold ${isSelected ? 'text-dark-emphasis' : 'text-dark'}`}>
                                    {type.label}
                                  </span>
                                  {isComprehensionDisabled && (
                                    <i className="bi bi-lock position-absolute" style={{ fontSize: '0.8em', top: '8px', right: '8px' }}></i>
                                  )}
                                  {isLimitReached && (
                                    <i className="bi bi-info-circle-fill text-warning position-absolute" style={{ fontSize: '0.8em', top: '8px', right: '8px' }}></i>
                                  )}
                                </Card.Body>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  {/* Exercise Parameters Section */}
                  <div className="mb-3">
                    {(selectedTypes.some(type => exerciceTypeParams[type])) && (
                      <div>
                        <h6 className="mb-3 text-muted">Paramètres des exercices</h6>
                        
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
                                  <i className="bi bi-book-open me-1"></i>
                                  Lecture
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.lecture.theme || "Thème général"}
                                </div>
                                {(exerciceTypeParams.lecture.style || exerciceTypeParams.lecture.length) && (
                                  <div style={{ fontSize: '0.7rem' }} className="text-muted">
                                    {exerciceTypeParams.lecture.style && (
                                      <span className="me-2">
                                        Style: {formatStyleLabel(exerciceTypeParams.lecture.style)}
                                      </span>
                                    )}
                                    {exerciceTypeParams.lecture.length && (
                                      <span>
                                        Longueur: {formatLengthLabel(exerciceTypeParams.lecture.length)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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
                                  <i className="bi bi-gear me-1"></i>
                                  Conjugaison
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.conjugaison.verbs} • {exerciceTypeParams.conjugaison.tenses}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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
                                  <i className="bi bi-book me-1"></i>
                                  Grammaire
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.grammaire.types}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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
                                  <i className="bi bi-chat-text me-1"></i>
                                  Vocabulaire
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.vocabulaire.words || exerciceTypeParams.vocabulaire.theme}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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
                                  <i className="bi bi-pen me-1"></i>
                                  Orthographe
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.orthographe.words || exerciceTypeParams.orthographe.rules}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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

            {/* Parcours Section */}
            <Card className="shadow-sm border-0 mt-4">
              <Card.Body className="p-3">
                <div className="text-center mb-4">
                  <h3 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
                    <i className="bi bi-collection me-2"></i>
                    Générer des Parcours
                  </h3>
                  <p className="text-muted">
                    Créez des programmes d'exercices sur plusieurs semaines avec des thématiques structurées
                  </p>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=conjugaison-ce1');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-alphabet"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Conjugaison CE1</h6>
                            <small className="text-muted">Apprentissage progressif de la conjugaison • 4 semaines • ~8 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CE1</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=grammaire-ce2');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-book"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Grammaire CE2</h6>
                            <small className="text-muted">Révision complète de la grammaire • 6 semaines • ~12 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CE2</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=revision-ete-ce1');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-sun"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Révision été CE1</h6>
                            <small className="text-muted">Programme de révision vacances • 8 semaines • ~8 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CE1</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=lecture-cp');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-eye"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Lecture CP</h6>
                            <small className="text-muted">Apprentissage de la lecture progressive • 12 semaines • ~36 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CP</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=orthographe-cm1');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-pencil"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Orthographe CM1</h6>
                            <small className="text-muted">Maîtrise de l'orthographe lexicale • 10 semaines • ~20 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CM1</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours?template=preparation-6eme');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-mortarboard"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Préparation 6ème</h6>
                            <small className="text-muted">Révision complète pour le collège • 6 semaines • ~18 fiches</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">CM2</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                <div className="row g-3 mt-2 justify-content-center">
                  <div className="col-12">
                    <Card 
                      className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => {
                        router.push('/generate/parcours');
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                              <i className="bi bi-plus-circle"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 text-dark">Autres...</h6>
                            <small className="text-muted">Créer un parcours personnalisé • Configurez votre parcours</small>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="badge bg-primary-subtle text-primary">Personnalisé</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <Alert variant="light" className="border">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Nouveau !</strong> Les parcours vous permettent de générer automatiquement 
                    une série de fiches d'exercices sur plusieurs semaines, parfaitement structurées 
                    selon une progression pédagogique.
                  </Alert>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>        {/* Preview Modal */}
        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="md" centered className="preview-modal">
          <Modal.Header closeButton>
            <Modal.Title>Aperçu de votre fiche</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {preview && (
              <div>
                {/* Basic Information */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Niveau :</span>
                    <Badge bg="primary" className="fs-6">{preview.level}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Durée :</span>
                    <Badge bg="secondary" className="fs-6">{preview.duration}</Badge>
                  </div>
                </div>

                {/* Selected Exercises */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Exercices sélectionnés :</h6>
                  {preview.types.map(type => {
                    const exerciseInfo = frenchTypes.find(ft => ft.key === type);
                    const params = exerciceTypeParams[type];
                    
                    return (
                      <div key={type} className="border rounded p-3 mb-2 bg-light">
                        <div className="fw-semibold text-primary mb-1">
                          {exerciseInfo?.label}
                        </div>
                        
                        {/* Exercise Parameters */}
                        {params && Object.keys(params).length > 0 ? (
                          <div className="small text-muted">
                            {type === 'lecture' && (
                              <>
                                {params.theme && <div>• Thème : {params.theme}</div>}
                                {params.style && <div>• Style : {formatStyleLabel(params.style)}</div>}
                                {params.length && <div>• Longueur : {formatLengthLabel(params.length)}</div>}
                              </>
                            )}
                            {type === 'conjugaison' && (
                              <>
                                {params.verbs && <div>• Verbes : {params.verbs}</div>}
                                {params.tenses && <div>• Temps : {params.tenses}</div>}
                              </>
                            )}
                            {type === 'grammaire' && (
                              <>
                                {params.types && <div>• Types : {params.types}</div>}
                              </>
                            )}
                            {type === 'vocabulaire' && (
                              <>
                                {params.theme && <div>• Thème : {params.theme}</div>}
                                {params.words && <div>• Mots : {params.words}</div>}
                              </>
                            )}
                            {type === 'orthographe' && (
                              <>
                                {params.rules && <div>• Règles : {params.rules}</div>}
                                {params.words && <div>• Mots : {params.words}</div>}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="small text-muted">• Paramètres par défaut</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Modifier les paramètres
            </Button>
            <Button 
              variant="success" 
              onClick={handleConfirmGeneration}
              disabled={!canGenerateMore()}
            >
              {!canGenerateMore() ? 'Limite d\'abonnement atteinte' : 'Confirmer et générer'}
            </Button>
          </Modal.Footer>
        </Modal>        {/* Generating Modal */}
        <Modal show={showGeneratingModal} backdrop="static" keyboard={false} centered className="generation-loading">
          <Modal.Body className="text-center py-4">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Génération en cours...</span>
            </div>
            <h5>Génération de votre fiche en cours...</h5>
            <p className="text-muted mb-0">Veuillez patienter, cela peut prendre jusqu'à 2 minutes</p>
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
              {exerciceTypeParams.lecture && (exerciceTypeParams.lecture.theme || exerciceTypeParams.lecture.style || exerciceTypeParams.lecture.length) && (
                <div className="mb-0">
                  <strong>Paramètres de lecture :</strong>
                  <div className="mt-1">
                    {exerciceTypeParams.lecture.theme && (
                      <div className="small text-muted">
                        <i className="bi bi-palette me-1"></i>
                        Thème: {exerciceTypeParams.lecture.theme}
                      </div>
                    )}
                    {exerciceTypeParams.lecture.style && (
                      <div className="small text-muted">
                        <i className="bi bi-book-reader me-1"></i>
                        Style: {formatStyleLabel(exerciceTypeParams.lecture.style)}
                      </div>
                    )}
                    {exerciceTypeParams.lecture.length && (
                      <div className="small text-muted">
                        <i className="bi bi-ruler me-1"></i>
                        Longueur: {formatLengthLabel(exerciceTypeParams.lecture.length)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Alert>
            
            <div className="d-grid gap-2">
              <button 
                onClick={handleDownload}
                className="btn btn-success btn-lg"
                disabled={!generatedExercise?.pdf_path && !generatedExercise?.pdf_base64}
              >
                📥 Télécharger la fiche PDF
              </button>
              <button 
                onClick={handleViewPDF}
                className="btn btn-outline-primary btn-lg"
                disabled={!generatedExercise?.pdf_path && !generatedExercise?.pdf_base64}
              >
                👁️ Visualiser et imprimer
              </button>
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
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Exercise Type Modals */}
        <LectureModal
          show={showLectureModal}
          onHide={() => setShowLectureModal(false)}
          onSave={handleLectureSave}
          level={level}
          initialParams={exerciceTypeParams.lecture ? {
            theme: exerciceTypeParams.lecture.theme || "",
            style: exerciceTypeParams.lecture.style || "histoire",
            length: exerciceTypeParams.lecture.length || "moyen"
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

        {/* PDF Viewer Modal */}
        <Modal 
          show={showPDFViewerModal} 
          onHide={closePDFViewer} 
          size="xl" 
          centered
          className="pdf-viewer-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>📄 Visualisation de la fiche PDF</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0" style={{ height: '80vh' }}>
            {pdfViewerUrl && (
              <iframe
                src={pdfViewerUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Viewer"
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={handlePrintPDF}>
              🖨️ Imprimer
            </Button>
            <Button variant="outline-secondary" onClick={closePDFViewer}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

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

        {/* Level Change Confirmation Modal */}
        <Modal show={showLevelChangeModal} onHide={cancelLevelChange} centered size="sm">
          <Modal.Header closeButton>
            <Modal.Title className="fs-6">
              <i className="bi bi-exclamation-triangle text-warning me-2"></i>
              Changer de niveau
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-2">
              En passant de <strong>{level}</strong> à <strong>{pendingLevel}</strong>, vous allez perdre :
            </p>
            <ul className="small text-muted mb-3">
              {selectedTypes.length > 0 && (
                <li>{selectedTypes.length} exercice{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}</li>
              )}
              {Object.keys(exerciceTypeParams).length > 0 && (
                <li>Les paramètres configurés</li>
              )}
            </ul>
            <p className="small mb-0">Voulez-vous continuer ?</p>
          </Modal.Body>
          <Modal.Footer className="p-2">
            <Button variant="outline-secondary" size="sm" onClick={cancelLevelChange}>
              Annuler
            </Button>
            <Button variant="warning" size="sm" onClick={confirmLevelChange}>
              Confirmer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
