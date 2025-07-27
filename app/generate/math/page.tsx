"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import ProtectedPage from "../../../components/ProtectedPage";
import { exerciseService, ExerciseRequest, ExerciseSession } from "../../../services/exerciseService";
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
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      // Prepare the exercise request
      const request: ExerciseRequest = {
        theme: 'Exercices mathématiques',
        class_level: level,
        exercice_domain: 'mathematiques' as any, // TODO: Fix this with proper enum
        exercice_time: '30 min' as any, // TODO: Fix this with proper enum
        exercice_types: selectedTypes as any[], // TODO: Fix this with proper enum
        exercice_type_params: {} // TODO: Add proper params
      };

      // Generate the exercises
      const newSession = await exerciseService.generateExercises(request);
      
      // Use a fiche from subscription allowance
      await useCredit();
      
      setSession(newSession);
    } catch (err) {
      console.error('Failed to generate exercises:', err);
      setError(t('generate.validation.generationFailed', 'Failed to generate exercises. Please try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!session?.id) return;
    
    try {
      const blob = await exerciseService.downloadSessionPDF(session.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `math-exercises-${session.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError(t('generate.validation.downloadFailed', 'Failed to download PDF'));
    }
  };

  const canGenerate = selectedTypes.length > 0 && !generating && canGenerateMore();

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 600}}>
        <h2 className="mb-4">{t('generate.generateMathExercises')}</h2>
        
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
        
        {session && (
          <div className="alert alert-success mt-3">
            <h5>{t('generate.sessionCreated', 'Exercise session created!')}</h5>
            <p>
              <strong>{t('sessions.subject')}:</strong> {t('generate.math')} <br />
              <strong>{t('sessions.level')}:</strong> {session.level} <br />
              <strong>{t('sessions.status')}:</strong> {t(`sessions.statuses.${session.status}`, session.status)}
            </p>
            {session.status === 'completed' && session.pdf_url && (
              <Button onClick={handleDownload} variant="outline-primary">
                {t('sessions.downloadPDF')}
              </Button>
            )}
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
