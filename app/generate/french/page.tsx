"use client";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import ProtectedPage from "../../../components/ProtectedPage";

const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
const frenchTypes = [
  { key: "reading", label: "Reading" },
  { key: "grammar", label: "Grammar" },
  { key: "conjugation", label: "Conjugation" },
  { key: "vocab", label: "Vocabulary" },
  { key: "dictation", label: "Dictation" },
];

export default function GenerateFrenchPage() {
  const [level, setLevel] = useState(levels[0]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const toggleType = (type: string) => {
    setSelectedTypes(selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    // Mock PDF generation
    setTimeout(() => {
      setPdfUrl("/mock-french-session.pdf");
      setGenerating(false);
    }, 1200);
  };

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 600}}>
        <h2 className="mb-4">Generate French Exercises</h2>
        <form onSubmit={handleGenerate}>
          <div className="mb-3">
            <label className="form-label">Level</label>
            <select className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Exercise Types</label>
            <div className="d-flex flex-wrap gap-2">
              {frenchTypes.map(type => (
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
            <label className="form-label">Number of Questions</label>
            <input
              type="number"
              className="form-control"
              min={1}
              max={50}
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
            />
          </div>
          <Button type="submit" disabled={generating} className="w-100 mb-3">
            {generating ? "Generating..." : "Generate PDF"}
          </Button>
        </form>
        {pdfUrl && (
          <div className="alert alert-success mt-3">
            PDF ready! <a href={pdfUrl} download>Download here</a>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
