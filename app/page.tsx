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
            <Col lg={10}>
              <h3 className="text-center mb-4">Configurez votre fiche en quelques clics</h3>
              
              {/* Subject Selection */}
              <div className="mb-4">
                <h5 className="mb-3">Matière</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {subjects.map((subject) => (
                    <Button
                      key={subject}
                      variant={selectedSubject === subject.toLowerCase() ? "warning" : "outline-secondary"}
                      className={styles.selectorBtn}
                      onClick={() => setSelectedSubject(subject.toLowerCase())}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              <div className="mb-4">
                <h5 className="mb-3">Niveau</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {levels.map((level) => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? "warning" : "outline-secondary"}
                      className={styles.selectorBtn}
                      onClick={() => setSelectedLevel(level)}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="mb-4">
                <h5 className="mb-3">Durée</h5>
                <div className="d-flex gap-2 flex-wrap">
                  {durations.map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? "warning" : "outline-secondary"}
                      className={styles.selectorBtn}
                      onClick={() => setSelectedDuration(duration)}
                    >
                      {duration}
                    </Button>
                  ))}
                </div>
              </div>
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
            <Button variant="outline-primary">Voir un aperçu PDF</Button>
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
