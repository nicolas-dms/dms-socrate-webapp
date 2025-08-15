"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card, Modal, Alert, Badge } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import { exerciseService, ExerciseGenerationResponse } from "../../../services/exerciseService";
import { ExerciceDomain, ExerciceTypeParam } from "../../../types/exerciceTypes";
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";
import styles from "../../page.module.css";

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
  
  // Generation and success states
  const [generating, setGenerating] = useState(false);
  const [exercise, setExercise] = useState<ExerciseGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mathTypes = [
    { key: "calcul", label: "Calcul" },
    { key: "geometrie", label: "Géométrie" },
    { key: "mesures", label: "Mesures" },
    { key: "problemes", label: "Problèmes" },
  ];

  // Helper function to get icons for exercise types
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "calcul": return "bi-calculator";
      case "geometrie": return "bi-triangle";
      case "mesures": return "bi-rulers";
      case "problemes": return "bi-lightbulb";
      default: return "bi-circle";
    }
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

  const toggleType = (type: string) => {
    // Check if trying to add a new exercise when at limit
    if (!selectedTypes.includes(type) && !canAddMoreExercises()) {
      alert(getLimitMessage());
      return;
    }
    
    // Simple toggle for now - we'll add modal functionality later
    setSelectedTypes(selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]);
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
      const newExercise = await exerciseService.generateExercise(
        user.user_id,
        level,
        duration,
        selectedTypes,
        "Exercices de mathématiques",
        ExerciceDomain.MATHEMATIQUES,
        exerciceTypeParams,
        undefined // specific requirements
      );
      
      // Check if generation was successful
      if (newExercise.success) {
        // Use a fiche from subscription allowance
        await useCredit();
        setExercise(newExercise);
      } else {
        throw new Error(newExercise.error_message || 'Erreur lors de la génération du PDF');
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
    if (!exercise?.pdf_path && !exercise?.pdf_base64) return;
    
    try {
      let blob: Blob;
      
      // Prefer base64 data if available (faster, no additional request)
      if (exercise.pdf_base64) {
        blob = exerciseService.base64ToBlob(exercise.pdf_base64);
      } else if (exercise.pdf_path) {
        blob = await exerciseService.downloadExercisePDF(exercise.pdf_path);
      } else {
        throw new Error('No PDF data available');
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `math-exercises-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError('Échec du téléchargement du PDF');
    }
  };

  const canGenerate = selectedTypes.length > 0 && !generating && canGenerateMore();

  return (
    <ProtectedPage>
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
                            onClick={() => setLevel(lvl)}
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
                        {mathTypes.map(type => {
                          const isSelected = selectedTypes.includes(type.key);
                          const isLimitReached = !isSelected && !canAddMoreExercises();
                          const isDisabled = isLimitReached;
                          
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
                              title={isLimitReached ? getLimitMessage() : ""}
                            >
                              <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center" style={{ position: 'relative' }}>
                                <span className={`fw-bold ${isSelected ? 'text-dark-emphasis' : 'text-dark'}`}>
                                  <i className={`${getTypeIcon(type.key)} me-2`}></i>
                                  {type.label}
                                </span>
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
                
                {exercise && exercise.success && (
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
                    {(exercise.pdf_path || exercise.pdf_base64) && (
                      <div className="d-grid gap-2">
                        <Button onClick={handleDownload} variant="success">
                          <i className="bi bi-download me-2"></i>
                          Télécharger le PDF
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedPage>
  );
}
