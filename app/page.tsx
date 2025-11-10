"use client";
import '../i18n/i18n';
import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Container, Row, Col } from 'react-bootstrap';
import styles from "./page.module.css";

// Star particle interface
interface StarParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  duration: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<StarParticle[]>([]);
  const starIdCounter = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (buttonRef.current && isHovering) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePos({ x, y });
      
      // Create new star particles randomly (not on every move)
      if (Math.random() > 0.85) { // 15% chance on each move (reduced from 30%)
        createStarBurst(x, y);
      }
    }
  };

  const createStarBurst = (x: number, y: number) => {
    const emojis = ['🌟', '✨'];
    const numStars = 1; // Only 1 star per burst (reduced from 1-2)
    
    const newStars: StarParticle[] = [];
    for (let i = 0; i < numStars; i++) {
      const angle = Math.random() * Math.PI * 2; // Random direction (0-360 degrees)
      const speed = 40 + Math.random() * 60; // 40-100px travel distance (reduced)
      const duration = 0.4 + Math.random() * 0.2; // 0.4-0.6 seconds (~500ms average)
      
      newStars.push({
        id: starIdCounter.current++,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x,
        y,
        angle,
        speed,
        duration
      });
    }
    
    setStars(prev => [...prev, ...newStars]);
    
    // Remove stars after their animation completes
    newStars.forEach(star => {
      setTimeout(() => {
        setStars(prev => prev.filter(s => s.id !== star.id));
      }, star.duration * 1000);
    });
  };

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Container>
          <Row className="align-items-center" style={{ minHeight: '80vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                color: '#2c3e50', 
                marginBottom: '1.5rem',
                lineHeight: '1.2'
              }}>
                Votre fiche d'exercices prête en moins d'une minute
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6c757d', 
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Français et Mathématiques • CP à CM2 • Personnalisées, imprimables, sans écran.
              </p>
              <Link href="/generate">
                <div 
                  ref={buttonRef}
                  className={`${styles.ctaButtonWrapper} ${isHovering ? styles.hovering : ''}`}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    setStars([]); // Clear stars when leaving
                  }}
                  onMouseMove={handleMouseMove}
                >
                  {/* Render star particles that pop out */}
                  {stars.map((star) => {
                    const translateX = Math.cos(star.angle) * star.speed;
                    const translateY = Math.sin(star.angle) * star.speed;
                    
                    return (
                      <span 
                        key={star.id}
                        className={styles.starParticle} 
                        style={{ 
                          left: `${star.x}px`,
                          top: `${star.y}px`,
                          '--translate-x': `${translateX}px`,
                          '--translate-y': `${translateY}px`,
                          '--duration': `${star.duration}s`,
                          animation: `starBurst ${star.duration}s ease-out forwards`
                        } as React.CSSProperties}
                      >
                        {star.emoji}
                      </span>
                    );
                  })}
                  
                  <button className={styles.ctaButton}>
                    <i className="bi bi-pencil-square me-2"></i>
                    Générer mes exercices maintenant
                  </button>
                </div>
              </Link>
            </Col>
            <Col lg={6}>
              <div style={{ textAlign: 'center' }}>
                <Image
                  src="/working_girl2.png"
                  alt="Enfant qui étudie avec des fiches d'exercices ExoMinute"
                  width={500}
                  height={500}
                  style={{ maxWidth: '100%', height: 'auto' }}
                  priority
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Value Proposition Section */}
      <section style={{ backgroundColor: '#f8f9fa', padding: '5rem 0' }}>
        <Container>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#2c3e50', 
            marginBottom: '1rem' 
          }}>
            Pourquoi choisir ExoMinute ?
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '1.05rem',
            color: '#6c757d',
            marginBottom: '3.5rem',
            fontStyle: 'italic'
          }}>
            Fini de chercher dans des dizaines de cahiers d'exercices différents,<br />
            tout est là, disponible et toujours original en quelques clics
          </p>
          
          <Row className="g-5 justify-content-center">
            <Col md={4}>
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem 2rem',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.borderColor = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  marginBottom: '1.5rem' 
                }}>
                  <i className="bi bi-display-fill" style={{ color: '#10b981', fontSize: '2.5rem' }}></i>
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1rem' 
                }}>
                  Moins de temps d'écran
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#6c757d', 
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Des exercices sur papier pour favoriser la concentration et l'apprentissage de votre enfant, loin des écrans.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem 2rem',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  marginBottom: '1.5rem' 
                }}>
                  <i className="bi bi-stopwatch-fill" style={{ color: '#667eea', fontSize: '2.5rem' }}></i>
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1rem' 
                }}>
                  Personnalisé et prêt en 1 minute
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#6c757d', 
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Adapté au niveau exact et aux besoins spécifiques de votre enfant. Générez une fiche unique en moins d'une minute.
                </p>
              </div>
            </Col>
            
            <Col md={4}>
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem 2rem',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 158, 11, 0.15)';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  marginBottom: '1.5rem' 
                }}>
                  <i className="bi bi-patch-check-fill" style={{ color: '#f59e0b', fontSize: '2.5rem' }}></i>
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1rem' 
                }}>
                  Conforme au programme
                </h3>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#6c757d', 
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Tous nos exercices respectent scrupuleusement les programmes officiels de l'Éducation Nationale du CP au CM2.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#ffffff', 
        borderTop: '1px solid #e9ecef',
        padding: '3rem 0 2rem' 
      }}>
        <Container>
          <Row>
            <Col md={6} className="mb-4 mb-md-0">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '1rem' 
              }}>
                <Image
                  src="/ExoMinutesIncon.png"
                  alt="ExoMinute"
                  width={36}
                  height={36}
                  style={{ marginRight: '0.7rem' }}
                />
                <span style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  letterSpacing: '-0.5px'
                }}>
                  ExoMinute
                </span>
              </div>
              <p style={{ 
                color: '#6c757d', 
                fontSize: '0.9rem',
                lineHeight: '1.6',
                marginBottom: '0.5rem'
              }}>
                Des exercices personnalisés pour vos enfants, prêts en quelques clics.
              </p>
              <p style={{ 
                color: '#adb5bd', 
                fontSize: '0.85rem',
                margin: 0
              }}>
                © 2025 ExoMinute. Tous droits réservés.
              </p>
            </Col>
            
            <Col md={6} className="d-flex flex-column align-items-md-end">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'flex-end'
              }}>
                <Link 
                  href="/contact" 
                  style={{ 
                    color: '#6c757d', 
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s',
                    textAlign: 'right'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
                >
                  Contact
                </Link>
                <Link 
                  href="/about" 
                  style={{ 
                    color: '#6c757d', 
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s',
                    textAlign: 'right'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
                >
                  À propos
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
