import React from 'react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';

type EmptyStateType = 
  | 'no-recent-files'
  | 'no-filtered-results'
  | 'new-user'
  | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  onShowAll?: () => void;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onShowAll, onClearFilters }) => {
  const renderContent = () => {
    switch (type) {
      case 'no-recent-files':
        return (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h4 style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Aucune fiche trouvée
            </h4>
            <div className="d-flex gap-2 justify-content-center">
              {onShowAll && (
                <Button
                  variant="outline-primary"
                  onClick={onShowAll}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Afficher tout l'historique
                </Button>
              )}
              <Link href="/generate">
                <Button
                  variant="primary"
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Générer une nouvelle fiche
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'no-filtered-results':
        return (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h4 style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Aucune fiche trouvée
            </h4>
            <div className="d-flex gap-2 justify-content-center">
              {onClearFilters && (
                <Button
                  variant="outline-secondary"
                  onClick={onClearFilters}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Effacer les filtres
                </Button>
              )}
              {onShowAll && (
                <Button
                  variant="outline-primary"
                  onClick={onShowAll}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Voir toutes les fiches
                </Button>
              )}
            </div>
          </div>
        );

      case 'new-user':
        return (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h4 style={{ color: '#6c757d', marginBottom: '0.75rem' }}>
              Bienvenue sur SOCRATE !
            </h4>
            <p style={{ color: '#adb5bd', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Vous n'avez pas encore généré de fiche. Commencez dès maintenant à créer des exercices personnalisés pour vos élèves.
            </p>
            <div className="d-flex flex-column gap-2 align-items-center">
              <Link href="/generate">
                <Button
                  variant="primary"
                  size="lg"
                  style={{
                    borderRadius: '8px',
                    padding: '0.75rem 2rem',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-magic me-2"></i>
                  Créer ma première fiche
                </Button>
              </Link>
              <div className="mt-3 d-flex gap-3">
                <Link
                  href="/generate/french"
                  style={{
                    color: '#f59e0b',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                >
                  <i className="bi bi-book me-1"></i>
                  Exercices de français
                </Link>
                <Link
                  href="/generate/math"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                >
                  <i className="bi bi-calculator me-1"></i>
                  Exercices de maths
                </Link>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h4 style={{ color: '#dc3545', marginBottom: '0.75rem' }}>
              Erreur de chargement
            </h4>
            <p style={{ color: '#adb5bd', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Une erreur s'est produite lors du chargement de vos fiches. Veuillez réessayer.
            </p>
            <Button
              variant="outline-danger"
              onClick={() => window.location.reload()}
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: '500'
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Recharger la page
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '2px dashed #dee2e6',
        padding: '2rem',
        marginTop: '2rem'
      }}
    >
      {renderContent()}
    </div>
  );
};

export default EmptyState;
