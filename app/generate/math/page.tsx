"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
// Import de services
import { generateExercises, downloadSessionPDF, generateExercises as generateExercisesApi } from '@/services/exerciseService';
import type { ExerciseSession } from '@/services/exerciseService';
import { ExerciceGenerationRequest, buildExerciceGenerationRequest, ExerciceDomain, ExerciceTypeParam, ExercicesByType, ExerciseWithParams } from '../../../types/exerciceTypes';
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";
import styles from "../../page.module.css";

// Import the new math modals
import CalculModal, { CalculParams } from "../../../components/CalculModal";
import NombresModal from "../../../components/NombresModal";
import GeometrieModal, { GeometrieParams } from "../../../components/GeometrieModal";
import MesuresModal, { MesuresParams } from "../../../components/MesuresModal";
import GenerationLoadingModal from "../../../components/GenerationLoadingModal";
import { getMathExerciseLabel } from "../../../types/mathExerciseNaming";
import mathExerciseNaming from "../../../config/mathExerciseNaming.json";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const durations = ["10 min", "20 min", "30 min"];

export default function GenerateMathPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status, usageView, canGenerateMore, getRemainingFiches, updateStatusFromQuotaInfo } = useSubscription();
  
  // Form state
  const [level, setLevel] = useState("CE1");
  const [duration, setDuration] = useState("30 min");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Exercise type parameters
  const [exerciceTypeParams, setExerciceTypeParams] = useState<ExerciceTypeParam>({});
  
  // Last generated parameters for regeneration
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    level: string;
    duration: string;
    selectedTypes: string[];
    exerciceTypeParams: ExerciceTypeParam;
  } | null>(null);
  
  // Exercise selections for each domain
  const [nombresSelections, setNombresSelections] = useState<{ [key: string]: number[] }>({});
  
  // Modal states
  const [showNombresModal, setShowNombresModal] = useState(false);
  const [showCalculModal, setShowCalculModal] = useState(false);
  const [showGeometrieModal, setShowGeometrieModal] = useState(false);
  const [showMesuresModal, setShowMesuresModal] = useState(false);
  const [showExerciseGuideModal, setShowExerciseGuideModal] = useState(false);
  const [exerciseGuideSearch, setExerciseGuideSearch] = useState("");
  const [exerciseGuideLevel, setExerciseGuideLevel] = useState("");
  
  // Level change confirmation modal
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<string>("");
  
  // Generation workflow modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generationCompleted, setGenerationCompleted] = useState(false); // New state for completion
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  
  // Generation and success states
  const [generating, setGenerating] = useState(false);
  const [exercise, setExercise] = useState<ExerciseSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fiche metadata (title and tags)
  const [ficheTitle, setFicheTitle] = useState("");
  const [ficheTags, setFicheTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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
  };

  // Helper function to get configured exercise labels for display
  const getConfiguredExerciseLabels = (type: string): string => {
    const params = exerciceTypeParams[type];
    if (!params || !params.exercises) return "Configuré";
    
    const delimiter = type === "Nombres" ? "|||" : ",";
    const exercisesList = params.exercises.split(delimiter)
      .map((ex: string) => ex.trim())
      .filter((ex: string) => ex !== '');
    
    if (exercisesList.length === 0) return "Configuré";
    
    // Map exercise IDs to their labels from mathExerciseNaming.json
    const exerciseLabels = exercisesList.map((exerciseId: string) => {
      const label = getMathExerciseLabel(exerciseId);
      return label || exerciseId; // Fallback to ID if label not found
    });
    
    // Show first 2 exercises, then +N for remaining
    if (exerciseLabels.length <= 2) {
      return exerciseLabels.join(", ");
    } else {
      return exerciseLabels.slice(0, 2).join(", ") + ` +${exerciseLabels.length - 2}`;
    }
  };

  const mathDomains = [
    { 
      key: "Nombres", 
      label: "Nombres",
      exercises: {
        "CP": [
          { exercise: "Lire, écrire, décomposer jusqu'à 10", contenu: "Lire, écrire et décomposer les nombres jusqu'à 10. Introduction aux dizaines et unités." },
          { exercise: "Ranger, comparer jusqu'à 10", contenu: "Ranger et comparer les nombres jusqu'à 10. Ordonner de petites collections." },
          { exercise: "Lire, écrire, décomposer jusqu'à 100", contenu: "Lire, écrire et décomposer les nombres jusqu'à 100. Comprendre la structure du nombre 100." },
          { exercise: "Ranger, comparer jusqu'à 100", contenu: "Ranger et comparer les nombres jusqu'à 100. Encadrer et ordonner les nombres." }
        ],
        "CE1": [
          { exercise: "Lire, écrire, décomposer jusqu'à 100", contenu: "Lire, écrire et décomposer les nombres jusqu'à 100. Maîtriser les dizaines et unités." },
          { exercise: "Ranger, comparer jusqu'à 100", contenu: "Ranger et comparer les nombres jusqu'à 100. Encadrer et ordonner efficacement." },
          { exercise: "Lire, écrire, décomposer jusqu'à 1000", contenu: "Lire, écrire et décomposer les nombres jusqu'à 1000. Introduction aux centaines." },
          { exercise: "Ranger, comparer jusqu'à 1000", contenu: "Ranger et comparer les nombres jusqu'à 1000. Encadrer et ordonner les grands nombres." }
        ],
        "CE2": [
          { exercise: "Lire, écrire, décomposer jusqu'à 1000", contenu: "Lire, écrire et décomposer les nombres jusqu'à 1000. Maîtriser centaines, dizaines et unités." },
          { exercise: "Ranger, comparer jusqu'à 1000", contenu: "Ranger et comparer les nombres jusqu'à 1000. Encadrer et ordonner avec aisance." },
          { exercise: "Lire, écrire, décomposer jusqu'à 10 000", contenu: "Lire, écrire et décomposer les nombres jusqu'à 10 000. Introduction aux milliers." },
          { exercise: "Ranger, comparer jusqu'à 10 000", contenu: "Ranger et comparer les nombres jusqu'à 10 000. Encadrer et ordonner les très grands nombres." }
        ],
        "CM1": [
          { exercise: "Grands nombres - Lire et écrire", contenu: "Lire, écrire et décomposer des nombres jusqu'aux milliards." },
          { exercise: "Grands nombres - Comparer et encadrer", contenu: "Comparer, encadrer et ordonner des nombres jusqu'aux milliards." },
          { exercise: "Fractions", contenu: "Nommer, représenter, placer, comparer et ranger des fractions." },
          { exercise: "Décimaux - Lire et écrire", contenu: "Relier fractions et décimaux, lire et écrire des nombres décimaux." },
          { exercise: "Décimaux - Comparer et ranger", contenu: "Comparer, ranger et encadrer des nombres décimaux." }
        ],
        "CM2": [
          { exercise: "Grands nombres - Lire et décomposer", contenu: "Lire, écrire et décomposer des nombres jusqu'aux milliards." },
          { exercise: "Grands nombres - Comparer et ordonner", contenu: "Encadrer, comparer et ordonner des nombres jusqu'aux milliards." },
          { exercise: "Fractions", contenu: "Lire, représenter, placer et comparer des fractions, y compris les fractions décimales." },
          { exercise: "Décimaux - Lire et décomposer", contenu: "Lire, écrire et décomposer des nombres décimaux." },
          { exercise: "Décimaux - Comparer et encadrer", contenu: "Comparer, ranger et encadrer des nombres décimaux." }
        ]
      }
    },
    { 
      key: "Calculs", 
      label: "Calculs",
      exercises: {
        "CP": [
          { exercise: "Addition", contenu: "Découvrir le sens de l'addition, utiliser les tables, calculer les compléments à 10 et 100, poser des additions avec ou sans retenue." },
          { exercise: "Soustraction", contenu: "Comprendre la soustraction, calculer en ligne et poser des soustractions simples." },
          { exercise: "Multiplication", contenu: "Découvrir les doubles, les moitiés, et les premières situations de multiplication." },
          { exercise: "Partage", contenu: "Découvrir la notion de partage équitable et de division simple." }
        ],
        "CE1": [
          { exercise: "Addition", contenu: "Utiliser la table d'addition, additions en ligne, poser des additions avec ou sans retenue." },
          { exercise: "Soustraction", contenu: "Soustractions en ligne et posées, avec ou sans retenue." },
          { exercise: "Multiplication", contenu: "Premières multiplications avec les tables de 2 à 10 et calcul du double." },
          { exercise: "Division", contenu: "Premiers partages et moitiés." }
        ],
        "CE2": [
          { exercise: "Addition et soustraction", contenu: "Additions et soustractions en ligne et posées, compléments à 10, 100, 1000." },
          { exercise: "Multiplication", contenu: "Tables de multiplication, poser une multiplication à 1 ou 2 chiffres." },
          { exercise: "Division", contenu: "Découvrir la division, divisions en ligne simples." },
          { exercise: "Tableaux et graphiques", contenu: "Lire et calculer avec des tableaux et graphiques." }
        ],
        "CM1": [
          { exercise: "Additions et soustractions", contenu: "Techniques d'addition et soustraction avec des entiers." },
          { exercise: "Multiplication", contenu: "Multiplications par 1 chiffre, 10, 100, 25, 50; décompositions; multiplications posées." },
          { exercise: "Division", contenu: "Comprendre multiples et diviseurs; divisions en ligne; divisions par 1 chiffre." },
          { exercise: "Décimaux - Addition et soustraction", contenu: "Additions et soustractions avec des nombres décimaux." },
          { exercise: "Décimaux - Multiplication", contenu: "Multiplications avec des nombres décimaux." },
          { exercise: "Proportionnalité", contenu: "Lire tableaux et graphiques; premiers problèmes de proportionnalité." }
        ],
        "CM2": [
          { exercise: "Opérations entières", contenu: "Additions, soustractions, multiplications et divisions avec des entiers simples et grands." },
          { exercise: "Décimaux - Addition et soustraction", contenu: "Additions et soustractions avec des nombres décimaux." },
          { exercise: "Décimaux - Multiplication et division", contenu: "Multiplications et divisions avec des nombres décimaux." },
          { exercise: "Proportionnalité", contenu: "Résoudre des problèmes avec tableaux, graphiques, pourcentages, échelles et vitesses." }
        ]
      }
    },
    { 
      key: "Grandeurs", 
      label: "Grandeurs et mesures",
      exercises: {
        "CP": [
          { exercise: "Monnaie", contenu: "Reconnaître les pièces et billets, utiliser les euros dans de petites situations." },
          { exercise: "Temps", contenu: "Se repérer dans la journée et la semaine, lire l'heure et la demi-heure." },
          { exercise: "Longueurs", contenu: "Comparer, mesurer et tracer des segments." },
          { exercise: "Masses", contenu: "Comparer des objets selon leur masse." }
        ],
        "CE1": [
          { exercise: "Monnaie", contenu: "Travailler avec les euros et centimes dans des situations d'achat." },
          { exercise: "Temps", contenu: "Lire l'heure, distinguer matin/après-midi, mesurer des durées." },
          { exercise: "Longueurs", contenu: "Mesurer et comparer des longueurs, utiliser mètre et kilomètre." },
          { exercise: "Masses et contenances", contenu: "Comparer des masses, utiliser gramme, kilogramme et litre." }
        ],
        "CE2": [
          { exercise: "Monnaie", contenu: "Utiliser les euros et centimes dans des achats simples." },
          { exercise: "Temps", contenu: "Se repérer dans la journée et la semaine, lire l'heure." },
          { exercise: "Longueurs", contenu: "Tracer, mesurer et comparer des longueurs." },
          { exercise: "Masses et contenances", contenu: "Mesurer et comparer masses et contenances." }
        ],
        "CM1": [
          { exercise: "Durées", contenu: "Conversions et calculs avec les durées." },
          { exercise: "Longueurs et périmètres", contenu: "Conversions et calculs de longueurs et périmètres." },
          { exercise: "Masses et contenances", contenu: "Unités de masse, volume et contenance; comparaisons simples." },
          { exercise: "Angles et aires", contenu: "Identifier et construire des angles, calculer des aires." }
        ],
        "CM2": [
          { exercise: "Durées", contenu: "Conversions et calculs avec les durées." },
          { exercise: "Longueurs et périmètres", contenu: "Mesurer et calculer périmètres de polygones, carrés et rectangles." },
          { exercise: "Masses et contenances", contenu: "Travailler avec unités de masse, volume et contenance." },
          { exercise: "Angles et aires", contenu: "Identifier et construire des angles; calculer des aires; distinguer périmètre et aire." }
        ]
      }
    },
    { 
      key: "Geometrie", 
      label: "Espace et géométrie",
      exercises: {
        "CP": [
          { exercise: "Repérage", contenu: "Se repérer dans l'espace, différencier gauche et droite." },
          { exercise: "Quadrillage", contenu: "Se repérer dans un quadrillage et sur un plan, coder des déplacements." },
          { exercise: "Symétrie", contenu: "Reconnaître des figures symétriques simples." },
          { exercise: "Figures", contenu: "Identifier et tracer carrés, rectangles, triangles et cercles." },
          { exercise: "Solides", contenu: "Reconnaître et décrire cube et pavé droit." }
        ],
        "CE1": [
          { exercise: "Repérage", contenu: "Se repérer dans l'espace, sur un plan ou un quadrillage." },
          { exercise: "Symétrie", contenu: "Identifier et compléter des figures symétriques." },
          { exercise: "Droites et angles", contenu: "Tracer des droites et segments, repérer un angle droit." },
          { exercise: "Figures", contenu: "Identifier et tracer polygones, carrés, rectangles, triangles, cercles." },
          { exercise: "Solides", contenu: "Identifier, nommer et décrire des solides." }
        ],
        "CE2": [
          { exercise: "Repérage", contenu: "Se repérer sur un plan, coder un déplacement." },
          { exercise: "Symétrie", contenu: "Repérer et compléter des figures par symétrie." },
          { exercise: "Instruments", contenu: "Utiliser règle, équerre et compas." },
          { exercise: "Figures", contenu: "Identifier et construire polygones, triangles et cercles." },
          { exercise: "Solides", contenu: "Reconnaître et nommer des solides." }
        ],
        "CM1": [
          { exercise: "Repérage", contenu: "Se repérer et utiliser le vocabulaire de géométrie." },
          { exercise: "Droites et symétrie", contenu: "Tracer droites perpendiculaires et parallèles, axes de symétrie, construire un symétrique." },
          { exercise: "Figures", contenu: "Identifier et construire polygones, triangles, cercles." },
          { exercise: "Programmes", contenu: "Suivre et rédiger des programmes de construction; figures complexes." },
          { exercise: "Solides", contenu: "Identifier des solides et leurs patrons." }
        ],
        "CM2": [
          { exercise: "Repérage", contenu: "Se repérer et utiliser le vocabulaire et les instruments de géométrie." },
          { exercise: "Droites et symétrie", contenu: "Tracer droites perpendiculaires et parallèles; reconnaître et construire des symétries." },
          { exercise: "Figures", contenu: "Identifier et construire polygones, quadrilatères, triangles et cercles." },
          { exercise: "Programmes", contenu: "Suivre et rédiger un programme de construction; agrandir ou réduire des figures." },
          { exercise: "Solides", contenu: "Identifier des solides et leurs patrons." }
        ]
      }
    }
  ];

  // Helper function to get icons for exercise domains
  const getDomainIcon = (domainKey: string) => {
    switch (domainKey) {
      case "Nombres": return "bi-123";
      case "Calculs": return "bi-calculator";
      case "Grandeurs": return "bi-rulers";
      case "Geometrie": return "bi-triangle";
      default: return "bi-circle";
    }
  };

  // Get available exercises for current level
  const getExercisesForLevel = (domain: any, currentLevel: string) => {
    return domain.exercises[currentLevel] || [];
  };

  // Exercise limits based on duration (same as French generation)
  const getExerciseLimits = (duration: string): number => {
    switch (duration) {
      case "10 min": return 2;  // 2 exercices max pour 10 minutes
      case "20 min": return 3;  // 3 exercices max pour 20 minutes
      case "30 min": return 4;  // 4 exercices max pour 30 minutes
      case "40 min": return 4;  // 4 exercices pour 40 minutes (legacy support)
      default: return 4;
    }
  };

  // Count total selected exercises across all domains
  const getTotalSelectedExercises = (): number => {
    return selectedTypes.reduce((total, domainKey) => {
      const domainParams = exerciceTypeParams[domainKey];
      if (domainParams && domainParams.exercises) {
        // Count exercises in this domain - use different delimiter for Nombres
        const delimiter = domainKey === "Nombres" ? "|||" : ",";
        const exercisesList = domainParams.exercises.split(delimiter).filter((ex: string) => ex.trim() !== '');
        return total + exercisesList.length;
      }
      return total;
    }, 0);
  };

  // Check if user can add more exercises
  const canAddMoreExercises = (domainKey?: string, additionalExercises = 0): boolean => {
    const limit = getExerciseLimits(duration);
    const currentTotal = getTotalSelectedExercises();
    
    // If we're checking for a specific domain, exclude it from current count
    if (domainKey && exerciceTypeParams[domainKey]) {
      const delimiter = domainKey === "Nombres" ? "|||" : ",";
      const domainExercisesList = exerciceTypeParams[domainKey].exercises?.split(delimiter).filter((ex: string) => ex.trim() !== '') || [];
      const currentTotalWithoutDomain = currentTotal - domainExercisesList.length;
      return (currentTotalWithoutDomain + additionalExercises) <= limit;
    }
    
    return (currentTotal + additionalExercises) <= limit;
  };

  // Get limit message
  const getLimitMessage = (): string => {
    const limit = getExerciseLimits(duration);
    return `Vous avez atteint la limite de ${limit} exercices pour la durée sélectionnée`;
  };

  // Handle duration change with exercise limit adjustment
  const handleDurationChange = (newDuration: string) => {
    const newLimit = getExerciseLimits(newDuration);
    const currentTotalExercises = getTotalSelectedExercises();
    
    // If current selection exceeds new limit, we need to trim exercises
    if (currentTotalExercises > newLimit) {
      // We'll need to remove domains or exercises to fit the new limit
      // For now, we'll remove entire domains starting from the end
      let remainingLimit = newLimit;
      const newSelectedTypes: string[] = [];
      const newParams = { ...exerciceTypeParams };
      
      for (const domainKey of selectedTypes) {
        const domainParams = exerciceTypeParams[domainKey];
        if (domainParams && domainParams.exercises) {
          const delimiter = domainKey === "Nombres" ? "|||" : ",";
          const exercisesList = domainParams.exercises.split(delimiter).filter((ex: string) => ex.trim() !== '');
          if (exercisesList.length <= remainingLimit) {
            newSelectedTypes.push(domainKey);
            remainingLimit -= exercisesList.length;
          } else {
            // Remove this domain entirely as it doesn't fit
            delete newParams[domainKey];
          }
        } else {
          // Domain without exercises, remove it
          delete newParams[domainKey];
        }
      }
      
      setSelectedTypes(newSelectedTypes);
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

  const toggleType = (domainKey: string) => {
    const exerciseDomainsWithModals = ["Nombres", "Calculs", "Grandeurs", "Geometrie"];
    
    if (exerciseDomainsWithModals.includes(domainKey)) {
      if (selectedTypes.includes(domainKey)) {
        setSelectedTypes(selectedTypes.filter(t => t !== domainKey));
        
        // Remove exercise type params
        const newParams = { ...exerciceTypeParams };
        delete newParams[domainKey];
        setExerciceTypeParams(newParams);
      } else {
        // Show modal to configure parameters - we'll check limits in the modal save handlers
        switch (domainKey) {
          case "Nombres":
            setShowNombresModal(true);
            break;
          case "Calculs":
            setShowCalculModal(true);
            break;
          case "Grandeurs":
            setShowMesuresModal(true);
            break;
          case "Geometrie":
            setShowGeometrieModal(true);
            break;
        }
      }
    } else {
      // Simple toggle for other types without parameters
      setSelectedTypes(selectedTypes.includes(domainKey)
        ? selectedTypes.filter(t => t !== domainKey)
        : [...selectedTypes, domainKey]);
    }
  };

  const handleNombresSave = (selectedExercises: string[]) => {
    const totalExercises = selectedExercises.length;
    const limit = getExerciseLimits(duration);
    
    if (!canAddMoreExercises("Nombres", totalExercises)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("Nombres")) {
      setSelectedTypes([...selectedTypes, "Nombres"]);
    }
    
    // Convert selected exercises to comma-separated string format
    const exercisesString = selectedExercises.join("|||");
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      "Nombres": {
        exercises: exercisesString
      }
    });
    
    // Store selections in the new format for the modal
    const selectionsObject: { [key: string]: number[] } = {};
    selectedExercises.forEach(exercise => {
      selectionsObject[exercise] = [1]; // Default to exercise variant 1
    });
    setNombresSelections(selectionsObject);
    setShowNombresModal(false);
  };

  const handleCalculSave = (params: CalculParams) => {
    const selectedExercisesList = params.operations.split(',').filter((ex: string) => ex.trim() !== '');
    const domainKey = "Calculs"; // Always use "Calculs" since we now have separate modals
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises(domainKey, selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes(domainKey)) {
      setSelectedTypes([...selectedTypes, domainKey]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      [domainKey]: {
        exercises: params.operations
      }
    });
  };

  const handleGeometrieSave = (params: GeometrieParams) => {
    const selectedExercisesList = params.types.split(',').filter(ex => ex.trim() !== '');
    const domainKey = "Geometrie"; // Updated to use "Geometrie"
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises(domainKey, selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes(domainKey)) {
      setSelectedTypes([...selectedTypes, domainKey]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      [domainKey]: {
        exercises: params.types
      }
    });
  };

  const handleMesuresSave = (params: MesuresParams) => {
    const selectedExercisesList = params.types.split(',').filter(ex => ex.trim() !== '');
    const domainKey = "Grandeurs"; // Updated to use "Grandeurs"
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises(domainKey, selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes(domainKey)) {
      setSelectedTypes([...selectedTypes, domainKey]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      [domainKey]: {
        exercises: params.types
      }
    });
  };

  const handleEditNombresParams = () => {
    setShowNombresModal(true);
  };

  const handleEditCalculParams = () => {
    setShowCalculModal(true);
  };

  const handleEditGeometrieParams = () => {
    setShowGeometrieModal(true);
  };

  const handleEditMesuresParams = () => {
    setShowMesuresModal(true);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (selectedTypes.length === 0) {
      setError('Veuillez sélectionner au moins un type d\'exercice');
      return;
    }
    
    // Check subscription limits
    if (!canGenerateMore()) {
      setError('Limite d\'abonnement atteinte pour ce mois');
      return;
    }

    // Show preview modal
    setShowPreviewModal(true);
  };

  const handleConfirmGeneration = async () => {
    setShowPreviewModal(false);
    setShowGeneratingModal(true);
    setError(null);
    setErrorMessage("");

    if (!user?.user_id) {
      setErrorMessage('Authentification utilisateur requise');
      setShowGeneratingModal(false);
      setShowErrorModal(true);
      return;
    }

    // Save parameters before generation for "Régénérer" functionality
    setLastGeneratedParams({
      level,
      duration,
      selectedTypes: [...selectedTypes],
      exerciceTypeParams: JSON.parse(JSON.stringify(exerciceTypeParams))
    });

    try {
      // Build exercicesByType structure similar to French generation
      const exercicesByType: ExercicesByType = {};
      
      selectedTypes.forEach(domainKey => {
        const domainParams = exerciceTypeParams[domainKey];
        if (domainParams && domainParams.exercises) {
          // Split exercises and create ExerciseWithParams structure - use different delimiter for Nombres
          const delimiter = domainKey === "Nombres" ? "|||" : ",";
          const exercisesList = domainParams.exercises.split(delimiter).map((ex: string) => ex.trim()).filter((ex: string) => ex !== '');
          exercicesByType[domainKey] = exercisesList.map((exerciseId: string) => ({
            exercice_id: exerciseId,
            params: {}
          }));
        } else if (selectedTypes.includes(domainKey)) {
          // Domain selected but no specific exercises configured - use default
          exercicesByType[domainKey] = [{
            exercice_id: `${domainKey}_general`,
            params: {}
          }];
        }
      });
      
      console.log('Math exercicesByType:', exercicesByType);
      
      // Generate the exercises using the unified service
      const request = buildExerciceGenerationRequest(
        level,
        duration,
        selectedTypes,
        "Exercices de mathématiques",
        ExerciceDomain.MATHEMATIQUES,
        exerciceTypeParams,
        undefined, // specific requirements
        exercicesByType, // Add the exercices_by_type parameter
        ficheTitle || undefined, // Custom title
        ficheTags.length > 0 ? ficheTags : undefined // Tags
      );
      
      console.log('Math generation request:', request);
      
      // Call the unified exercise service using the API function like French page
      const response = await generateExercisesApi(user.user_id, request);
      
      console.log('generateExercisesApi response:', response);
      
      // Check if generation was successful (ExerciseSession should have an id if successful)
      if (response.id) {
        // Store the session response for download handling
        setExercise(response);
        
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
        
        // Note: useCredit() is deprecated - backend now tracks usage automatically
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

  const regenerateSameSheet = () => {
    setShowSuccessModal(false);
    // Reset for potential regeneration
    setExercise(null);
  };

  const createNewSheet = () => {
    // Reset all parameters for a completely new sheet
    setLevel("CE1");
    setDuration("20 min");
    setSelectedTypes([]);
    setExerciceTypeParams({});
    setLastGeneratedParams(null);
    setShowSuccessModal(false);
    setExercise(null);
  };

  const restoreLastParameters = () => {
    if (lastGeneratedParams) {
      setLevel(lastGeneratedParams.level);
      setDuration(lastGeneratedParams.duration);
      setSelectedTypes([...lastGeneratedParams.selectedTypes]);
      setExerciceTypeParams(JSON.parse(JSON.stringify(lastGeneratedParams.exerciceTypeParams)));
    }
    setShowSuccessModal(false);
    setExercise(null);
  };

  const handleDownload = async () => {
    if (!exercise?.id || !exercise?.pdf_url || !user?.user_id) return;
    
    try {
      // Extract filename from pdf_url
      const urlParts = exercise.pdf_url.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      const blob = await downloadSessionPDF(user.user_id, filename);
      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `math-exercises-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError('Échec du téléchargement du PDF');
    }
  };

  const handleViewPDF = async () => {
    if (!exercise?.id || !exercise?.pdf_url || !user?.user_id) return;
    
    try {
      // Extract filename from pdf_url
      const urlParts = exercise.pdf_url.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      const blob = await downloadSessionPDF(user.user_id, filename);
      
      const viewerUrl = URL.createObjectURL(blob);
      setPdfViewerUrl(viewerUrl);
      setShowPDFViewerModal(true);
    } catch (err) {
      console.error('Failed to view PDF:', err);
      setError('Échec de la visualisation du PDF');
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

  const canGenerate = selectedTypes.length > 0 && !generating && canGenerateMore();

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
            {/* Enhanced Main Title with Clickable Calculator Icon */}
            <div className="d-flex align-items-center justify-content-center mb-3">
              <i 
                className="bi bi-calculator" 
                onClick={() => setShowExerciseGuideModal(true)}
                style={{ 
                  fontSize: '3rem',
                  color: '#87ceeb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginRight: '1.5rem',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)';
                  e.currentTarget.style.color = '#5fa8d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.color = '#87ceeb';
                }}
                title="Voir tous les exercices disponibles"
              ></i>
              <div className="text-center">
                <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                  Exercices de Mathématiques
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  Configurez vos exercices de mathématiques personnalisés
                </p>
              </div>
            </div>
            
            {/* Subscription info - only show when low */}
            {usageView && (() => {
              const remainingFiches = getRemainingFiches();
              const monthlyLimit = usageView.monthly_limit || 0;
              const tenPercentLimit = Math.floor(monthlyLimit * 0.1);
              
              return remainingFiches <= tenPercentLimit && remainingFiches > 0 && (
                <div className="alert alert-warning mb-4" style={{ borderRadius: '12px', border: '2px solid #f59e0b' }}>
                  <strong><i className="bi bi-exclamation-triangle me-2"></i>Attention : Il vous reste {remainingFiches} fiche{remainingFiches > 1 ? 's' : ''} ce mois</strong>
                  {usageView.addon_remaining > 0 && (
                    <div className="mt-2">
                      <small>Dont {usageView.addon_remaining} pack{usageView.addon_remaining > 1 ? 's' : ''} additionnel{usageView.addon_remaining > 1 ? 's' : ''}</small>
                    </div>
                  )}
                </div>
              );
            })()}

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
                              border: level === lvl ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              boxShadow: level === lvl ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (level !== lvl) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.15)';
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
                              <span className="fw-bold" style={{ fontSize: '0.9rem', color: level === lvl ? '#1d4ed8' : '#374151' }}>
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
                                border: duration === dur ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                boxShadow: duration === dur ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (duration !== dur) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.15)';
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
                                <span className="fw-bold" style={{ fontSize: '0.9rem', color: duration === dur ? '#1d4ed8' : '#374151' }}>
                                  {dur}
                                </span>
                              </Card.Body>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercise Domains Selection */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Domaines d'exercices
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                          <Badge 
                            bg={getTotalSelectedExercises() >= getExerciseLimits(duration) ? 'warning' : 'light'}
                            text={getTotalSelectedExercises() >= getExerciseLimits(duration) ? 'dark' : 'dark'}
                            className="d-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem', border: '1px solid #dee2e6' }}
                          >
                            <i className="bi bi-list-ol"></i>
                            {getTotalSelectedExercises()}/{getExerciseLimits(duration)} exercices
                          </Badge>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {getTotalSelectedExercises() >= getExerciseLimits(duration) ? (
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
                        {mathDomains.map(domain => {
                          const isSelected = selectedTypes.includes(domain.key);
                          // Only disable if no exercises available for level, not for limits
                          const availableExercises = getExercisesForLevel(domain, level);
                          const hasExercisesForLevel = availableExercises.length > 0;
                          const isDisabled = !hasExercisesForLevel;
                          
                          return (
                            <Card 
                              key={domain.key}
                              className="flex-fill"
                              onClick={() => !isDisabled && hasExercisesForLevel && toggleType(domain.key)}
                              style={{ 
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.6 : 1,
                                minWidth: '160px',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                transition: 'all 0.3s ease',
                                border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                              }}
                              title={
                                !hasExercisesForLevel 
                                  ? `Aucun exercice disponible pour le niveau ${level}` 
                                  : `${availableExercises.length} exercice${availableExercises.length > 1 ? 's' : ''} disponible${availableExercises.length > 1 ? 's' : ''} pour ${level}`
                              }
                              onMouseEnter={(e) => {
                                if (!isDisabled && !isSelected) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isDisabled && !isSelected) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                            >
                              <Card.Body className="p-2 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70px' }}>
                                <span className="fw-semibold" style={{ fontSize: '0.8rem', lineHeight: '1.2', color: isSelected ? '#1d4ed8' : '#374151' }}>
                                  <i className={`${getDomainIcon(domain.key)} me-1`}></i>
                                  {domain.label}
                                </span>
                                {hasExercisesForLevel && (
                                  <small className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                                    {availableExercises.length} exercice{availableExercises.length > 1 ? 's' : ''}
                                  </small>
                                )}
                                {!hasExercisesForLevel && (
                                  <small className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                                    Non disponible
                                  </small>
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
                          Paramètres configurés
                        </h6>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Nombres parameters */}
                          {selectedTypes.includes("Nombres") && exerciceTypeParams["Nombres"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #93c5fd',
                                minWidth: '180px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                              }}
                              onClick={handleEditNombresParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = '#93c5fd';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-123 me-1" style={{ color: '#3b82f6' }}></i>
                                  Nombres
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("Nombres")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Calculs parameters */}
                          {selectedTypes.includes("Calculs") && exerciceTypeParams["Calculs"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #93c5fd',
                                minWidth: '180px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                              }}
                              onClick={handleEditCalculParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = '#93c5fd';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-calculator me-1" style={{ color: '#3b82f6' }}></i>
                                  Calculs
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("Calculs")}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Grandeurs parameters */}
                          {selectedTypes.includes("Grandeurs") && exerciceTypeParams["Grandeurs"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #93c5fd',
                                minWidth: '180px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                              }}
                              onClick={handleEditMesuresParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = '#93c5fd';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-rulers me-1" style={{ color: '#3b82f6' }}></i>
                                  Grandeurs
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("Grandeurs")}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Geometrie parameters */}
                          {selectedTypes.includes("Geometrie") && exerciceTypeParams["Geometrie"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2" 
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #93c5fd',
                                minWidth: '180px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                              }}
                              onClick={handleEditGeometrieParams}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                                e.currentTarget.style.borderColor = '#93c5fd';
                              }}
                              title="Cliquer pour modifier"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.8rem', color: '#374151' }}>
                                  <i className="bi bi-triangle me-1" style={{ color: '#3b82f6' }}></i>
                                  Géométrie
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                  {getConfiguredExerciseLabels("Geometrie")}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}

                  <div className="d-grid mt-3">
                    <Button 
                      type="submit" 
                      disabled={!canGenerate} 
                      size="lg"
                      style={{
                        background: canGenerate ? 'linear-gradient(135deg, #87ceeb, #70b8d6)' : undefined,
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.7rem',
                        fontWeight: '600',
                        boxShadow: canGenerate ? '0 4px 15px rgba(135, 206, 235, 0.3)' : undefined
                      }}
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          Aperçu de la fiche
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {!canGenerate && selectedTypes.length === 0 && (
                    <small className="text-muted d-block text-center mt-2" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Veuillez sélectionner au moins un domaine d'exercice
                    </small>
                  )}
                  
                  {!canGenerate && !canGenerateMore() && (
                    <small className="text-danger d-block text-center mt-2" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-exclamation-circle me-1"></i>
                      Limite d'abonnement atteinte ce mois
                    </small>
                  )}
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
            <div>
              {/* Basic Information - Compact */}
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

              {/* Selected Exercises - Compact List with Labels */}
              <div className="mb-3">
                <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#495057', marginBottom: '0.75rem' }}>
                  Exercices sélectionnés
                </h6>
                <div style={{ fontSize: '0.85rem' }}>
                  {selectedTypes.map((type, index) => {
                    const exerciseInfo = mathDomains.find(domain => domain.key === type);
                    return (
                      <div 
                        key={type} 
                        style={{ 
                          padding: '0.5rem 0',
                          borderBottom: index < selectedTypes.length - 1 ? '1px solid #f0f0f0' : 'none'
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
              disabled={!canGenerateMore()}
              style={{
                background: canGenerateMore() ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : undefined,
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'white'
              }}
            >
              {!canGenerateMore() ? 'Limite atteinte' : 'Confirmer et générer'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Generating Modal */}
        <GenerationLoadingModal show={showGeneratingModal} completed={generationCompleted} />

        {/* Success Modal */}
        <Modal show={showSuccessModal} onHide={regenerateSameSheet} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef', padding: '1rem 1.5rem' }}>
            <Modal.Title className="w-100 text-center" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
              <span style={{ color: '#3b82f6', marginRight: '6px', fontSize: '1.2rem' }}>✓</span>
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
                      {mathDomains.find(domain => domain.key === t)?.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e9ecef' }} />

              {/* Action Buttons */}
              {exercise && exercise.pdf_url && (
                <div className="d-grid gap-2">
                  <Button 
                    onClick={handleDownload}
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
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
                    style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                  >
                    <i className="bi bi-eye me-2"></i>
                    Visualiser et imprimer
                  </Button>
                </div>
              )}
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
        <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Erreur de génération
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="danger">
              <p className="mb-0">{errorMessage}</p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Level Change Confirmation Modal */}
        <Modal show={showLevelChangeModal} onHide={cancelLevelChange} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-exclamation-triangle text-warning me-2"></i>
              Confirmer le changement de niveau
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Vous avez des exercices sélectionnés ou configurés pour le niveau <strong>{level}</strong>. 
              Changer le niveau vers <strong>{pendingLevel}</strong> réinitialisera vos sélections.
            </p>
            <p className="text-muted">Voulez-vous continuer ?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelLevelChange}>
              Annuler
            </Button>
            <Button variant="warning" onClick={confirmLevelChange}>
              <i className="bi bi-check me-2"></i>
              Confirmer le changement
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Nombres, calcul & problèmes Modal */}
        {/* Nombres Modal */}
        <NombresModal
          show={showNombresModal}
          onHide={() => setShowNombresModal(false)}
          onSave={handleNombresSave}
          level={level}
          initialSelections={exerciceTypeParams["Nombres"] ? exerciceTypeParams["Nombres"].exercises?.split('|||') : []}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          canAddMoreExercises={canAddMoreExercises}
          mathDomains={mathDomains}
        />

        {/* Calculs Modal */}
        <CalculModal
          show={showCalculModal}
          onHide={() => setShowCalculModal(false)}
          onSave={handleCalculSave}
          level={level}
          initialParams={exerciceTypeParams["Calculs"] ? { operations: exerciceTypeParams["Calculs"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="Calculs"
          canAddMoreExercises={canAddMoreExercises}
          mathDomains={mathDomains}
        />

        {/* Grandeurs Modal */}
        <MesuresModal
          show={showMesuresModal}
          onHide={() => setShowMesuresModal(false)}
          onSave={handleMesuresSave}
          level={level}
          initialParams={exerciceTypeParams["Grandeurs"] ? { types: exerciceTypeParams["Grandeurs"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="Grandeurs"
          canAddMoreExercises={canAddMoreExercises}
          mathDomains={mathDomains}
        />

        {/* Geometrie Modal */}
        <GeometrieModal
          show={showGeometrieModal}
          onHide={() => setShowGeometrieModal(false)}
          onSave={handleGeometrieSave}
          level={level}
          initialParams={exerciceTypeParams["Geometrie"] ? { types: exerciceTypeParams["Geometrie"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="Geometrie"
          canAddMoreExercises={canAddMoreExercises}
          mathDomains={mathDomains}
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

        {/* Exercise Guide Modal */}
        <Modal 
          show={showExerciseGuideModal} 
          onHide={() => setShowExerciseGuideModal(false)} 
          size="lg" 
          centered
          scrollable
        >
          <Modal.Header 
            closeButton 
            style={{ 
              background: 'linear-gradient(135deg, #dbeafe 0%, #87ceeb 100%)',
              borderBottom: '3px solid #5fa8d3'
            }}
          >
            <Modal.Title className="fw-bold d-flex align-items-center">
              <i className="bi bi-calculator-fill me-2" style={{ color: '#0c4a6e', fontSize: '1.5rem' }}></i>
              Guide des Exercices de Mathématiques
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', backgroundColor: '#f0f9ff' }}>
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
                      border: '2px solid #87ceeb',
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
                    border: '2px solid #87ceeb',
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

            {/* Nombres */}
            {mathExerciseNaming.nombres && mathExerciseNaming.nombres.filter((exercise: any) => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
            ).length > 0 && (
              <div className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#0c4a6e' }}>
                  <i className="bi bi-123 me-2"></i>
                  Nombres
                  <Badge bg="primary" className="ms-2">
                    {mathExerciseNaming.nombres.filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    ).length} exercices
                  </Badge>
                </h5>
                <Row className="g-3">
                  {mathExerciseNaming.nombres
                    .filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    )
                    .map((exercise: any) => (
                    <Col md={6} key={exercise.id}>
                      <Card className="h-100 border-primary shadow-sm" style={{ borderLeft: '4px solid #87ceeb' }}>
                        <Card.Body>
                          <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                            {exercise.label}
                          </h6>
                          <p className="small text-muted mb-2">{exercise.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {exercise.levels?.map((lvl: string) => (
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

            {/* Calculs */}
            {mathExerciseNaming.calculs && mathExerciseNaming.calculs.filter((exercise: any) => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
            ).length > 0 && (
              <div className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#0c4a6e' }}>
                  <i className="bi bi-plus-slash-minus me-2"></i>
                  Calculs
                  <Badge bg="primary" className="ms-2">
                    {mathExerciseNaming.calculs.filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    ).length} exercices
                  </Badge>
                </h5>
                <Row className="g-3">
                  {mathExerciseNaming.calculs
                    .filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    )
                    .map((exercise: any) => (
                    <Col md={6} key={exercise.id}>
                      <Card className="h-100 border-primary shadow-sm" style={{ borderLeft: '4px solid #87ceeb' }}>
                        <Card.Body>
                          <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                            {exercise.label}
                          </h6>
                          <p className="small text-muted mb-2">{exercise.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {exercise.levels?.map((lvl: string) => (
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

            {/* Grandeurs (Mesures) */}
            {mathExerciseNaming.grandeurs && mathExerciseNaming.grandeurs.filter((exercise: any) => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
            ).length > 0 && (
              <div className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#0c4a6e' }}>
                  <i className="bi bi-rulers me-2"></i>
                  Grandeurs et Mesures
                  <Badge bg="primary" className="ms-2">
                    {mathExerciseNaming.grandeurs.filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    ).length} exercices
                  </Badge>
                </h5>
                <Row className="g-3">
                  {mathExerciseNaming.grandeurs
                    .filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    )
                    .map((exercise: any) => (
                    <Col md={6} key={exercise.id}>
                      <Card className="h-100 border-primary shadow-sm" style={{ borderLeft: '4px solid #87ceeb' }}>
                        <Card.Body>
                          <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                            {exercise.label}
                          </h6>
                          <p className="small text-muted mb-2">{exercise.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {exercise.levels?.map((lvl: string) => (
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

            {/* Géométrie */}
            {mathExerciseNaming.geometrie && mathExerciseNaming.geometrie.filter((exercise: any) => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
            ).length > 0 && (
              <div className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#0c4a6e' }}>
                  <i className="bi bi-triangle me-2"></i>
                  Géométrie
                  <Badge bg="primary" className="ms-2">
                    {mathExerciseNaming.geometrie.filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    ).length} exercices
                  </Badge>
                </h5>
                <Row className="g-3">
                  {mathExerciseNaming.geometrie
                    .filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    )
                    .map((exercise: any) => (
                    <Col md={6} key={exercise.id}>
                      <Card className="h-100 border-primary shadow-sm" style={{ borderLeft: '4px solid #87ceeb' }}>
                        <Card.Body>
                          <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                            {exercise.label}
                          </h6>
                          <p className="small text-muted mb-2">{exercise.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {exercise.levels?.map((lvl: string) => (
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

            {/* Problèmes */}
            {mathExerciseNaming.problemes && mathExerciseNaming.problemes.filter((exercise: any) => 
              (exerciseGuideSearch === '' || 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
              (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
            ).length > 0 && (
              <div className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#0c4a6e' }}>
                  <i className="bi bi-lightbulb me-2"></i>
                  Problèmes
                  <Badge bg="primary" className="ms-2">
                    {mathExerciseNaming.problemes.filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    ).length} exercices
                  </Badge>
                </h5>
                <Row className="g-3">
                  {mathExerciseNaming.problemes
                    .filter((exercise: any) => 
                      (exerciseGuideSearch === '' || 
                       exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
                       exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())) &&
                      (exerciseGuideLevel === '' || exercise.levels?.includes(exerciseGuideLevel))
                    )
                    .map((exercise: any) => (
                    <Col md={6} key={exercise.id}>
                      <Card className="h-100 border-primary shadow-sm" style={{ borderLeft: '4px solid #87ceeb' }}>
                        <Card.Body>
                          <h6 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                            {exercise.label}
                          </h6>
                          <p className="small text-muted mb-2">{exercise.description}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {exercise.levels?.map((lvl: string) => (
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
            {exerciseGuideSearch && 
             (!mathExerciseNaming.nombres || mathExerciseNaming.nombres.filter((exercise: any) => 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())
             ).length === 0) &&
             (!mathExerciseNaming.calculs || mathExerciseNaming.calculs.filter((exercise: any) => 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())
             ).length === 0) &&
             (!mathExerciseNaming.grandeurs || mathExerciseNaming.grandeurs.filter((exercise: any) => 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())
             ).length === 0) &&
             (!mathExerciseNaming.geometrie || mathExerciseNaming.geometrie.filter((exercise: any) => 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())
             ).length === 0) &&
             (!mathExerciseNaming.problemes || mathExerciseNaming.problemes.filter((exercise: any) => 
               exercise.label.toLowerCase().includes(exerciseGuideSearch.toLowerCase()) ||
               exercise.description.toLowerCase().includes(exerciseGuideSearch.toLowerCase())
             ).length === 0) && (
              <div className="text-center py-5">
                <i className="bi bi-search" style={{ fontSize: '3rem', color: '#87ceeb' }}></i>
                <p className="text-muted mt-3">Aucun exercice trouvé pour "{exerciseGuideSearch}"</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#dbeafe', borderTop: '2px solid #87ceeb' }}>
            <Button 
              variant="primary" 
              onClick={() => setShowExerciseGuideModal(false)}
              style={{ 
                fontWeight: '600',
                background: 'linear-gradient(135deg, #87ceeb, #5fa8d3)',
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
