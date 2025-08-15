"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
// Import de services
import { generateExercises, downloadSessionPDF } from '@/services/exerciseService';
import type { ExerciseSession } from '@/services/exerciseService';
import { ExerciceGenerationRequest, buildExerciceGenerationRequest, ExerciceDomain, ExerciceTypeParam } from '../../../types/exerciceTypes';
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";
import styles from "../../page.module.css";

// Import the new math modals
import CalculModal, { CalculParams } from "../../../components/CalculModal";
import GeometrieModal, { GeometrieParams } from "../../../components/GeometrieModal";
import MesuresModal, { MesuresParams } from "../../../components/MesuresModal";
import ProblemesModal, { ProblemesParams } from "../../../components/ProblemesModal";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const durations = ["20 min", "30 min", "40 min"];

export default function GenerateMathPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, canGenerateMore, getRemainingFiches, useCredit } = useSubscription();
  
  // Form state
  const [level, setLevel] = useState("CE1");
  const [duration, setDuration] = useState("30 min");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Exercise type parameters
  const [exerciceTypeParams, setExerciceTypeParams] = useState<ExerciceTypeParam>({});
  
  // Modal states
  const [showCalculModal, setShowCalculModal] = useState(false);
  const [showGeometrieModal, setShowGeometrieModal] = useState(false);
  const [showMesuresModal, setShowMesuresModal] = useState(false);
  const [showProblemesModal, setShowProblemesModal] = useState(false);
  
  // Level change confirmation modal
  const [showLevelChangeModal, setShowLevelChangeModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<string>("");
  
  // Generation and success states
  const [generating, setGenerating] = useState(false);
  const [exercise, setExercise] = useState<ExerciseSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const mathDomains = [
    { 
      key: "nombres-calcul", 
      label: "Nombres, calcul & problèmes",
      exercises: [
        { exercise: "Lire et écrire les nombres", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Additions simples", levels: ["CP", "CE1"] },
        { exercise: "Soustractions simples", levels: ["CP", "CE1"] },
        { exercise: "Additions avec retenue", levels: ["CE1", "CE2"] },
        { exercise: "Soustractions avec retenue", levels: ["CE1", "CE2"] },
        { exercise: "Tables de multiplication", levels: ["CE1", "CE2"] },
        { exercise: "Multiplications posées", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Divisions posées", levels: ["CM1", "CM2"] },
        { exercise: "Fractions et parts", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Calcul mental", levels: ["CP", "CE1", "CE2", "CM1", "CM2"] },
        { exercise: "Problèmes simples", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Problèmes à étapes", levels: ["CE2", "CM1", "CM2"] }
      ]
    },
    { 
      key: "grandeurs-mesures", 
      label: "Grandeurs & mesures",
      exercises: [
        { exercise: "Mesurer des longueurs", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Comparer des longueurs", levels: ["CP", "CE1"] },
        { exercise: "Lire l'heure", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Durées simples", levels: ["CE1", "CE2", "CM1"] },
        { exercise: "Monnaie et prix", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Conversions de mesures", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Périmètre de figures", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Problèmes de mesures", levels: ["CE2", "CM1", "CM2"] }
      ]
    },
    { 
      key: "espace-geometrie", 
      label: "Espace & géométrie",
      exercises: [
        { exercise: "Reconnaître les formes", levels: ["CP", "CE1"] },
        { exercise: "Reproduire une figure", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Solides et faces", levels: ["CE1", "CE2"] },
        { exercise: "Quadrillage et repérage", levels: ["CE1", "CE2", "CM1", "CM2"] },
        { exercise: "Traits droits et parallèles", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Symétrie", levels: ["CE2", "CM1", "CM2"] },
        { exercise: "Angles et types d'angles", levels: ["CM1", "CM2"] },
        { exercise: "Constructions géométriques", levels: ["CM1", "CM2"] }
      ]
    },
    { 
      key: "donnees", 
      label: "Organisation & gestion de données",
      exercises: [
        { exercise: "Lire un tableau simple", levels: ["CP", "CE1", "CE2"] },
        { exercise: "Compléter un tableau", levels: ["CE1", "CE2", "CM1", "CM2"] },
        { exercise: "Graphiques en images", levels: ["CP", "CE1"] },
        { exercise: "Graphiques en barres", levels: ["CE1", "CE2", "CM1", "CM2"] },
        { exercise: "Lire un diagramme", levels: ["CE1", "CE2", "CM1", "CM2"] },
        { exercise: "Problèmes avec données", levels: ["CE2", "CM1", "CM2"] }
      ]
    }
  ];

  // Helper function to get icons for exercise domains
  const getDomainIcon = (domainKey: string) => {
    switch (domainKey) {
      case "nombres-calcul": return "bi-calculator";
      case "grandeurs-mesures": return "bi-rulers";
      case "espace-geometrie": return "bi-triangle";
      case "donnees": return "bi-bar-chart";
      default: return "bi-circle";
    }
  };

  // Get available exercises for current level
  const getExercisesForLevel = (domain: any, currentLevel: string) => {
    return domain.exercises.filter((exercise: any) => 
      exercise.levels.includes(currentLevel)
    );
  };

  // Exercise limits based on duration (4 minutes per exercise)
  const getExerciseLimits = (duration: string): number => {
    switch (duration) {
      case "20 min": return 5;  // 5 exercices pour 20 minutes (4 min par exercice)
      case "30 min": return 7;  // 7 exercices pour 30 minutes (4 min par exercice)
      case "40 min": return 10; // 10 exercices pour 40 minutes (4 min par exercice)
      default: return 7;
    }
  };

  // Count total selected exercises across all domains
  const getTotalSelectedExercises = (): number => {
    return selectedTypes.reduce((total, domainKey) => {
      const domainParams = exerciceTypeParams[domainKey];
      if (domainParams && domainParams.exercises) {
        // Count exercises in this domain
        const exercisesList = domainParams.exercises.split(',').filter(ex => ex.trim() !== '');
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
      const domainExercisesList = exerciceTypeParams[domainKey].exercises?.split(',').filter(ex => ex.trim() !== '') || [];
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
          const exercisesList = domainParams.exercises.split(',').filter(ex => ex.trim() !== '');
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
    const exerciseDomainsWithModals = ["nombres-calcul", "grandeurs-mesures", "espace-geometrie", "donnees"];
    
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
          case "nombres-calcul":
            setShowCalculModal(true);
            break;
          case "grandeurs-mesures":
            setShowMesuresModal(true);
            break;
          case "espace-geometrie":
            setShowGeometrieModal(true);
            break;
          case "donnees":
            setShowProblemesModal(true);
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

  const handleCalculSave = (params: CalculParams) => {
    const selectedExercisesList = params.operations.split(',').filter(ex => ex.trim() !== '');
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises("nombres-calcul", selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("nombres-calcul")) {
      setSelectedTypes([...selectedTypes, "nombres-calcul"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      "nombres-calcul": {
        exercises: params.operations
      }
    });
  };

  const handleGeometrieSave = (params: GeometrieParams) => {
    const selectedExercisesList = params.types.split(',').filter(ex => ex.trim() !== '');
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises("espace-geometrie", selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("espace-geometrie")) {
      setSelectedTypes([...selectedTypes, "espace-geometrie"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      "espace-geometrie": {
        exercises: params.types
      }
    });
  };

  const handleMesuresSave = (params: MesuresParams) => {
    const selectedExercisesList = params.types.split(',').filter(ex => ex.trim() !== '');
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises("grandeurs-mesures", selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("grandeurs-mesures")) {
      setSelectedTypes([...selectedTypes, "grandeurs-mesures"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      "grandeurs-mesures": {
        exercises: params.types
      }
    });
  };

  const handleProblemesSave = (params: ProblemesParams) => {
    const selectedExercisesList = params.types.split(',').filter(ex => ex.trim() !== '');
    
    // Check if adding these exercises would exceed the limit
    if (!canAddMoreExercises("donnees", selectedExercisesList.length)) {
      return; // Silently prevent save - UI should have prevented this
    }
    
    if (!selectedTypes.includes("donnees")) {
      setSelectedTypes([...selectedTypes, "donnees"]);
    }
    
    setExerciceTypeParams({
      ...exerciceTypeParams,
      donnees: {
        exercises: params.types
      }
    });
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

  const handleEditProblemesParams = () => {
    setShowProblemesModal(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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

    if (!user?.user_id) {
      setError('Authentification utilisateur requise');
      return;
    }

    setGenerating(true);
    
    try {
      // Generate the exercises using the unified service
      const request = buildExerciceGenerationRequest(
        level,
        duration,
        selectedTypes,
        "Exercices de mathématiques",
        ExerciceDomain.MATHEMATIQUES,
        exerciceTypeParams,
        undefined // specific requirements
      );
      
      const newExercise = await generateExercises(user.user_id, request);
      
      // Check if generation was successful (service returns ExerciseSession directly on success)
      if (newExercise && newExercise.id) {
        // Use a fiche from subscription allowance
        await useCredit();
        setExercise(newExercise);
      } else {
        throw new Error('Erreur lors de la génération du PDF');
      }
    } catch (err) {
      console.error('Failed to generate exercises:', err);
      const errorMessage = err instanceof Error ? err.message : 'Échec de la génération des exercices. Veuillez réessayer.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
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
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
                Exercices de Mathématiques
              </h2>
              <hr className="w-25 mx-auto mt-3 mb-4" style={{ height: '2px', background: 'linear-gradient(90deg, #6c757d, #adb5bd)', border: 'none', borderRadius: '1px' }} />
            </div>
            
            {/* Subscription info - only show when low */}
            {subscription && (() => {
              const remainingFiches = getRemainingFiches();
              const monthlyLimit = subscription.monthlyLimit || 0;
              const tenPercentLimit = Math.floor(monthlyLimit * 0.1);
              
              return remainingFiches <= tenPercentLimit && (
                <div className="alert alert-warning mb-4">
                  <strong>⚠️ Attention : Il vous reste seulement {remainingFiches} fiches ce mois</strong>
                  <br />
                  <small>Coût : 1 fiche par génération</small>
                </div>
              );
            })()}

            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <form onSubmit={handleGenerate}>
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

                    {/* Exercise Domains Selection */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Domaines d'exercices</h6>
                        <div className="d-flex align-items-center gap-2">
                          <Badge 
                            bg={getTotalSelectedExercises() >= getExerciseLimits(duration) ? 'warning' : 'secondary'} 
                            className="d-flex align-items-center gap-1"
                          >
                            <i className="bi bi-list-ol"></i>
                            {getTotalSelectedExercises()}/{getExerciseLimits(duration)} exercices
                          </Badge>
                          <small className="text-muted">
                            {getTotalSelectedExercises() >= getExerciseLimits(duration) ? (
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
                        {mathDomains.map(domain => {
                          const isSelected = selectedTypes.includes(domain.key);
                          // Only disable if no exercises available for level, not for limits
                          const availableExercises = getExercisesForLevel(domain, level);
                          const hasExercisesForLevel = availableExercises.length > 0;
                          const isDisabled = !hasExercisesForLevel;
                          
                          return (
                            <Card 
                              key={domain.key}
                              className={`${styles.selectorCard} border border-2 ${isSelected ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow flex-fill`}
                              onClick={() => !isDisabled && hasExercisesForLevel && toggleType(domain.key)}
                              style={{ 
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.6 : 1,
                                minWidth: '180px'
                              }}
                              title={
                                !hasExercisesForLevel 
                                  ? `Aucun exercice disponible pour le niveau ${level}` 
                                  : `${availableExercises.length} exercice${availableExercises.length > 1 ? 's' : ''} disponible${availableExercises.length > 1 ? 's' : ''} pour ${level}`
                              }
                            >
                              <Card.Body className="p-3 text-center d-flex flex-column align-items-center justify-content-center" style={{ position: 'relative', minHeight: '80px' }}>
                                <span className={`fw-bold ${isSelected ? 'text-dark-emphasis' : 'text-dark'}`} style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
                                  <i className={`${getDomainIcon(domain.key)} me-2`}></i>
                                  {domain.label}
                                </span>
                                {hasExercisesForLevel && (
                                  <small className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                    {availableExercises.length} exercice{availableExercises.length > 1 ? 's' : ''}
                                  </small>
                                )}
                                {!hasExercisesForLevel && (
                                  <small className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
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
                  <div className="mb-3">
                    {(selectedTypes.some(type => exerciceTypeParams[type])) && (
                      <div>
                        <h6 className="mb-3 text-muted">Paramètres des exercices</h6>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Nombres, calcul & problèmes parameters */}
                          {selectedTypes.includes("nombres-calcul") && exerciceTypeParams["nombres-calcul"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditCalculParams}
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
                                  <i className="bi bi-calculator me-1"></i>
                                  Nombres & calcul
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams["nombres-calcul"].exercises || "Exercices sélectionnés"}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}
                          
                          {/* Grandeurs & mesures parameters */}
                          {selectedTypes.includes("grandeurs-mesures") && exerciceTypeParams["grandeurs-mesures"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditMesuresParams}
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
                                  <i className="bi bi-rulers me-1"></i>
                                  Grandeurs & mesures
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams["grandeurs-mesures"].exercises || "Exercices sélectionnés"}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}

                          {/* Espace & géométrie parameters */}
                          {selectedTypes.includes("espace-geometrie") && exerciceTypeParams["espace-geometrie"] && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditGeometrieParams}
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
                                  <i className="bi bi-triangle me-1"></i>
                                  Espace & géométrie
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams["espace-geometrie"].exercises || "Exercices sélectionnés"}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                          )}

                          {/* Organisation & gestion de données parameters */}
                          {selectedTypes.includes("donnees") && exerciceTypeParams.donnees && (
                            <div 
                              className="border rounded p-2 d-flex align-items-center gap-2 cursor-pointer" 
                              style={{ 
                                backgroundColor: '#f8f9fa', 
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={handleEditProblemesParams}
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
                                  <i className="bi bi-bar-chart me-1"></i>
                                  Données
                                </div>
                                <div style={{ fontSize: '0.75rem' }} className="text-muted">
                                  {exerciceTypeParams.donnees.exercises || "Exercices sélectionnés"}
                                </div>
                              </div>
                              <i className="bi bi-pencil text-muted" style={{ fontSize: '0.8rem' }}></i>
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

                  <div className="d-grid mt-4">
                    <Button 
                      type="submit" 
                      disabled={!canGenerate} 
                      size="lg"
                      variant="primary"
                      className="fw-semibold"
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-pdf me-2"></i>
                          Générer les exercices
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {!canGenerate && selectedTypes.length === 0 && (
                    <small className="text-muted d-block text-center mt-2">
                      Veuillez sélectionner au moins un type d'exercice
                    </small>
                  )}
                  
                  {!canGenerate && !canGenerateMore() && (
                    <small className="text-danger d-block text-center mt-2">
                      Limite d'abonnement atteinte ce mois
                    </small>
                  )}
                </form>
                
                {exercise && exercise.id && (
                  <div className="alert alert-success mt-3">
                    <h5>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Fiche d'exercices générée avec succès!
                    </h5>
                    <p>
                      <strong>Matière:</strong> Mathématiques <br />
                      <strong>Niveau:</strong> {level} <br />
                      <strong>Durée:</strong> {duration} <br />
                      <strong>Types d'exercices:</strong> {selectedTypes.join(", ")}
                    </p>
                    {exercise.pdf_url && (
                      <div className="d-grid gap-2">
                        <Button onClick={handleDownload} variant="success">
                          <i className="bi bi-download me-2"></i>
                          Télécharger le PDF
                        </Button>
                        <Button onClick={handleViewPDF} variant="outline-primary">
                          <i className="bi bi-eye me-2"></i>
                          Visualiser et imprimer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

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
        <CalculModal
          show={showCalculModal}
          onHide={() => setShowCalculModal(false)}
          onSave={handleCalculSave}
          level={level}
          initialParams={exerciceTypeParams["nombres-calcul"] ? { operations: exerciceTypeParams["nombres-calcul"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="nombres-calcul"
          canAddMoreExercises={canAddMoreExercises}
        />

        {/* Grandeurs & mesures Modal */}
        <MesuresModal
          show={showMesuresModal}
          onHide={() => setShowMesuresModal(false)}
          onSave={handleMesuresSave}
          level={level}
          initialParams={exerciceTypeParams["grandeurs-mesures"] ? { types: exerciceTypeParams["grandeurs-mesures"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="grandeurs-mesures"
          canAddMoreExercises={canAddMoreExercises}
        />

        {/* Espace & géométrie Modal */}
        <GeometrieModal
          show={showGeometrieModal}
          onHide={() => setShowGeometrieModal(false)}
          onSave={handleGeometrieSave}
          level={level}
          initialParams={exerciceTypeParams["espace-geometrie"] ? { types: exerciceTypeParams["espace-geometrie"].exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="espace-geometrie"
          canAddMoreExercises={canAddMoreExercises}
        />

        {/* Organisation & gestion de données Modal */}
        <ProblemesModal
          show={showProblemesModal}
          onHide={() => setShowProblemesModal(false)}
          onSave={handleProblemesSave}
          level={level}
          initialParams={exerciceTypeParams.donnees ? { types: exerciceTypeParams.donnees.exercises } : undefined}
          exerciseLimit={getExerciseLimits(duration)}
          currentTotalExercises={getTotalSelectedExercises()}
          domainKey="donnees"
          canAddMoreExercises={canAddMoreExercises}
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
      </Container>
    </ProtectedPage>
  );
}
