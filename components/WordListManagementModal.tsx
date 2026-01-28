"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { createOrUpdateWordList, getAllWordLists } from "../services/wordListService";
import { useAuth } from "../context/AuthContext";

const MAX_WORD_LISTS = 10;

interface WordListManagementModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (listName: string, words: string[]) => void;
  initialListName?: string;
  initialWords?: string[];
}

export default function WordListManagementModal({
  show,
  onHide,
  onSave,
  initialListName = "",
  initialWords = [],
}: WordListManagementModalProps) {
  const { user, updateWordLists } = useAuth();
  const [listName, setListName] = useState(initialListName);
  const [wordsInput, setWordsInput] = useState(initialWords.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Only reset when modal opens (show changes from false to true)
  useEffect(() => {
    if (show) {
      setListName(initialListName);
      setWordsInput(initialWords.join(", "));
      setError(null);
    }
    // Only depend on 'show' - reset only when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const getWordCount = (): number => {
    if (!wordsInput.trim()) return 0;
    return wordsInput
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0).length;
  };

  const validateForm = (): string | null => {
    if (!listName.trim()) {
      return "Le nom de la liste est obligatoire";
    }

    if (listName.length > 100) {
      return "Le nom de la liste ne peut pas dépasser 100 caractères";
    }

    if (!wordsInput.trim()) {
      return "Veuillez saisir au moins un mot";
    }

    const wordCount = getWordCount();
    if (wordCount > 50) {
      return `Trop de mots (${wordCount}/50). Veuillez réduire la liste.`;
    }

    const words = wordsInput
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0);

    const tooLongWords = words.filter(w => w.length > 100);
    if (tooLongWords.length > 0) {
      return `Certains mots sont trop longs (max 100 caractères): ${tooLongWords[0].substring(0, 20)}...`;
    }

    return null;
  };

  const handleSave = async () => {
    if (!user?.user_id) {
      setError("Utilisateur non authentifié");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Check max lists only when creating a new list (at save time)
      if (!initialListName) {
        const existingLists = await getAllWordLists(String(user.user_id));
        const existingListCount = Object.keys(existingLists).length;
        
        if (existingListCount >= MAX_WORD_LISTS) {
          setError(`Vous avez atteint la limite de ${MAX_WORD_LISTS} listes. Veuillez supprimer une liste existante pour en créer une nouvelle.`);
          setSaving(false);
          return;
        }
      }

      const words = wordsInput
        .split(",")
        .map(w => w.trim())
        .filter(w => w.length > 0);

      const updatedLists = await createOrUpdateWordList(String(user.user_id), listName.trim(), words);
      
      // Update global word lists in AuthContext
      updateWordLists(updatedLists);

      // Call onSave callback with the list name and words
      onSave(listName.trim(), words);

      // Close modal
      onHide();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement de la liste");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setListName("");
    setWordsInput("");
    setError(null);
    onHide();
  };

  const wordCount = getWordCount();
  const isWordCountValid = wordCount > 0 && wordCount <= 50;

  return (
    <Modal show={show} onHide={handleCancel} centered size="lg">
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontSize: "1.1rem", fontWeight: "600", color: "#2c3e50" }}>
          <i className="bi bi-folder-plus me-2" style={{ color: "#fbbf24" }}></i>
          {initialListName ? "Modifier la liste de mots" : "Créer une nouvelle liste de mots"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: "1.5rem" }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <Form>
          {/* List Name */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
              <i className="bi bi-tag me-2" style={{ color: "#fbbf24" }}></i>
              Nom de la liste
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Mes mots difficiles, Animaux de la ferme..."
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              maxLength={100}
              disabled={saving}
              style={{
                borderRadius: "8px",
                borderColor: !listName.trim() && error ? "#dc3545" : "#e5e7eb",
              }}
            />
            <Form.Text className="text-muted" style={{ fontSize: "0.8rem" }}>
              {listName.length}/100 caractères
            </Form.Text>
          </Form.Group>

          {/* Words Input */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
              <i className="bi bi-pencil-fill me-2" style={{ color: "#fbbf24" }}></i>
              Mots (séparés par des virgules)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="château, bâteau, forêt, être, avoir, mangé, mangée..."
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
              disabled={saving}
              style={{
                borderRadius: "8px",
                borderColor: !wordsInput.trim() && error ? "#dc3545" : "#e5e7eb",
                fontFamily: "monospace",
                fontSize: "0.9rem",
              }}
            />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <Form.Text className="text-muted" style={{ fontSize: "0.8rem" }}>
                <i className="bi bi-info-circle me-1"></i>
                Saisissez les mots séparés par des virgules
              </Form.Text>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: isWordCountValid ? "#10b981" : wordCount > 50 ? "#dc3545" : "#6b7280",
                }}
              >
                <i className="bi bi-list-check me-1"></i>
                {wordCount}/50 mots
              </div>
            </div>
          </Form.Group>

          {/* Info Box */}
          <div
            className="p-3"
            style={{
              backgroundColor: "#fffbeb",
              borderRadius: "8px",
              border: "1px solid #fcd34d",
            }}
          >
            <small style={{ color: "#92400e" }}>
              <i className="bi bi-lightbulb-fill me-2" style={{ color: "#fbbf24" }}></i>
              <strong>Conseil:</strong> Les listes de mots peuvent être utilisées pour les exercices
              de dictée personnalisée et pour thématiser vos fiches.
            </small>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
        <Button
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={saving}
          style={{
            borderRadius: "8px",
            fontWeight: "500",
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !listName.trim() || !wordsInput.trim() || wordCount > 50}
          style={{
            background:
              !saving && listName.trim() && wordsInput.trim() && isWordCountValid
                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                : undefined,
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            color: "white",
            padding: "0.5rem 1.5rem",
            boxShadow:
              !saving && listName.trim() && wordsInput.trim() && isWordCountValid
                ? "0 4px 15px rgba(251, 191, 36, 0.3)"
                : undefined,
          }}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Enregistrement...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Enregistrer
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
