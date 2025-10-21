'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, ProgressBar } from 'react-bootstrap';

interface GenerationLoadingModalProps {
  show: boolean;
  completed?: boolean; // New prop to indicate generation is complete
}

const GenerationLoadingModal: React.FC<GenerationLoadingModalProps> = ({ show, completed = false }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(0);

  const messages = [
    { text: 'Rédaction de vos exercices personnalisés...' },
    { text: 'Organisation des questions dans la fiche...' },
    { text: 'Ajout d\'une touche de magie pédagogique...' },
    { text: 'Préparation du fichier PDF...' }
  ];

  // Additional patience messages for longer generations
  const patienceMessages = [
    { threshold: 30, text: 'C\'est bientôt prêt...' },
    { threshold: 40, text: 'Encore quelques secondes de patience...' },
    { threshold: 55, text: 'La génération se termine...' }
  ];

  const getCurrentMessage = () => {
    // Check for patience messages based on elapsed time
    for (let i = patienceMessages.length - 1; i >= 0; i--) {
      if (elapsedTime >= patienceMessages[i].threshold) {
        return patienceMessages[i];
      }
    }
    // Return regular cycling message
    return messages[messageIndex];
  };

  useEffect(() => {
    if (!show) {
      setMessageIndex(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    // If completed, immediately set to 100%
    if (completed) {
      setProgress(100);
      return;
    }

    // Record start time
    startTimeRef.current = Date.now();

    // Timer to track elapsed time
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 100);

    // Cycle through messages every 5 seconds (slower)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 5000);

    // Progress bar animation - slower to match minimum 20s generation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) return 99; // Stop at 99% until actually done
        if (prev >= 90) {
          // After 90%, increment by 1% every 5 seconds
          // This interval runs every second, so increment by 0.2% each time
          return Math.min(prev + 0.2, 99);
        }
        // Random increment between 3-7% per second before 90%
        const increment = Math.random() * 4 + 3; // Random between 3 and 7
        return Math.min(prev + increment, 90);
      });
    }, 1000); // Update every second

    return () => {
      clearInterval(timerInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [show, completed]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} s`;
    }
    return `${secs} s`;
  };

  return (
    <Modal 
      show={show} 
      centered 
      backdrop="static" 
      keyboard={false}
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Body className="text-center p-5">
        {/* Animated pencil writing - neutral colors */}
        <div className="mb-4 position-relative" style={{ height: '120px' }}>
          <div 
            className="pencil-animation"
            style={{
              fontSize: '4rem',
              animation: 'writingAnimation 2s ease-in-out infinite'
            }}
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 8L56 14L22 48L16 50L18 44L50 8Z" fill="#6B7280" stroke="#374151" strokeWidth="2"/>
              <path d="M50 8L56 14L52 18L46 12L50 8Z" fill="#FCD34D"/>
              <rect x="16" y="46" width="6" height="4" fill="#1F2937"/>
              <path d="M18 44L22 48" stroke="#374151" strokeWidth="1.5"/>
            </svg>
          </div>
          <div 
            className="writing-line"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #6B7280, transparent)',
              animation: 'lineGrow 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Cycling messages */}
        <div className="mb-4" style={{ minHeight: '80px' }}>
          <h5 className="fw-bold text-primary mb-2" style={{ fontSize: '1.1rem' }}>
            {completed ? '✅ Fiche générée !' : getCurrentMessage().text}
          </h5>
          <small className="text-muted">
            {completed ? 'Préparation de votre fiche...' : 'Veuillez patienter, cela peut prendre jusqu\'à 1 minute'}
          </small>
          {elapsedTime > 0 && (
            <div className="mt-2">
              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                ⏱️ Temps écoulé : {formatTime(elapsedTime)}
              </small>
            </div>
          )}
        </div>

        {/* Progress bar - 2.5x larger (20px instead of 8px) */}
        <ProgressBar 
          now={progress} 
          variant="warning"
          style={{ height: '20px' }}
          className="mb-2"
          animated={!completed}
        />
        <small className="text-muted" style={{ fontSize: '0.8rem' }}>
          {completed ? '100' : Math.min(Math.round(progress), 99)}%
        </small>

        <style jsx>{`
          @keyframes writingAnimation {
            0%, 100% {
              transform: translate(0, 0) rotate(-5deg);
            }
            25% {
              transform: translate(10px, -5px) rotate(-15deg);
            }
            50% {
              transform: translate(20px, 0px) rotate(-5deg);
            }
            75% {
              transform: translate(10px, 5px) rotate(5deg);
            }
          }

          @keyframes lineGrow {
            0% {
              width: 0%;
              opacity: 0.3;
            }
            50% {
              width: 80%;
              opacity: 1;
            }
            100% {
              width: 0%;
              opacity: 0.3;
            }
          }

          .pencil-animation {
            display: inline-block;
          }
        `}</style>
      </Modal.Body>
    </Modal>
  );
};

export default GenerationLoadingModal;
