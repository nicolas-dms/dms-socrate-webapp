"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import ProtectedPage from "../../../components/ProtectedPage";
import styles from "../../page.module.css";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const durations = ["20 min", "30 min", "40 min"];

export default function GenerateFrenchPage() {
  const { t } = useTranslation();
  const [level, setLevel] = useState("CP"); // Default to CP
  const [duration, setDuration] = useState("30 min"); // Default to 30 min
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["lecture", "grammaire", "conjugaison"]); // Default selections
  const [readingTheme, setReadingTheme] = useState(""); // Reading theme field
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const frenchTypes = [
    { key: "lecture", label: "Lecture" },
    { key: "grammaire", label: "Grammaire" },
    { key: "conjugaison", label: "Conjugaison" },
    { key: "vocabulaire", label: "Vocabulaire" },
    { key: "orthographe", label: "Orthographe" },
  ];
  const toggleType = (type: string) => {
    setSelectedTypes(selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTypes.length === 0) {
      alert("Veuillez sélectionner au moins un type d'exercice");
      return;
    }
    
    setGenerating(true);
    // Mock PDF generation
    setTimeout(() => {
      setPdfUrl("/mock-french-session.pdf");
      setGenerating(false);
    }, 1200);
  };  return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row className="justify-content-center">
          <Col lg={10}>
            <h3 className="text-center mb-3">Exercices de Français</h3>
              <Card className="shadow-sm border-0">
              <Card.Body className="p-3">
                <form onSubmit={handleGenerate}>
                  {/* Level Selection */}
                  <div className="mb-3">
                    <h5 className="mb-2">Niveau</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      {levels.map((lvl) => (
                        <Button
                          key={lvl}
                          variant={level === lvl ? "warning" : "outline-secondary"}
                          className={styles.selectorBtn}
                          onClick={() => setLevel(lvl)}
                          type="button"
                        >
                          {lvl}
                        </Button>
                      ))}
                    </div>
                  </div>                  {/* Duration Selection */}
                  <div className="mb-3">
                    <h5 className="mb-2">Durée de la séance</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      {durations.map((dur) => (
                        <Button
                          key={dur}
                          variant={duration === dur ? "warning" : "outline-secondary"}
                          className={styles.selectorBtn}
                          onClick={() => setDuration(dur)}
                          type="button"
                        >
                          {dur}
                        </Button>
                      ))}
                    </div>
                  </div>                  {/* Exercise Types Selection */}
                  <div className="mb-3">
                    <h5 className="mb-2">Types d'exercices</h5>
                    <div className="d-flex gap-2 flex-wrap">
                      {frenchTypes.map(type => (
                        <Button
                          key={type.key}
                          variant={selectedTypes.includes(type.key) ? "warning" : "outline-secondary"}
                          className={styles.selectorBtn}
                          onClick={() => toggleType(type.key)}
                          type="button"
                        >
                          {type.label}
                        </Button>
                      ))}                    </div>
                    <small className="text-muted">Sélectionnez un ou plusieurs types d'exercices</small>
                  </div>                  {/* Reading Theme Section */}
                  <div className="mb-3">
                    <h5 className="mb-2">Thème de Lecture</h5>
                    <div className="position-relative">
                      <textarea
                        className="form-control"
                        placeholder="Décrivez le thème ou le sujet que vous souhaitez pour les exercices de lecture (optionnel)..."
                        value={readingTheme}
                        onChange={(e) => setReadingTheme(e.target.value)}
                        rows={2}
                        style={{ resize: 'vertical', minHeight: '80px' }}
                      />
                      {readingTheme && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="position-absolute top-0 end-0 mt-2 me-2"
                          onClick={() => setReadingTheme("")}
                          type="button"
                          title="Effacer le texte"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    <small className="text-muted">
                      Exemple : "Les animaux de la forêt", "Les saisons", "Une aventure à la plage"...
                    </small>
                  </div>                  {/* Generate Button */}
                  <div className="d-grid gap-2 mt-3">
                    <Button 
                      type="submit" 
                      disabled={generating || selectedTypes.length === 0}
                      className={styles.ctaPrimary}
                      size="lg"
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Génération en cours...
                        </>
                      ) : (
                        `Générer la fiche (${level} - ${duration})`
                      )}
                    </Button>
                  </div>
                </form>

                {/* PDF Download */}
                {pdfUrl && (
                  <div className="alert alert-success mt-4">
                    <h5 className="alert-heading">🎉 Votre fiche est prête !</h5>
                    <p className="mb-2">
                      Fiche de français - Niveau {level} - Durée {duration}
                    </p>                    <p className="mb-3">
                      Types d'exercices : {selectedTypes.join(", ")}
                    </p>
                    {readingTheme && (
                      <p className="mb-3">
                        <strong>Thème de lecture :</strong> {readingTheme}
                      </p>
                    )}<a 
                      href={pdfUrl} 
                      download 
                      className="btn btn-success"
                    >
                      📥 Télécharger la fiche PDF
                    </a>
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
