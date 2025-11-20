"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import LectureModal, { LectureParams } from "../../../components/LectureModal";
import ConjugationModal, { ConjugationParams } from "../../../components/ConjugationModal";
import GrammarModal, { GrammarParams } from "../../../components/GrammarModal";
import OrthographyModal, { OrthographyParams } from "../../../components/OrthographyModal";
import ComprehensionModal, { ComprehensionParams } from "../../../components/ComprehensionModal";
import GenerationLoadingModal from "../../../components/GenerationLoadingModal";
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";
// Import top-level functions to avoid Turbopack interop issues with object properties
import type { ExerciseSession } from "../../../services/exerciseService";
import { generateExercises as generateExercisesApi, downloadSessionPDF as downloadSessionPDFApi } from "../../../services/exerciseService";
import { ExerciceDomain, ExerciceTypeParam, ExerciceTime, ExerciceModalite, buildExerciceGenerationRequest, encodeExerciseTypeWithModality, ExercicesByType, ExerciseWithParams } from "../../../types/exerciceTypes";
import { EXERCISE_CONTENT_CALCULATOR } from "../../../utils/pdfGenerationConfig";
import { previewBackendRequest } from "../../../utils/requestPreview";
import { getExerciseLabel } from "../../../types/frenchExerciseNaming";
import frenchExerciseNaming from "../../../config/frenchExerciseNaming.json";
import lectureThemesData from "../../../config/lectureThemes.json";
import styles from "../../page.module.css";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const durations = ["10 min", "20 min", "30 min"];

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
  const { status, usageView, canGenerateMore, getRemainingFiches, updateStatusFromQuotaInfo } = useSubscription();
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
  const [showOrthographyModal, setShowOrthographyModal] = useState(false);
  const [showComprehensionModal, setShowComprehensionModal] = useState(false);
  const [showExerciseGuideModal, setShowExerciseGuideModal] = useState(false);
  const [exerciseGuideSearch, setExerciseGuideSearch] = useState("");
  const [exerciseGuideLevel, setExerciseGuideLevel] = useState("");
  
  // Level change confirmation modal
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<string>("");
  
  // Modal and generation state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generationCompleted, setGenerationCompleted] = useState(false); // New state for completion
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [preview, setPreview] = useState<ExercisePreview | null>(null);
  const [generatedExercise, setGeneratedExercise] = useState<ExerciseSession | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  // Fiche metadata (title, tags, and theme)
  const [ficheTitle, setFicheTitle] = useState("");
  const [ficheTags, setFicheTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [ficheTheme, setFicheTheme] = useState(""); // Theme for the entire fiche
  const [showAllFicheThemes, setShowAllFicheThemes] = useState(false);

  // Last generated parameters for regeneration
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    level: string;
    duration: string;
    selectedTypes: string[];
    exerciceTypeParams: ExerciceTypeParam;
  } | null>(null);

  const frenchTypes = [
    { key: "lecture", label: "Lecture" },
    { key: "comprehension", label: "Compréhension" },
    { key: "grammaire", label: "Grammaire" },
    { key: "conjugaison", label: "Conjugaison" },
    // { key: "vocabulaire", label: "Vocabulaire" }, // Temporarily disabled
    { key: "orthographe", label: "Orthographe" },
  ];

  // Helper function to get icons for exercise types
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lecture": return "bi-book";
      case "comprehension": return "bi-lightbulb";
      case "grammaire": return "bi-pencil-square";
      case "conjugaison": return "bi-gear";
      case "orthographe": return "bi-check2-square";
      default: return "bi-circle";
    }
  };

  // Helper function to convert old grammar type names to new ones
  const convertGrammarType = (oldType: string): string => {
    const conversionMap: Record<string, string> = {
      'accord_adjectif': 'nom_adjectif'
    };
    return conversionMap[oldType] || oldType;
  };

  // Helper function to format grammar types for display
  const formatGrammarTypes = (types: string): string => {
    return types.split(',')
      .map((t: string) => convertGrammarType(t.trim()))
      .join(',');
  };

  // Helper function to get configured exercise labels
  const getConfiguredExerciseLabels = (type: string): string => {
    const params = exerciceTypeParams[type];
    if (!params) return "Configuré";
    
    switch (type) {
      case "conjugaison":
        if (params.tenses && Array.isArray(params.tenses)) {
          const labels = params.tenses.map((tense: string) => 
            getExerciseLabel('conjugaison', tense) || tense
          );
          return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
        }
        break;
      case "grammaire":
        if (params.types) {
          const types = params.types.split(',');
          const labels = types.map((t: string) => 
            getExerciseLabel('grammaire', t.trim()) || t
          );
          return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
        }
        break;
      case "orthographe":
        if (params.exerciseTypes && Array.isArray(params.exerciseTypes)) {
          const labels = params.exerciseTypes.map((exType: string) => 
            getExerciseLabel('orthographe', exType) || exType
          );
          return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
        }
        break;
      case "comprehension":
        if (params.types) {
          const types = typeof params.types === 'string' ? params.types.split(',') : params.types;
          const labels = types.map((t: string) => 
            getExerciseLabel('comprehension', t.trim()) || t
          );
          return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
        }
        break;
      case "lecture":
        // Show text type and length for lecture
        if (params.style && params.length) {
          const styleLabels: Record<string, string> = {
            "histoire": "Histoire",
            "dialogue": "Dialogue", 
            "culture": "Culture",
            "poeme": "Poème",
            "syllabique": "Syllabique"
          };
          const lengthLabels: Record<string, string> = {
            "court": "Court",
            "moyen": "Moyen",
            "long": "Long"
          };
          const styleLabel = styleLabels[params.style] || params.style;
          const lengthLabel = lengthLabels[params.length] || params.length;
          return `${styleLabel} - ${lengthLabel}`;
        }
        break;
    }
    return "Configuré";
  };

  // Helper functions for tags
  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !ficheTags.includes(newTag)) {
      setFicheTags([...ficheTags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFicheTags(ficheTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Reset modal metadata when closing
  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setFicheTitle("");
    setFicheTags([]);
    setTagInput("");
    setFicheTheme("");
    setShowAllFicheThemes(false);
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

  // Helper function to format length labels based on level
  const formatLengthLabel = (length: string, levelToUse?: string) => {
    // Use the provided level or fall back to the current form level
    const currentLevel = levelToUse || level;
    
    // Debug log to see what values we're working with
    console.log('formatLengthLabel debug:', { length, levelToUse, currentLevel, formLevel: level });
    
    // Use the same logic as LectureModal for consistency
    const getLengthLabelByLevel = (level: string, length: string) => {
      switch (level) {
        case "CP":
          switch (length) {
            case "court": return "Court (3 lignes)";
            case "moyen": return "Moyen (5 lignes)";
            case "long": return "Long (10 lignes)";
            default: return length;
          }
        case "CE1":
          switch (length) {
            case "court": return "Court (5 lignes)";
            case "moyen": return "Moyen (10 lignes)";
            case "long": return "Long (15 lignes)";
            default: return length;
          }
        case "CE2":
          switch (length) {
            case "court": return "Court (8 lignes)";
            case "moyen": return "Moyen (15 lignes)";
            case "long": return "Long (20 lignes)";
            default: return length;
          }
        case "CM1":
          switch (length) {
            case "court": return "Court (10 lignes)";
            case "moyen": return "Moyen (20 lignes)";
            case "long": return "Long (30 lignes)";
            default: return length;
          }
        case "CM2":
          switch (length) {
            case "court": return "Court (15 lignes)";
            case "moyen": return "Moyen (25 lignes)";
            case "long": return "Long (40 lignes)";
            default: return length;
          }
        default:
          switch (length) {
            case "court": return "Court (10 lignes)";
            case "moyen": return "Moyen (20 lignes)";
            case "long": return "Long (30 lignes)";
            default: return length;
          }
      }
    };
    
    const result = getLengthLabelByLevel(currentLevel, length);
    console.log('formatLengthLabel result:', result);
    return result;
  };  

  // Count total selected exercises across all domains
  const getTotalSelectedExercises = (): number => {
    let totalExercises = 0;
    
    selectedTypes.forEach(type => {
      const params = exerciceTypeParams[type];
      if (params) {
        switch (type) {
          case 'lecture':
            // Count lecture exercises (always 1 per selection)
            totalExercises += 1;
            break;
          case 'comprehension':
            // Count comprehension exercises based on selected types
            if (params.types) {
              const comprehensionTypes = params.types.split(',').map((t: string) => t.trim()).filter(Boolean);
              totalExercises += comprehensionTypes.length;
            } else {
              totalExercises += 1; // Default if no specific types
            }
            break;
          case 'grammaire':
            // Count grammar exercises based on selected types
            if (params.types) {
              const grammarTypes = params.types.split(',').map((t: string) => t.trim()).filter(Boolean);
              totalExercises += grammarTypes.length;
            } else {
              totalExercises += 1; // Default if no specific types
            }
            break;
          case 'conjugaison':
            // Count conjugation exercises - each tense is a separate exercise
            if (params.tenses) {
              const tensesList = params.tenses.split(',').map((t: string) => t.trim()).filter(Boolean);
              totalExercises += tensesList.length;
            } else {
              totalExercises += 1; // Default if no specific tenses
            }
            break;
          case 'orthographe':
            // Count orthography exercises - each rule is a separate exercise + dictée if present
            let orthographyCount = 0;
            
            // Count custom words (dictée) if present
            if (params.words && params.words.startsWith('#dictee,')) {
              orthographyCount += 1;
            }
            
            // Count standard rules
            if (params.rules) {
              const rules = params.rules.split(',').map((r: string) => r.trim()).filter(Boolean);
              orthographyCount += rules.length;
            }
            
            // If no specific exercises, count as 1 default
            if (orthographyCount === 0) {
              orthographyCount = 1;
            }
            
            totalExercises += orthographyCount;
            break;
          default:
            totalExercises += 1;
        }
      } else {
        // If no params yet (just selected but not configured), count as 1
        totalExercises += 1;
      }
    });
    
    return totalExercises;
  };

  // Exercise limits based on duration
  const getExerciseLimits = (duration: string): number => {
    switch (duration) {
      case "10 min": return 2;  // 2 exercices max pour 10 minutes
      case "20 min": return 3;  // 3 exercices max pour 20 minutes
      case "30 min": return 4;  // 4 exercices max pour 30 minutes  
      case "40 min": return 4; // 4 exercices pour 40 minutes (legacy support)
      default: return 4;
    }
  };

  // Check if user can add more exercises
  const canAddMoreExercises = (): boolean => {
    const limit = getExerciseLimits(duration);
    const currentTotal = getTotalSelectedExercises();
    return currentTotal < limit;
  };

  // Get limit message
  const getLimitMessage = (): string => {
    const limit = getExerciseLimits(duration);
    const currentTotal = getTotalSelectedExercises();
    return `Vous avez atteint la limite de ${limit} exercices pour la durée sélectionnée (actuellement: ${currentTotal})`;
  };

  // Calculate remaining exercise slots available for a specific type
  const getRemainingExerciseSlots = (forType: string): number => {
    const limit = getExerciseLimits(duration);
    let currentTotal = 0;
    
    // Count all exercises EXCEPT the type we're configuring
    selectedTypes.forEach(type => {
      if (type === forType) return; // Skip the type we're configuring
      
      const params = exerciceTypeParams[type];
      if (params) {
        switch (type) {
          case 'lecture':
            currentTotal += 1;
            break;
          case 'comprehension':
            if (params.types && Array.isArray(params.types)) {
              currentTotal += params.types.length;
            } else {
              currentTotal += 1;
            }
            break;
          case 'grammaire':
            if (params.types) {
              const grammarTypes = params.types.split(',').map((t: string) => t.trim()).filter(Boolean);
              currentTotal += grammarTypes.length;
            } else {
              currentTotal += 1;
            }
            break;
          case 'conjugaison':
            if (params.tenses) {
              const tensesList = params.tenses.split(',').map((t: string) => t.trim()).filter(Boolean);
              currentTotal += tensesList.length;
            } else {
              currentTotal += 1;
            }
            break;
          case 'orthographe':
            let orthographyCount = 0;
            if (params.words && params.words.startsWith('#dictee,')) {
              orthographyCount += 1;
            }
            if (params.rules) {
              const rules = params.rules.split(',').map((r: string) => r.trim()).filter(Boolean);
              orthographyCount += rules.length;
            }
            if (orthographyCount === 0) {
              orthographyCount = 1;
            }
            currentTotal += orthographyCount;
            break;
          default:
            currentTotal += 1;
        }
      } else {
        currentTotal += 1;
      }
    });
    
    return Math.max(1, limit - currentTotal); // Always allow at least 1
  };

  // Handle duration change with exercise limit adjustment
  const handleDurationChange = (newDuration: string) => {
    const newLimit = getExerciseLimits(newDuration);
    const currentTotal = getTotalSelectedExercises();
    
    if (currentTotal > newLimit) {
      // Show warning and ask for confirmation
      const confirmChange = window.confirm(
        `La nouvelle durée (${newDuration}) limite à ${newLimit} exercices, mais vous en avez actuellement ${currentTotal} sélectionnés. Voulez-vous continuer ? Les paramètres existants seront conservés mais certains exercices pourraient être exclus lors de la génération.`
      );
      
      if (confirmChange) {
        setDuration(newDuration);
      }
    } else {
      setDuration(newDuration);
    }
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
    const exerciseTypesWithModals = ["lecture", "conjugaison", "grammaire", "orthographe", "comprehension"]; // Vocabulaire temporarily removed
    
    // Check if trying to add a new exercise when at limit
    if (!selectedTypes.includes(type) && !canAddMoreExercises()) {
      // Silently prevent adding - button should be disabled but this is a fallback
      return;
    }
    
    // Special handling for comprehension - cannot be selected without lecture
    if (type === "comprehension") {
      if (!selectedTypes.includes("lecture")) {
        // Cannot select comprehension without lecture - this should be prevented by UI
        return;
      }
      
      if (selectedTypes.includes(type)) {
        // Remove comprehension
        setSelectedTypes(selectedTypes.filter(t => t !== type));
        // Remove exercise type params
        const newParams = { ...exerciceTypeParams };
        delete newParams[type];
        setExerciceTypeParams(newParams);
      } else {
        // Show comprehension modal to configure parameters
        setShowComprehensionModal(true);
      }
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
          case "orthographe":
            setShowOrthographyModal(true);
            break;
          case "comprehension":
            setShowComprehensionModal(true);
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
    // Calculate how the total would change with this new lecture configuration
    const currentTotalWithoutLecture = getTotalSelectedExercises() - (selectedTypes.includes("lecture") ? 1 : 0);
    const lectureExerciseCount = 1; // Lecture always counts as 1 exercise
    const newTotal = currentTotalWithoutLecture + lectureExerciseCount;
    const limit = getExerciseLimits(duration);
    
    // Only prevent save if this would exceed the session limit AND lecture is not already selected
    if (newTotal > limit && !selectedTypes.includes("lecture")) {
      return; // This should not happen due to UI controls, but safety check
    }
    
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
        length: params.length,
        fluence: params.fluence
      }
    });
  };

  const handleConjugationSave = (params: ConjugationParams) => {
    // Check if adding this exercise would exceed the limit
    const currentTotal = getTotalSelectedExercises();
    const limit = getExerciseLimits(duration);
    
    // Calculate how many exercises this conjugation would add
    const tensesList = params.tenses.split(',').filter((t: string) => t.trim());
    const newExerciseCount = !selectedTypes.includes("conjugaison") ? tensesList.length : 
      tensesList.length - (exerciceTypeParams.conjugaison?.tenses?.split(',').filter((t: string) => t.trim()).length || 0);
    
    const wouldExceedLimit = (currentTotal + newExerciseCount) > limit;
    
    if (wouldExceedLimit) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    // Add conjugaison to selected types
    if (!selectedTypes.includes("conjugaison")) {
      setSelectedTypes([...selectedTypes, "conjugaison"]);
    }
    
    // Save conjugaison parameters including exercise type selections
    setExerciceTypeParams({
      ...exerciceTypeParams,
      conjugaison: {
        verbs: params.verbs,
        tenses: params.tenses
      }
    });
  };

  const handleGrammarSave = (params: GrammarParams) => {
    // Check if adding this exercise would exceed the limit
    const currentTotal = getTotalSelectedExercises();
    const limit = getExerciseLimits(duration);
    
    // If grammar is not already selected, adding it would count as +1 exercise
    const wouldExceedLimit = !selectedTypes.includes("grammaire") && (currentTotal >= limit);
    
    if (wouldExceedLimit) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("grammaire")) {
      setSelectedTypes([...selectedTypes, "grammaire"]);
    }
    
    // Convert old parameter names to new ones before saving
    const convertedTypes = params.types.split(',')
      .map((t: string) => convertGrammarType(t.trim()))
      .join(',');
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      grammaire: {
        types: convertedTypes
      }
    });
  };

  const handleOrthographySave = (params: OrthographyParams) => {
    // Check if adding this exercise would exceed the limit
    const currentTotal = getTotalSelectedExercises();
    const limit = getExerciseLimits(duration);
    
    // If orthography is not already selected, adding it would count as +1 exercise
    const wouldExceedLimit = !selectedTypes.includes("orthographe") && (currentTotal >= limit);
    
    if (wouldExceedLimit) {
      return; // Silently prevent save - UI should have prevented this
    }
    
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

  const handleComprehensionSave = (params: ComprehensionParams) => {
    // Parse the types string to count exercises
    const typesArray = params.types.split(',').map(t => t.trim()).filter(t => t);
    
    // Calculate how the total would change with this new comprehension configuration
    const currentComprehensionCount = selectedTypes.includes("comprehension") && exerciceTypeParams.comprehension 
      ? exerciceTypeParams.comprehension.types.split(',').map(t => t.trim()).filter(t => t).length
      : 0;
    const currentTotalWithoutComprehension = getTotalSelectedExercises() - currentComprehensionCount;
    const comprehensionExerciseCount = typesArray.length; // Count each comprehension type as an exercise
    const newTotal = currentTotalWithoutComprehension + comprehensionExerciseCount;
    const limit = getExerciseLimits(duration);
    
    // Prevent save if this would exceed the session limit
    if (newTotal > limit) {
      // This should not happen due to UI controls, but safety check
      return;
    }
    
    if (!selectedTypes.includes("comprehension")) {
      setSelectedTypes([...selectedTypes, "comprehension"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      comprehension: {
        types: params.types
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

  const handleEditOrthographyParams = () => {
    setShowOrthographyModal(true);
  };

  const handleEditComprehensionParams = () => {
    setShowComprehensionModal(true);
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
    
    // Initialize fiche theme with lecture theme if it exists, otherwise pick a random theme
    if (!ficheTheme) {
      if (exerciceTypeParams.lecture?.theme) {
        setFicheTheme(exerciceTypeParams.lecture.theme);
      } else {
        // Pick a random theme from the level's themes
        const levelData = lectureThemesData.find((item: any) => item.niveau === level);
        const allThemes = levelData?.themes || [];
        if (allThemes.length > 0) {
          const randomTheme = allThemes[Math.floor(Math.random() * allThemes.length)];
          setFicheTheme(randomTheme.theme);
        }
      }
    }
    
    const previewData = generatePreview();
    setPreview(previewData);
    setShowPreviewModal(true);
  };
  const handleConfirmGeneration = async () => {
    // Save current parameters for potential regeneration
    setLastGeneratedParams({
      level,
      duration, 
      selectedTypes: [...selectedTypes],
      exerciceTypeParams: JSON.parse(JSON.stringify(exerciceTypeParams))
    });

    setShowPreviewModal(false);
    setShowGeneratingModal(true);
    
    try {
      // Check subscription limits before generation
      if (!canGenerateMore()) {
        throw new Error("Limite d'abonnement atteinte pour ce mois");
      }
      // Note: useCredit() is deprecated - backend now tracks usage automatically
      
      // Use ficheTheme as the main theme for the request
      const mainTheme = ficheTheme || "Exercices généraux";
      
      // Validate user authentication
      if (!user?.user_id) {
        throw new Error("Utilisateur non authentifié");
      }

      // Preview the backend request (for debugging)
      previewBackendRequest(level, duration, selectedTypes, mainTheme);
      
      // Build exercices_by_type structure for backend
      const exercicesByType: ExercicesByType = {};
      
      selectedTypes.forEach(type => {
        if (type === 'grammaire' && exerciceTypeParams.grammaire) {
          const grammarTypes = exerciceTypeParams.grammaire.types.split(',').map((t: string) => t.trim());
          exercicesByType['grammaire'] = grammarTypes.map((grammarType: string) => ({
            exercice_id: convertGrammarType(grammarType),
            params: {
              verbs: exerciceTypeParams.grammaire?.verbs || undefined,
              tenses: exerciceTypeParams.grammaire?.tenses || undefined
            }
          }));
        } else if (type === 'grammaire') {
          exercicesByType['grammaire'] = [{
            exercice_id: 'grammaire_generale',
            params: {}
          }];
        }
        
        if (type === 'conjugaison' && exerciceTypeParams.conjugaison) {
          const conjugationExercises: ExerciseWithParams[] = [];
          
          // Add conjugation tense exercises if selected
          if (exerciceTypeParams.conjugaison.includeConjugation !== false) {
            const tenses = exerciceTypeParams.conjugaison.tenses.split(',').map((t: string) => t.trim());
            tenses.forEach((tense: string) => {
              conjugationExercises.push({
                exercice_id: tense,
                params: {
                  verbs: exerciceTypeParams.conjugaison?.verbs || undefined
                }
              });
            });
          }
          
          exercicesByType['conjugaison'] = conjugationExercises;
        } else if (type === 'conjugaison') {
          exercicesByType['conjugaison'] = [{
            exercice_id: 'present',
            params: {}
          }];
        }
        
        if (type === 'lecture') {
          if (exerciceTypeParams.lecture) {
            const style = exerciceTypeParams.lecture.style || 'histoire';
            exercicesByType['lecture'] = [{
              exercice_id: style,
              params: {
                theme: exerciceTypeParams.lecture.theme || undefined,
                text_size: exerciceTypeParams.lecture.length || 'moyen',
                fluence: exerciceTypeParams.lecture.fluence || undefined
              }
            }];
          } else {
            exercicesByType['lecture'] = [{
              exercice_id: 'histoire',
              params: {
                text_size: 'moyen'
              }
            }];
          }
        }
        
        if (type === 'orthographe') {
          if (exerciceTypeParams.orthographe) {
            const orthographyExercises: ExerciseWithParams[] = [];
            
            // Handle custom words (dictée) - check if words start with #dictee
            if (exerciceTypeParams.orthographe.words && exerciceTypeParams.orthographe.words.startsWith('#dictee,')) {
              const customWords = exerciceTypeParams.orthographe.words.replace('#dictee,', '');
              orthographyExercises.push({
                exercice_id: 'dictee',
                params: {
                  words: customWords
                }
              });
            }
            
            // Handle standard orthography rules
            if (exerciceTypeParams.orthographe.rules) {
              const rules = exerciceTypeParams.orthographe.rules.split(',');
              rules.forEach((rule: string) => {
                const trimmedRule = rule.trim();
                if (trimmedRule) {
                  orthographyExercises.push({
                    exercice_id: trimmedRule, // Use the rule name directly as exercice_id
                    params: {}
                  });
                }
              });
            }
            
            // If no specific exercises were created, use default
            if (orthographyExercises.length === 0) {
              orthographyExercises.push({
                exercice_id: 'orthographe_generale',
                params: {}
              });
            }
            
            exercicesByType['orthographe'] = orthographyExercises;
          } else {
            exercicesByType['orthographe'] = [{
              exercice_id: 'orthographe_generale',
              params: {}
            }];
          }
        }
        
        if (type === 'comprehension') {
          if (exerciceTypeParams.comprehension) {
            const comprehensionTypes = exerciceTypeParams.comprehension.types.split(',').map((t: string) => t.trim());
            exercicesByType['comprehension'] = comprehensionTypes.map((comprType: string) => ({
              exercice_id: comprType,
              params: {}
            }));
          } else {
            exercicesByType['comprehension'] = [{
              exercice_id: 'comprehension_texte',
              params: {}
            }];
          }
        }
      });
      
      console.log('Exercices types with exercices list:', exercicesByType);
      
      // Encode exercise types with their modalities from configured parameters
      // FOR NOW: Always use DEFAUT modality, but structure is kept for future reactivation
      const typesWithModalities = selectedTypes.flatMap(type => {
        if (type === 'grammaire' && exerciceTypeParams.grammaire) {
          const grammarTypes = exerciceTypeParams.grammaire.types.split(',');
          return grammarTypes.map((grammarType: string) => {
            // Always use DEFAUT for now: const modality = modalities[grammarType.trim()] || ExerciceModalite.DEFAUT;
            return encodeExerciseTypeWithModality('grammaire', grammarType.trim(), ExerciceModalite.DEFAUT);
          });
        }
        
        if (type === 'conjugaison' && exerciceTypeParams.conjugaison) {
          const tenses = exerciceTypeParams.conjugaison.tenses.split(',');
          return tenses.map((tense: string) => {
            // Always use DEFAUT for now: const modality = modalities[tense.trim()] || ExerciceModalite.DEFAUT;
            return encodeExerciseTypeWithModality('conjugaison', tense.trim(), ExerciceModalite.DEFAUT);
          });
        }
        
        if (type === 'vocabulaire' && exerciceTypeParams.vocabulaire) {
          const theme = exerciceTypeParams.vocabulaire.theme;
          // Always use DEFAUT for now: const modality = modalities[theme] || ExerciceModalite.DEFAUT;
          return [encodeExerciseTypeWithModality('vocabulaire', theme, ExerciceModalite.DEFAUT)];
        }
        
        if (type === 'comprehension' && exerciceTypeParams.comprehension) {
          const comprehensionTypes = exerciceTypeParams.comprehension.types.split(',');
          return comprehensionTypes.map((comprType: string) => {
            // Always use DEFAUT for now: const modality = modalities[comprType.trim()] || ExerciceModalite.DEFAUT;
            return encodeExerciseTypeWithModality('comprehension', comprType.trim(), ExerciceModalite.DEFAUT);
          });
        }
        
        // For other types (lecture, orthographe), use default modality
        return [encodeExerciseTypeWithModality(type, undefined, ExerciceModalite.DEFAUT)];
      });
      
      console.log('Types with modalities (always DEFAUT for now):', typesWithModalities);
      
      // Build the request using the helper function (this handles type conversion)
      const request = buildExerciceGenerationRequest(
        level,
        duration,
        typesWithModalities, // Use encoded types with modalities
        mainTheme, // Use ficheTheme instead of lectureTheme
        ExerciceDomain.FRANCAIS,
        exerciceTypeParams,
        undefined, // specific requirements
        exercicesByType, // New parameter with exercise lists
        ficheTitle || undefined, // exercice_title
        ficheTags.length > 0 ? ficheTags : undefined // exercice_tags
      );
      
      console.log('About to call generateExercisesApi with:', { userId: user.user_id, request });
      
      // Call the unified exercise service (top-level function export)
      const response = await generateExercisesApi(user.user_id, request);
      
      console.log('generateExercisesApi response:', response);
      
      // Check if generation was successful (ExerciseSession should have an id if successful)
      if (response.id) {
        // Store the session response for download handling
        setGeneratedExercise(response);
        
        // Update subscription status from quota_info if present in response
        if (response.quota_info) {
          console.log('Generation successful, updating subscription status from quota_info:', response.quota_info);
          updateStatusFromQuotaInfo(response.quota_info);
        } else {
          console.warn('No quota_info in generation response - backend may need update');
        }
        
        // Show completion at 100% for 2 seconds
        setGenerationCompleted(true);
        
        // Wait 2 seconds before showing success modal
        setTimeout(() => {
          setShowGeneratingModal(false);
          setGenerationCompleted(false); // Reset for next time
          setShowSuccessModal(true);
        }, 2000);
      } else {
        throw new Error("Erreur lors de la génération du PDF");
      }
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      setErrorMessage(error.message || "Une erreur inattendue s'est produite");
      setShowGeneratingModal(false);
      setShowErrorModal(true);
    }
  };

  const handleDownload = async () => {
    if (!generatedExercise?.pdf_url || !user?.user_id) return;
    
    try {
      console.log('Generated exercise:', generatedExercise);
      console.log('PDF URL:', generatedExercise.pdf_url);
      
      // Extract filename from the pdf_path returned by backend
      // URL format: https://...blob.core.windows.net/.../filename.pdf?parameters
      // We need to get the filename before the query parameters
      const urlWithoutParams = generatedExercise.pdf_url.split('?')[0];
      const filename = urlWithoutParams.split('/').pop();
      console.log('Extracted filename:', filename);
      
      if (!filename) {
        throw new Error('Unable to extract filename from PDF path');
      }
      
      console.log('Calling downloadSessionPDF with:', { userId: user.user_id, filename });
      
      // Use the downloadSessionPDF function with correct parameters (userId, filename)
      const blob = await downloadSessionPDFApi(user.user_id, filename);
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
    if (!generatedExercise?.pdf_url || !user?.user_id) return;
    
    try {
      console.log('Generated exercise:', generatedExercise);
      console.log('PDF URL:', generatedExercise.pdf_url);
      
      // Extract filename from the pdf_path returned by backend
      // URL format: https://...blob.core.windows.net/.../filename.pdf?parameters
      // We need to get the filename before the query parameters
      const urlWithoutParams = generatedExercise.pdf_url.split('?')[0];
      const filename = urlWithoutParams.split('/').pop();
      console.log('Extracted filename:', filename);
      
      if (!filename) {
        throw new Error('Unable to extract filename from PDF path');
      }
      
      console.log('Calling downloadSessionPDF with:', { userId: user.user_id, filename });
      
      // Use the downloadSessionPDF function with correct parameters (userId, filename)
      const blob = await downloadSessionPDFApi(user.user_id, filename);
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

  const createNewSheet = () => {
    // Reset all parameters for a completely new sheet
    setLevel("CE1");
    setDuration("20 minutes");
    setSelectedTypes([]);
    setExerciceTypeParams({});
    setLastGeneratedParams(null);
    resetFlow();
  };

  const regenerateSameSheet = () => {
    // Close modal but keep current parameters
    resetFlow();
  };

  const restoreLastParameters = () => {
    if (lastGeneratedParams) {
      setLevel(lastGeneratedParams.level);
      setDuration(lastGeneratedParams.duration);
      setSelectedTypes([...lastGeneratedParams.selectedTypes]);
      setExerciceTypeParams(JSON.parse(JSON.stringify(lastGeneratedParams.exerciceTypeParams)));
    }
    resetFlow();
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
            {/* Enhanced Main Title with Clickable Book Icon */}
            <div className="d-flex align-items-center justify-content-center mb-3">
              <i 
                className="bi bi-book" 
                onClick={() => setShowExerciseGuideModal(true)}
                style={{ 
                  fontSize: '3rem',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginRight: '1.5rem',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)';
                  e.currentTarget.style.color = '#f59e0b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.color = '#fbbf24';
                }}
                title="Voir tous les exercices disponibles"
              ></i>
              <div className="text-center">
                <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                  Exercices de Français
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  Configurez vos exercices de français personnalisés
                </p>
              </div>
            </div>
            
            <Card className="shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <Card.Body className="p-3">
                  <form onSubmit={handlePreview}>
                    <div className="row g-3">
                      {/* Level Selection */}
                      <div className="col-12">
                        <h6 className="mb-2 fw-semibold" style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Niveau
                        </h6>
                        <div className="d-flex gap-2 flex-wrap">
                          {levels.map((lvl) => (
                            <Card 
                              key={lvl}
                              className="flex-fill"
                              onClick={() => handleLevelChange(lvl)}
                              style={{ 
                                cursor: 'pointer', 
                                minWidth: '60px',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                transition: 'all 0.3s ease',
                                border: level === lvl ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                                boxShadow: level === lvl ? '0 4px 12px rgba(251, 191, 36, 0.2)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (level !== lvl) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (level !== lvl) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                            >
                              <Card.Body className="p-2 text-center d-flex align-items-center justify-content-center">
                                <span className={`fw-bold`} style={{ fontSize: '0.9rem', color: level === lvl ? '#d97706' : '#374151' }}>
                                  {lvl}
                                </span>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Duration Selection */}
                      <div className="col-12">
                        <h6 className="mb-2 fw-semibold" style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Durée de la séance
                        </h6>
                        <div className="d-flex gap-2">
                          {durations.map((dur) => (
                            <div key={dur} className="flex-fill">
                              <Card 
                                className=""
                                onClick={() => handleDurationChange(dur)}
                                style={{ 
                                  cursor: 'pointer',
                                  borderRadius: '12px',
                                  backgroundColor: 'white',
                                  transition: 'all 0.3s ease',
                                  border: duration === dur ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                                  boxShadow: duration === dur ? '0 4px 12px rgba(251, 191, 36, 0.2)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (duration !== dur) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.15)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (duration !== dur) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }
                                }}
                              >
                                <Card.Body className="p-2 text-center d-flex align-items-center justify-content-center">
                                  <span className={`fw-bold`} style={{ fontSize: '0.9rem', color: duration === dur ? '#d97706' : '#374151' }}>
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
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.9rem', color: '#374151' }}>
                            Types d'exercices
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <Badge 
                              bg={getTotalSelectedExercises() > getExerciseLimits(duration) ? 'danger' : getTotalSelectedExercises() >= getExerciseLimits(duration) ? 'warning' : 'light'}
                              text={getTotalSelectedExercises() > getExerciseLimits(duration) ? 'white' : 'dark'}
                              className="d-flex align-items-center gap-1"
                              style={{ fontSize: '0.75rem', border: getTotalSelectedExercises() <= getExerciseLimits(duration) ? '1px solid #dee2e6' : 'none' }}
                            >
                              <i className="bi bi-list-ol"></i>
                              {getTotalSelectedExercises()}/{getExerciseLimits(duration)} exercices
                            </Badge>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {getTotalSelectedExercises() > getExerciseLimits(duration) ? (
                                <>
                                  <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                                  <span className="text-danger">Limite dépassée</span>
                                </>
                              ) : getTotalSelectedExercises() >= getExerciseLimits(duration) ? (
                                <>
                                  <i className="bi bi-info-circle me-1"></i>
                                  Limite: {getExerciseLimits(duration)} pour {duration}
                                </>
                              ) : (
                                <>Limite: {getExerciseLimits(duration)} pour {duration}</>
                              )}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          {frenchTypes.map(type => {
                            const hasSettings = ["lecture", "conjugaison", "grammaire", "orthographe"].includes(type.key); // Vocabulaire temporarily removed
                            const isComprehensionDisabled = type.key === "comprehension" && !selectedTypes.includes("lecture");
                            const isSelected = selectedTypes.includes(type.key);
                            const isAtLimit = !canAddMoreExercises();
                            const isDisabled = isComprehensionDisabled || (!isSelected && isAtLimit);
                            
                            return (
                              <Card 
                                key={type.key}
                                className="flex-fill"
                                onClick={() => !isDisabled && toggleType(type.key)}
                                style={{ 
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.5 : 1,
                                  minWidth: '110px',
                                  borderRadius: '12px',
                                  backgroundColor: 'white',
                                  transition: 'all 0.3s ease',
                                  border: isSelected ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                                  boxShadow: isSelected ? '0 4px 12px rgba(251, 191, 36, 0.2)' : 'none'
                                }}
                                title={
                                  isComprehensionDisabled ? "Vous devez d'abord sélectionner 'Lecture'" : 
                                  (!isSelected && isAtLimit) ? `Limite de ${getExerciseLimits(duration)} exercices atteinte` : ""
                                }
                                onMouseEnter={(e) => {
                                  if (!isDisabled && !isSelected) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.15)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isDisabled && !isSelected) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }
                                }}
                              >
                                <Card.Body className="p-2 text-center d-flex align-items-center justify-content-center" style={{ position: 'relative', minHeight: '60px' }}>
                                  <span className={`fw-semibold`} style={{ fontSize: '0.8rem', lineHeight: '1.2', color: isSelected ? '#d97706' : '#374151' }}>
                                    <i className={`${getTypeIcon(type.key)} me-1`}></i>
                                    {type.label}
                                  </span>
                                  
                                  {isComprehensionDisabled && (
                                    <i className="bi bi-lock position-absolute" style={{ fontSize: '0.7rem', top: '6px', right: '6px', color: '#6c757d' }}></i>
                                  )}
                                  
                                  {(!isSelected && isAtLimit && !isComprehensionDisabled) && (
                                    <i className="bi bi-dash-circle position-absolute text-muted" style={{ fontSize: '0.7rem', top: '6px', right: '6px' }}></i>
                                  )}
                                </Card.Body>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  {/* Exercise Parameters Section */}
                  <div className="mb-2 mt-4">
                    {(selectedTypes.some(type => exerciceTypeParams[type])) && (
                      <div>
                        <h6 className="mb-2 fw-semibold" style={{ fontSize: '0.85rem', color: '#374151' }}>
                          <i className="bi bi-sliders me-2" style={{ color: '#fbbf24' }}></i>
                          Paramètres configurés
                        </h6>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Lecture parameters */}
                          {selectedTypes.includes("lecture") && exerciceTypeParams.lecture && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #fcd34d',
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                              }}
                              onClick={handleEditLectureParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                                e.currentTarget.style.borderColor = '#fcd34d';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-book me-1" style={{ color: '#fbbf24' }}></i>
                                  Lecture
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("lecture")}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Conjugation parameters */}
                          {selectedTypes.includes("conjugaison") && exerciceTypeParams.conjugaison && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #fcd34d',
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                              }}
                              onClick={handleEditConjugationParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                                e.currentTarget.style.borderColor = '#fcd34d';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-gear me-1" style={{ color: '#fbbf24' }}></i>
                                  Conjugaison
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("conjugaison")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Grammar parameters */}
                          {selectedTypes.includes("grammaire") && exerciceTypeParams.grammaire && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #fcd34d',
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                              }}
                              onClick={handleEditGrammarParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                                e.currentTarget.style.borderColor = '#fcd34d';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-pencil-square me-1" style={{ color: '#fbbf24' }}></i>
                                  Grammaire
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("grammaire")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Vocabulary parameters */}
                          {selectedTypes.includes("vocabulaire") && exerciceTypeParams.vocabulaire && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #fcd34d',
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                              }}
                              onClick={handleEditVocabularyParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                                e.currentTarget.style.borderColor = '#fcd34d';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-chat-dots me-1" style={{ color: '#fbbf24' }}></i>
                                  Vocabulaire
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("vocabulaire")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Orthography parameters */}
                          {selectedTypes.includes("orthographe") && exerciceTypeParams.orthographe && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #fcd34d',
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.1)'
                              }}
                              onClick={handleEditOrthographyParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                                e.currentTarget.style.borderColor = '#fcd34d';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-spellcheck me-1" style={{ color: '#fbbf24' }}></i>
                                  Orthographe
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("orthographe")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Comprehension parameters */}
                          {selectedTypes.includes("comprehension") && exerciceTypeParams.comprehension && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#fffbeb', 
                                minWidth: '150px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderRadius: '8px',
                                borderColor: '#fbbf24'
                              }}
                              onClick={handleEditComprehensionParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fef3c7';
                                e.currentTarget.style.borderColor = '#f59e0b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fffbeb';
                                e.currentTarget.style.borderColor = '#fbbf24';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                                  <i className="bi bi-lightbulb me-1"></i>
                                  Compréhension
                                </div>
                                <div style={{ fontSize: '0.7rem' }} className="text-muted">
                                  {getConfiguredExerciseLabels("comprehension")}
                                </div>
                              </div>
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
                      disabled={selectedTypes.length === 0 || getTotalSelectedExercises() > getExerciseLimits(duration)}
                      size="lg"
                      style={{
                        background: (selectedTypes.length > 0 && getTotalSelectedExercises() <= getExerciseLimits(duration)) ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.7rem',
                        fontWeight: '600',
                        boxShadow: (selectedTypes.length > 0 && getTotalSelectedExercises() <= getExerciseLimits(duration)) ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
                      }}
                    >
                      Aperçu de la fiche ({level} - {duration})
                    </Button>
                    {selectedTypes.length === 0 && (
                      <small className="text-muted text-center" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-info-circle me-1"></i>
                        Veuillez sélectionner au moins un type d'exercice
                      </small>
                    )}
                    {getTotalSelectedExercises() > getExerciseLimits(duration) && (
                      <small className="text-danger text-center" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-exclamation-circle me-1"></i>
                        Trop d'exercices sélectionnés pour la durée choisie
                      </small>
                    )}
                    {usageView && (() => {
                      const remainingFiches = getRemainingFiches();
                      const monthlyLimit = usageView.monthly_limit || 0;
                      const tenPercentLimit = Math.floor(monthlyLimit * 0.1);
                      
                      return remainingFiches <= tenPercentLimit && remainingFiches > 0 && (
                        <small className="text-center" style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Attention : Il vous reste {remainingFiches} fiche{remainingFiches > 1 ? 's' : ''} ce mois
                          {usageView.addon_remaining > 0 && <> (dont {usageView.addon_remaining} pack{usageView.addon_remaining > 1 ? 's' : ''})</>}
                        </small>
                      );
                    })()}
                  </div>
                </form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Preview Modal */}
        <Modal show={showPreviewModal} onHide={handleClosePreviewModal} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef', padding: '1rem 1.5rem' }}>
            <Modal.Title className="w-100 text-center" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
              Aperçu de votre fiche
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '1.5rem' }}>
            {preview && (
              <div>
                {/* Basic Information - Compact */}
                <div className="d-flex gap-3 mb-3">
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Niveau:</strong>{' '}
                    <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                      {preview.level}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Durée:</strong>{' '}
                    <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                      {preview.duration}
                    </Badge>
                  </div>
                </div>

                {/* Theme - Required for generation */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#495057' }}>
                    Thème de la fiche
                  </label>
                  
                  {/* If lecture exercise exists, show locked theme from lecture */}
                  {exerciceTypeParams.lecture?.theme ? (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={ficheTheme}
                        readOnly
                        disabled
                        style={{ fontSize: '0.9rem', backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock me-1"></i>
                        Thème défini par l'exercice de lecture.
                      </small>
                    </>
                  ) : (
                    <>
                      {/* Theme suggestions based on level - only if no lecture */}
                      {(() => {
                        const levelData = lectureThemesData.find((item: any) => item.niveau === level);
                        const allThemes = levelData?.themes || [];
                        const displayedThemes = showAllFicheThemes ? allThemes : allThemes.slice(0, 6);
                        
                        return allThemes.length > 0 ? (
                          <div className="mb-2">
                            <small className="text-muted d-flex align-items-center justify-content-between mb-2">
                              <span>
                                <i className="bi bi-lightbulb me-1"></i>
                                Suggestions de thèmes :
                              </span>
                              {allThemes.length > 6 && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-decoration-none"
                                  onClick={() => setShowAllFicheThemes(!showAllFicheThemes)}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {showAllFicheThemes ? 'Voir moins' : `Voir tout (${allThemes.length})`}
                                </Button>
                              )}
                            </small>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              {displayedThemes.map((themeObj: any, index: number) => (
                                <Badge
                                  key={index}
                                  bg={ficheTheme === themeObj.theme ? "primary" : "light"}
                                  text={ficheTheme === themeObj.theme ? "white" : "dark"}
                                  className="border"
                                  style={{ 
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 'normal',
                                    padding: '0.4rem 0.8rem',
                                    transition: 'all 0.2s ease',
                                    borderColor: ficheTheme === themeObj.theme ? '#0d6efd' : '#dee2e6'
                                  }}
                                  onClick={() => setFicheTheme(themeObj.theme)}
                                  title={themeObj.description}
                                >
                                  {themeObj.theme}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Custom theme input - only if no lecture */}
                      <input
                        type="text"
                        className={`form-control ${!ficheTheme.trim() ? 'border-danger' : ''}`}
                        placeholder={!ficheTheme.trim() ? "Veuillez saisir un thème" : "Thème personnalisé ou sélectionnez une suggestion ci-dessus"}
                        value={ficheTheme}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 60) {
                            setFicheTheme(value);
                          }
                        }}
                        maxLength={60}
                        style={{ fontSize: '0.9rem' }}
                      />
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Cliquez sur une suggestion ci-dessus ou saisissez votre propre thème. ({ficheTheme.length}/60 caractères)
                      </small>
                    </>
                  )}
                </div>

                {/* Selected Exercises - Compact List with Labels */}
                <div className="mb-3">
                  <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057', marginBottom: '0.75rem' }}>
                    Exercices sélectionnés
                  </h6>
                  <div style={{ fontSize: '0.85rem' }}>
                    {preview.types.map((type, index) => {
                      const exerciseInfo = frenchTypes.find(ft => ft.key === type);
                      return (
                        <div 
                          key={type} 
                          style={{ 
                            padding: '0.5rem 0',
                            borderBottom: index < preview.types.length - 1 ? '1px solid #f0f0f0' : 'none'
                          }}
                        >
                          <div style={{ color: '#2c3e50', fontWeight: '500', marginBottom: '0.25rem' }}>
                            {exerciseInfo?.label}
                          </div>
                          <div style={{ color: '#6c757d', fontSize: '0.8rem', paddingLeft: '1rem' }}>
                            {getConfiguredExerciseLabels(type)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ margin: '1rem 0', borderTop: '1px solid #e9ecef' }} />

                {/* Tags Input */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#495057' }}>
                    Tags <span style={{ color: '#6c757d', fontWeight: '400' }}>(optionnel)</span>
                  </label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ajouter un tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      style={{ fontSize: '0.9rem' }}
                    />
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  {ficheTags.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      {ficheTags.map(tag => (
                        <span 
                          key={tag} 
                          className="badge d-flex align-items-center gap-1" 
                          style={{ 
                            fontSize: '0.8rem', 
                            backgroundColor: '#e3f2fd', 
                            color: '#1976d2',
                            padding: '0.35rem 0.6rem'
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            className="btn-close"
                            style={{ fontSize: '0.6rem' }}
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove ${tag}`}
                          ></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #e9ecef', padding: '1rem 1.5rem' }}>
            <Button 
              variant="outline-secondary" 
              onClick={handleClosePreviewModal}
              style={{ fontSize: '0.9rem' }}
            >
              Modifier
            </Button>
            <Button 
              onClick={handleConfirmGeneration}
              disabled={!canGenerateMore() || !ficheTheme.trim()}
              style={{
                background: (canGenerateMore() && ficheTheme.trim()) ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : undefined,
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'white'
              }}
            >
              {!canGenerateMore() ? 'Limite atteinte' : !ficheTheme.trim() ? 'Thème requis' : 'Confirmer et générer'}
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Generating Modal */}
        <GenerationLoadingModal show={showGeneratingModal} completed={generationCompleted} />

        {/* Success Modal */}
        <Modal show={showSuccessModal} onHide={regenerateSameSheet} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef', padding: '1rem 1.5rem' }}>
            <Modal.Title className="w-100 text-center" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
              <span style={{ color: '#f59e0b', marginRight: '6px', fontSize: '1.2rem' }}>✓</span>
              Votre fiche est prête !
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '1.5rem' }}>
            <div>
              {/* Level and Duration */}
              <div className="d-flex gap-3 mb-3">
                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                  <strong style={{ color: '#495057' }}>Niveau:</strong>{' '}
                  <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                    {level}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                  <strong style={{ color: '#495057' }}>Durée:</strong>{' '}
                  <Badge bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                    {duration}
                  </Badge>
                </div>
              </div>

              {/* Exercise Types */}
              <div className="mb-3">
                <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057', marginBottom: '0.75rem' }}>
                  Types d'exercices
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedTypes.map(t => (
                    <Badge key={t} bg="light" text="dark" style={{ fontSize: '0.8rem', fontWeight: '500', padding: '0.4rem 0.6rem' }}>
                      {frenchTypes.find(ft => ft.key === t)?.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e9ecef' }} />

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <Button 
                  onClick={handleDownload}
                  disabled={!generatedExercise?.id}
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '0.6rem',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-download me-2"></i>
                  Télécharger le PDF
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={handleViewPDF}
                  disabled={!generatedExercise?.id}
                  style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                >
                  <i className="bi bi-eye me-2"></i>
                  Visualiser et imprimer
                </Button>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #e9ecef', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outline-secondary"
              onClick={createNewSheet}
              style={{ fontSize: '0.9rem' }}
            >
              ✨ Nouvelle fiche
            </Button>
            {lastGeneratedParams && (
              <Button 
                variant="outline-secondary"
                onClick={restoreLastParameters}
                style={{ fontSize: '0.9rem' }}
              >
                🔄 Régénérer
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Error Modal */}
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
            length: exerciceTypeParams.lecture.length || "moyen",
            fluence: exerciceTypeParams.lecture.fluence || false
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

        <ComprehensionModal
          show={showComprehensionModal}
          onHide={() => setShowComprehensionModal(false)}
          onSave={handleComprehensionSave}
          currentLevel={level}
          initialParams={exerciceTypeParams.comprehension ? {
            types: exerciceTypeParams.comprehension.types
          } : undefined}
          maxExercises={getRemainingExerciseSlots('comprehension')}
          textType={exerciceTypeParams.lecture?.style}
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

        {/* Exercise Guide Modal */}
        <Modal 
          show={showExerciseGuideModal} 
          onHide={() => setShowExerciseGuideModal(false)} 
          centered 
          size="xl"
          scrollable
        >
          <Modal.Header 
            closeButton 
            style={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
              borderBottom: '3px solid #f59e0b'
            }}
          >
            <Modal.Title className="fw-bold d-flex align-items-center">
              <i className="bi bi-book-fill me-2" style={{ color: '#f59e0b', fontSize: '1.5rem' }}></i>
              Guide des Exercices de Français
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', backgroundColor: '#fffef5' }}>
            <p className="text-muted mb-3">
              Découvrez tous les types d'exercices disponibles par catégorie, avec leur description et les niveaux adaptés.
            </p>

            {/* Filters Row */}
            <div className="row g-3 mb-4">
              {/* Search Bar */}
              <div className="col-md-8">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Rechercher un exercice..."
                    value={exerciseGuideSearch}
                    onChange={(e) => setExerciseGuideSearch(e.target.value)}
                    style={{
                      paddingLeft: '2.5rem',
                      borderRadius: '8px',
                      border: '2px solid #fbbf24',
                      fontSize: '0.95rem'
                    }}
                  />
                  {exerciseGuideSearch && (
                    <button
                      className="btn btn-sm position-absolute"
                      onClick={() => setExerciseGuideSearch('')}
                      style={{
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Level Filter */}
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={exerciseGuideLevel}
                  onChange={(e) => setExerciseGuideLevel(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">📚 Tous les niveaux</option>
                  <option value="CP">CP</option>
                  <option value="CE1">CE1</option>
                  <option value="CE2">CE2</option>
                  <option value="CM1">CM1</option>
                  <option value="CM2">CM2</option>
                </select>
              </div>
            </div>

            {/* Grammaire Section */}
            {frenchExerciseNaming.grammaire.filter(exercise => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
            ).length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#f59e0b' }}>
                <i className="bi bi-tag-fill me-2"></i>
                Grammaire
                <Badge bg="warning" text="dark" className="ms-2">
                  {frenchExerciseNaming.grammaire.filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  ).length} exercices
                </Badge>
              </h5>
              <Row className="g-3">
                {frenchExerciseNaming.grammaire
                  .filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  )
                  .map((exercise) => (
                  <Col md={6} key={exercise.id}>
                    <Card className="h-100 border-warning shadow-sm" style={{ borderLeft: '4px solid #fbbf24' }}>
                      <Card.Body>
                        <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                          {exercise.label}
                        </h6>
                        <p className="small text-muted mb-2">{exercise.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {exercise.levels.map((lvl) => (
                            <Badge key={lvl} bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                              {lvl}
                            </Badge>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            )}

            {/* Conjugaison Section */}
            {frenchExerciseNaming.conjugaison.filter(exercise => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
            ).length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#f59e0b' }}>
                <i className="bi bi-pencil-fill me-2"></i>
                Conjugaison
                <Badge bg="warning" text="dark" className="ms-2">
                  {frenchExerciseNaming.conjugaison.filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  ).length} exercices
                </Badge>
              </h5>
              <Row className="g-3">
                {frenchExerciseNaming.conjugaison
                  .filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  )
                  .map((exercise) => (
                  <Col md={6} key={exercise.id}>
                    <Card className="h-100 border-warning shadow-sm" style={{ borderLeft: '4px solid #fbbf24' }}>
                      <Card.Body>
                        <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                          {exercise.label}
                        </h6>
                        <p className="small text-muted mb-2">{exercise.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {exercise.levels.map((lvl) => (
                            <Badge key={lvl} bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                              {lvl}
                            </Badge>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            )}

            {/* Orthographe Section */}
            {frenchExerciseNaming.orthographe.filter(exercise => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
            ).length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#f59e0b' }}>
                <i className="bi bi-spellcheck me-2"></i>
                Orthographe
                <Badge bg="warning" text="dark" className="ms-2">
                  {frenchExerciseNaming.orthographe.filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  ).length} exercices
                </Badge>
              </h5>
              <Row className="g-3">
                {frenchExerciseNaming.orthographe
                  .filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  )
                  .map((exercise) => (
                  <Col md={6} key={exercise.id}>
                    <Card className="h-100 border-warning shadow-sm" style={{ borderLeft: '4px solid #fbbf24' }}>
                      <Card.Body>
                        <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                          {exercise.label}
                        </h6>
                        <p className="small text-muted mb-2">{exercise.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {exercise.levels.map((lvl) => (
                            <Badge key={lvl} bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                              {lvl}
                            </Badge>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            )}

            {/* Compréhension Section */}
            {frenchExerciseNaming.comprehension.filter(exercise => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
            ).length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#f59e0b' }}>
                <i className="bi bi-chat-left-text-fill me-2"></i>
                Compréhension
                <Badge bg="warning" text="dark" className="ms-2">
                  {frenchExerciseNaming.comprehension.filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  ).length} exercices
                </Badge>
              </h5>
              <Row className="g-3">
                {frenchExerciseNaming.comprehension
                  .filter(exercise => 
                    (exerciseGuideSearch === '' || 
                     exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                     exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                    (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
                  )
                  .map((exercise) => (
                  <Col md={6} key={exercise.id}>
                    <Card className="h-100 border-warning shadow-sm" style={{ borderLeft: '4px solid #fbbf24' }}>
                      <Card.Body>
                        <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                          {exercise.label}
                        </h6>
                        <p className="small text-muted mb-2">{exercise.description}</p>
                        <div className="d-flex flex-wrap gap-1">
                          {exercise.levels.map((lvl) => (
                            <Badge key={lvl} bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                              {lvl}
                            </Badge>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            )}

            {/* No Results Message */}
            {(exerciseGuideSearch || exerciseGuideLevel) && 
             frenchExerciseNaming.grammaire.filter(exercise => 
               (exerciseGuideSearch === '' || 
                exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
               (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
             ).length === 0 &&
             frenchExerciseNaming.conjugaison.filter(exercise => 
               (exerciseGuideSearch === '' || 
                exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
               (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
             ).length === 0 &&
             frenchExerciseNaming.orthographe.filter(exercise => 
               (exerciseGuideSearch === '' || 
                exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
               (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
             ).length === 0 &&
             frenchExerciseNaming.comprehension.filter(exercise => 
               (exerciseGuideSearch === '' || 
                exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
               (exerciseGuideLevel === '' || exercise.levels.includes(exerciseGuideLevel))
             ).length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-search" style={{ fontSize: '3rem', color: '#fbbf24' }}></i>
                <p className="text-muted mt-3">
                  Aucun exercice trouvé
                  {exerciseGuideSearch && ` pour "${exerciseGuideSearch}"`}
                  {exerciseGuideLevel && ` au niveau ${exerciseGuideLevel}`}
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#fef3c7', borderTop: '2px solid #fbbf24' }}>
            <Button 
              variant="warning" 
              onClick={() => setShowExerciseGuideModal(false)}
              style={{ 
                fontWeight: '600',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none'
              }}
            >
              <i className="bi bi-check-circle me-2"></i>
              Compris !
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
