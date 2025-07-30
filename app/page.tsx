"use client";
import '../i18n/i18n';
import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import styles from "./page.module.css";

export default function Home() {
  const { t } = useTranslation();
  const [selectedSubject, setSelectedSubject] = useState('français');
  const [selectedLevel, setSelectedLevel] = useState('CE1');
  const [selectedDuration, setSelectedDuration] = useState('30 min');

  const subjects = ['Français', 'Maths'];
  const levels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
  const durations = ['20 min', '30 min', '40 min'];

  const testimonials = [
    {
      text: "Fini les recherches, ma fille progresse enfin !",
      author: "Sophie, maman de Emma (CE2)"
    },
    {
      text: "Les exercices sont parfaitement adaptés au niveau de mon fils.",
      author: "Marc, papa de Lucas (CM1)"
    },
    {
      text: "Très pratique pour préparer mes séances rapidement.",
      author: "Claire, enseignante"
    }
  ];

  const exerciseExamples = [
    { title: "Lecture compréhension", tags: ["compréhension", "lecture"] },
    { title: "Conjugaison présent", tags: ["conjugaison", "grammaire"] },
    { title: "Vocabulaire animaux", tags: ["vocabulaire"] },
    { title: "Addition/Soustraction", tags: ["calcul", "nombres"] },
    { title: "Géométrie", tags: ["formes", "espace"] },
    { title: "Problèmes", tags: ["logique", "calcul"] }
  ];

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <h1 className={styles.heroTitle}>
                Créez vos fiches d'exercices personnalisées, prêtes à imprimer
              </h1>
              <p className={styles.heroSubtitle}>
                Français et Mathématiques • CP à CM2 • En 3 clics, sans écran
              </p>
              <Link href="/generate">
                <Button size="lg" className={styles.ctaPrimary}>
                  Générer ma fiche maintenant
                </Button>
              </Link>
            </Col>
            <Col lg={6}>
              <div className={styles.heroIllustration}>
                <Image
                  src="/working_girl2.png"
                  alt="Enfant qui étudie avec des fiches d'exercices ExoMinutes"
                  width={400}
                  height={400}
                  className={styles.heroImage}
                  priority
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Quick Selectors */}
      <section className={styles.selectors}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={12}>
              <h3 className="text-center mb-4">Configurez vos fiches en quelques clics</h3>
              <p className="text-center text-muted mb-5">
                Créez une fiche individuelle ou planifiez un parcours complet sur plusieurs semaines
              </p>
              
              <Row>
                {/* Left Column - Individual Worksheet Selectors */}
                <Col lg={6} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm d-flex flex-column">
                    <Card.Body className="p-4 d-flex flex-column flex-grow-1">
                      <div className="flex-grow-1">
                        <h5 className={`mb-4 text-center ${styles.sectionTitle}`}>
                          <i className="bi bi-file-earmark-text me-2 text-warning"></i>
                          Fiche individuelle
                        </h5>
                        
                        <div className="row g-3">
                          {/* Subject Selection */}
                          <div className="col-12">
                            <h6 className="mb-3">Matière</h6>
                            <div className="d-flex gap-2">
                              {subjects.map((subject) => (
                                <div key={subject} className="flex-fill">
                                  <Card 
                                    className={`${styles.selectorCard} border border-2 ${selectedSubject === subject.toLowerCase() ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow`}
                                    onClick={() => setSelectedSubject(subject.toLowerCase())}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
                                      <span className={`fw-bold ${selectedSubject === subject.toLowerCase() ? 'text-dark-emphasis' : 'text-dark'}`}>
                                        {subject}
                                      </span>
                                    </Card.Body>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Level Selection */}
                          <div className="col-12">
                            <h6 className="mb-3">Niveau</h6>
                            <div className="d-flex gap-2 flex-wrap">
                              {levels.map((level) => (
                                <Card 
                                  key={level}
                                  className={`${styles.selectorCard} border border-2 ${selectedLevel === level ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow flex-fill`}
                                  onClick={() => setSelectedLevel(level)}
                                  style={{ cursor: 'pointer', minWidth: '60px' }}
                                >
                                  <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
                                    <span className={`fw-bold ${selectedLevel === level ? 'text-dark-emphasis' : 'text-dark'}`}>
                                      {level}
                                    </span>
                                  </Card.Body>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Duration Selection */}
                          <div className="col-12">
                            <h6 className="mb-3">Durée</h6>
                            <div className="d-flex gap-2">
                              {durations.map((duration) => (
                                <div key={duration} className="flex-fill">
                                  <Card 
                                    className={`${styles.selectorCard} border border-2 ${selectedDuration === duration ? 'border-warning-subtle bg-warning-subtle' : 'border-secondary-subtle'} hover-shadow`}
                                    onClick={() => setSelectedDuration(duration)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <Card.Body className="p-3 text-center d-flex align-items-center justify-content-center">
                                      <span className={`fw-bold ${selectedDuration === duration ? 'text-dark-emphasis' : 'text-dark'}`}>
                                        {duration}
                                      </span>
                                    </Card.Body>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="text-center mt-4">
                        <Link href={`/generate/${selectedSubject}`}>
                          <Button size="lg" className={`w-100 ${styles.ctaButton}`}>
                            <i className="bi bi-lightning-fill me-2"></i>
                            Générer une fiche maintenant
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Column - Parcours Templates */}
                <Col lg={6} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm d-flex flex-column">
                    <Card.Body className="p-4 d-flex flex-column flex-grow-1">
                      <div className="flex-grow-1">
                        <h5 className={`mb-4 text-center ${styles.sectionTitle}`}>
                          <i className="bi bi-collection me-2 text-primary"></i>
                          Parcours personnalisés
                        </h5>
                        
                        <div className="row g-3">
                          {/* Parcours Template 1 */}
                          <div className="col-12">
                            <Link href="/generate/parcours?template=conjugaison-ce1" className="text-decoration-none">
                              <Card className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}>
                                <Card.Body className="p-3">
                                  <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 me-3">
                                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                        <i className="bi bi-book"></i>
                                      </div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1 text-dark">Conjugaison CE1 en 4 semaines</h6>
                                      <small className="text-muted">Présent, futur, passé composé</small>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="badge bg-primary-subtle text-primary">CE1</span>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Link>
                          </div>

                          {/* Parcours Template 2 */}
                          <div className="col-12">
                            <Link href="/generate/parcours?template=revision-cm2-francais" className="text-decoration-none">
                              <Card className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}>
                                <Card.Body className="p-3">
                                  <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 me-3">
                                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                        <i className="bi bi-mortarboard"></i>
                                      </div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1 text-dark">Révisions CM2 Français</h6>
                                      <small className="text-muted">Préparation au collège</small>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="badge bg-primary-subtle text-primary">CM2</span>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Link>
                          </div>

                          {/* Parcours Template 3 */}
                          <div className="col-12">
                            <Link href="/generate/parcours?template=lecture-comprehension-ce2" className="text-decoration-none">
                              <Card className={`${styles.parcoursTemplate} border border-2 border-primary-subtle hover-shadow`}>
                                <Card.Body className="p-3">
                                  <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 me-3">
                                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                        <i className="bi bi-journal-text"></i>
                                      </div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1 text-dark">Lecture & Compréhension CE2</h6>
                                      <small className="text-muted">Stratégies de lecture</small>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="badge bg-primary-subtle text-primary">CE2</span>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* See More Button */}
                      <div className="text-center mt-4">
                        <Link href="/generate/parcours">
                          <Button className={`w-100 ${styles.ctaButton}`}>
                            <i className="bi bi-plus-circle me-2"></i>
                            Voir tous les parcours
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Exercise Preview */}
      <section className={styles.preview}>
        <Container>
          <h3 className="text-center mb-5">Aperçu d'exercices</h3>
          <Row>
            {exerciseExamples.map((example, index) => (
              <Col md={6} lg={4} key={index} className="mb-4">
                <Card className={styles.exerciseCard}>
                  <Card.Body>
                    <Card.Title className="h6">{example.title}</Card.Title>
                    <div className="mb-3">
                      {example.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={`badge bg-light text-dark me-1 ${styles.tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={styles.exercisePreview}>
                      <div className={styles.exercisePlaceholder}></div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="text-center">
            <Button className={styles.ctaButton}>Voir un aperçu PDF</Button>
          </div>
        </Container>
      </section>

      {/* Key Features */}
      <section className={styles.features}>
        <Container>
          <h3 className="text-center mb-5">Pourquoi choisir ExoMinutes ?</h3>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className={styles.featureIcon}>
                <Image src="/pen-icon.svg" alt="Personnalisation" width={48} height={48} />
              </div>
              <h5>Personnalisation instantanée</h5>
              <p>Adaptez chaque exercice au niveau exact de votre enfant</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className={styles.featureIcon}>
                📁
              </div>
              <h5>Toutes vos fiches archivées</h5>
              <p>Retrouvez facilement tous vos exercices précédents</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className={styles.featureIcon}>
                🖨️
              </div>
              <h5>Prêtes à imprimer</h5>
              <p>Format PDF optimisé pour une impression parfaite</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <Container>
          <h3 className="text-center mb-5">Ce qu'en disent les parents</h3>
          <Row>
            {testimonials.map((testimonial, index) => (
              <Col md={4} key={index} className="mb-4">
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <div className={styles.avatar}></div>
                    <blockquote className="mb-3">
                      "{testimonial.text}"
                    </blockquote>
                    <cite className="text-muted">— {testimonial.author}</cite>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <Container>
          <h3 className="text-center mb-5">Questions fréquentes</h3>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="mb-4">
                <h5>Comment ça marche ?</h5>
                <p>Sélectionnez la matière, le niveau et la durée. Notre IA génère instantanément des exercices adaptés que vous pouvez imprimer.</p>
              </div>
              <div className="mb-4">
                <h5>Pourquoi c'est sans écran ?</h5>
                <p>Les enfants apprennent mieux avec le papier et le crayon. Nos fiches favorisent la concentration et l'écriture manuscrite.</p>
              </div>
              <div className="mb-4">
                <h5>Quel prix ?</h5>
                <p>Essai gratuit inclus ! Puis abonnement à partir de 9,99€/mois pour un accès illimité.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container>
          <Row>
            <Col md={6}>
              <div className="d-flex align-items-center mb-3">
                <Image
                  src="/pen-icon.svg"
                  alt="ExoMinutes"
                  width={24}
                  height={24}
                  className="me-2"
                />
                <span className={styles.footerLogo}>ExoMinutes</span>
              </div>
              <p className="text-muted">
                Générateur d'exercices personnalisés pour l'apprentissage sans écran
              </p>
            </Col>
            <Col md={6}>
              <div className="d-flex flex-column flex-md-row gap-3 justify-content-md-end">
                <Link href="/contact" className="text-decoration-none">Contact</Link>
                <Link href="#" className="text-decoration-none">CGU</Link>
                <Link href="#" className="text-decoration-none">Mentions légales</Link>
              </div>
              <div className="d-flex gap-3 justify-content-md-end mt-3">
                <span>📧</span>
                <span>📱</span>
                <span>🌐</span>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
