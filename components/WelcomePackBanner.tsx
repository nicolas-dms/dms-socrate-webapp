"use client";

import React from 'react';
import { Alert } from 'react-bootstrap';
import { WelcomePack } from '../types/subscription';

interface WelcomePackBannerProps {
  welcomePack: WelcomePack | null;
  monthlyRemaining: number;
  onGenerateClick?: () => void;
}

/**
 * WelcomePackBanner - Display welcome pack status
 * 
 * Shows:
 * - Available: Prompts user to generate first fiche
 * - Active: Shows countdown and bonus fiches
 * - Expired/Not applicable: Nothing
 */
export const WelcomePackBanner: React.FC<WelcomePackBannerProps> = ({
  welcomePack,
  monthlyRemaining,
  onGenerateClick
}) => {
  if (!welcomePack) return null;

  const formatTimeRemaining = (hours: number): string => {
    if (hours < 1) {
      return `${Math.floor(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} heures`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days}j ${remainingHours}h`;
    }
  };

  // Pack Available - Not yet activated
  if (welcomePack.available && !welcomePack.activated) {
    return (
      <Alert 
        variant="info" 
        className="d-flex align-items-center justify-content-between mb-3"
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          border: '1px solid #0ea5e9',
          borderRadius: '12px',
          padding: '1rem 1.5rem'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div style={{ fontSize: '2rem' }}>🎁</div>
          <div>
            <h6 className="mb-1" style={{ fontWeight: '600', color: '#0369a1' }}>
              Pack de Bienvenue Disponible!
            </h6>
            <p className="mb-0" style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
              Générez votre première fiche pour débloquer <strong>10 fiches bonus</strong>
            </p>
            <small style={{ fontSize: '0.8rem', color: '#075985' }}>
              Valable 48 heures après activation
            </small>
          </div>
        </div>
        {onGenerateClick && (
          <button
            onClick={onGenerateClick}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            Commencer
          </button>
        )}
      </Alert>
    );
  }

  // Pack Active - Within 48h
  if (welcomePack.active && welcomePack.hours_remaining !== undefined) {
    // Don't show banner if no fiches remaining or no time left
    if (welcomePack.quota_remaining <= 0 || welcomePack.hours_remaining <= 0) {
      return null;
    }
    
    const isExpiringSoon = welcomePack.hours_remaining < 6;
    const variant = isExpiringSoon ? 'warning' : 'success';
    const bgGradient = isExpiringSoon 
      ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
      : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
    const borderColor = isExpiringSoon ? '#f59e0b' : '#10b981';
    const textColor = isExpiringSoon ? '#92400e' : '#065f46';

    return (
      <div className="d-flex justify-content-center mb-3">
        <Alert 
          variant={variant}
          style={{
            background: bgGradient,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            width: '70%',
            margin: 0
          }}
        >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div style={{ fontSize: '2rem' }}>
              {isExpiringSoon ? '⏰' : '🎁'}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <h6 className="mb-0" style={{ fontWeight: '600', color: textColor }}>
                  Pack de Bienvenue
                </h6>
                <span 
                  className="badge"
                  style={{
                    background: borderColor,
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  {welcomePack.quota_remaining}/{welcomePack.quota_total} fiches
                </span>
              </div>
              <p className="mb-1" style={{ fontSize: '0.9rem', color: textColor }}>
                {isExpiringSoon && '⚠️ '}
                {formatTimeRemaining(welcomePack.hours_remaining)} restantes
              </p>
              {/* Progress bar */}
              <div 
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '0.5rem'
                }}
              >
                <div
                  style={{
                    width: `${(welcomePack.hours_remaining / 48) * 100}%`,
                    height: '100%',
                    background: borderColor,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              {isExpiringSoon && (
                <small style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem', display: 'block' }}>
                  Dépêchez-vous d'utiliser vos fiches bonus!
                </small>
              )}
            </div>
          </div>
        </div>
        </Alert>
      </div>
    );
  }

  // Pack expired or inactive - don't show anything
  return null;
};

export default WelcomePackBanner;
