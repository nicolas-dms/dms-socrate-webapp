"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import ProtectedPage from "../../../components/ProtectedPage";
import { exerciseService, ExerciseGenerationResponse } from "../../../services/exerciseService";
import { ExerciceDomain } from "../../../types/exerciceTypes";
import { useSubscription } from "../../../context/SubscriptionContext";
import { useAuth } from "../../../context/AuthContext";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];

export default function GenerateMathPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, canGenerateMore, getRemainingFiches, useCredit } = useSubscription();
  const [level, setLevel] = useState(levels[0]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [exercise, setExercise] = useState<ExerciseGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const mathTypes = [
    { key: "add", label: t('generate.mathTypes.add') },
    { key: "sub", label: t('generate.mathTypes.sub') },
    { key: "mul", label: t('generate.mathTypes.mul') },
    { key: "div", label: t('generate.mathTypes.div') },
    { key: "word", label: t('generate.mathTypes.word') },
  ];

  const toggleType = (type: string) => {
    setSelectedTypes(selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (selectedTypes.length === 0) {
      setError(t('generate.validation.selectAtLeastOneType', 'Please select at least one exercise type'));
      return;
    }
    
    // Check subscription limits
    if (!canGenerateMore()) {
      setError('Limite d\'abonnement atteinte pour ce mois');
      return;
    }

    if (!user?.user_id) {
      setError(t('generate.validation.userRequired', 'User authentication required'));
      return;
    }

    setGenerating(true);
    
    try {
      // Generate the exercises using the unified service
      const newExercise = await exerciseService.generateExercise(
        user.user_id,
        level,
        "30 min",
        selectedTypes,
        "Exercices mathématiques",
        ExerciceDomain.MATHEMATIQUES,
        {}, // exercise type parameters
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
      const errorMessage = err instanceof Error ? err.message : t('generate.validation.generationFailed', 'Failed to generate exercises. Please try again.');
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
      setError(t('generate.validation.downloadFailed', 'Failed to download PDF'));
    }
  };

  const handleViewPDF = async () => {
    if (!exercise) return;
    
    try {
      let blob: Blob;
      
      // Try base64 first (faster), fallback to URL download
      if (exercise.pdf_base64) {
        blob = exerciseService.base64ToBlob(exercise.pdf_base64);
      } else if (exercise.pdf_path) {
        blob = await exerciseService.downloadExercisePDF(exercise.pdf_path);
      } else {
        throw new Error('No PDF data available');
      }
      
      const url = URL.createObjectURL(blob);
      setPdfViewerUrl(url);
      setShowPDFViewerModal(true);
    } catch (err) {
      console.error('Failed to view PDF:', err);
      setError(t('generate.validation.viewFailed', 'Failed to view PDF'));
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
      <div className="container mt-3" style={{maxWidth: 600}}>
        {/* Enhanced Main Title */}
        <div className="text-center mb-4">
          <h2 className="fw-semibold mb-3" style={{ color: '#5a6c7d' }}>
            <i className="bi bi-calculator me-2"></i>
            {t('generate.generateMathExercises')}
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

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <div className="mb-3">
            <label className="form-label">{t('generate.level')}</label>
            <select className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('generate.exerciseTypes')}</label>
            <div className="d-flex flex-wrap gap-2">
              {mathTypes.map(type => (
                <Button
                  key={type.key}
                  variant={selectedTypes.includes(type.key) ? "primary" : "outline-primary"}
                  onClick={e => { e.preventDefault(); toggleType(type.key); }}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('generate.numberOfQuestions')}</label>
            <input
              type="number"
              className="form-control"
              min={1}
              max={50}
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!canGenerate} 
            className="w-100 mb-3"
          >
            {generating ? t('generate.generating') : t('generate.generatePDF')}
          </Button>
          
          {!canGenerate && selectedTypes.length === 0 && (
            <small className="text-muted d-block text-center">
              {t('generate.validation.selectTypes', 'Please select exercise types')}
            </small>
          )}
          
          {!canGenerate && !canGenerateMore() && (
            <small className="text-danger d-block text-center">
              Limite d'abonnement atteinte ce mois
            </small>
          )}
        </form>
        
        {exercise && exercise.success && (
          <div className="alert alert-success mt-3">
            <h5>{t('generate.sessionCreated', 'Exercise fiche created!')}</h5>
            <p>
              <strong>{t('sessions.subject')}:</strong> {t('generate.math')} <br />
              <strong>{t('sessions.level')}:</strong> {level} <br />
              <strong>{t('sessions.status')}:</strong> {t('sessions.statuses.completed', 'Completed')}
            </p>
            {(exercise.pdf_path || exercise.pdf_base64) && (
              <div className="d-grid gap-2">
                <Button onClick={handleDownload} variant="outline-primary">
                  📥 {t('sessions.downloadPDF')}
                </Button>
                <Button onClick={handleViewPDF} variant="outline-secondary">
                  👁️ {t('generate.viewAndPrint', 'Visualiser et imprimer')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* PDF Viewer Modal */}
        <Modal 
          show={showPDFViewerModal} 
          onHide={closePDFViewer} 
          size="xl" 
          centered
          className="pdf-viewer-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>📄 {t('generate.pdfViewer', 'Visualisation de la fiche PDF')}</Modal.Title>
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
              🖨️ {t('generate.print', 'Imprimer')}
            </Button>
            <Button variant="outline-secondary" onClick={closePDFViewer}>
              {t('common.close', 'Fermer')}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </ProtectedPage>
  );
}
