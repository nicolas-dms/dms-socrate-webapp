"use client";
import { useState } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import WordListManagementModal from "./WordListManagementModal";
import { useAuth } from "../context/AuthContext";
import { deleteWordList } from "../services/wordListService";

const MAX_WORD_LISTS = 10;

interface WordListSelectorProps {
  selectedListName?: string;
  onSelectList: (listName: string, words: string[]) => void;
  disabled?: boolean;
  label?: string;
  showCreateButton?: boolean;
  compact?: boolean; // If true, displays as dropdown instead of list
}

export default function WordListSelector({
  selectedListName,
  onSelectList,
  disabled = false,
  label = "Mes listes de mots personnalisées",
  showCreateButton = true,
  compact = false,
}: WordListSelectorProps) {
  const { wordLists, user, updateWordLists } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Word lists come from AuthContext now - no API calls needed!

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const listName = e.target.value;
    if (listName && wordLists[listName]) {
      onSelectList(listName, wordLists[listName]);
    }
  };

  const handleCreateList = () => {
    setShowCreateModal(true);
  };

  const handleSaveNewList = (listName: string, words: string[]) => {
    // Word lists are automatically updated in AuthContext by WordListManagementModal
    // Just auto-select the newly created list
    onSelectList(listName, words);
  };

  const handleDeleteClick = (listName: string) => {
    setListToDelete(listName);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!listToDelete || !user?.user_id) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const updatedLists = await deleteWordList(String(user.user_id), listToDelete);
      updateWordLists(updatedLists);

      // If the deleted list was selected, clear the selection
      if (selectedListName === listToDelete) {
        onSelectList("", []);
      }

      // Close modal and reset state
      setShowDeleteModal(false);
      setListToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression de la liste");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setListToDelete(null);
    setDeleteError(null);
  };

  const listNames = Object.keys(wordLists).sort();
  const hasReachedLimit = listNames.length >= MAX_WORD_LISTS;

  if (!user) {
    return null; // Don't render if no user
  }

  return (
    <div>
      <Form.Group className="mb-0">
        <Form.Label
          className="fw-semibold mb-2 d-flex align-items-center justify-content-between"
          style={{ color: "#374151", fontSize: "0.9rem" }}
        >
          <span>
            {label}
          </span>
          {showCreateButton && !disabled && (
            <Button
              variant="link"
              size="sm"
              onClick={handleCreateList}
              disabled={hasReachedLimit}
              className="p-0 text-decoration-none"
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: hasReachedLimit ? "#9ca3af" : "#f59e0b",
                cursor: hasReachedLimit ? "not-allowed" : "pointer",
              }}
              title={hasReachedLimit ? `Limite de ${MAX_WORD_LISTS} listes atteinte` : ""}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Créer une liste {listNames.length > 0 && `(${listNames.length}/${MAX_WORD_LISTS})`}
            </Button>
          )}
        </Form.Label>

        {compact ? (
          // Compact mode: dropdown with optional delete button
          <div className="d-flex gap-2 align-items-center">
            <Form.Select
              value={selectedListName || ""}
              onChange={handleSelectChange}
              disabled={disabled || listNames.length === 0}
              style={{
                borderRadius: "8px",
                borderColor: disabled ? "#e5e7eb" : "#fcd34d",
                backgroundColor: disabled ? "#f3f4f6" : "white",
                fontSize: "0.9rem",
                flex: 1,
              }}
            >
              <option value="">
                {listNames.length === 0
                  ? "Aucune liste disponible"
                  : "Sélectionner une liste..."}
              </option>
              {listNames.map((listName) => (
                <option key={listName} value={listName}>
                  {listName} ({wordLists[listName].length} mots)
                </option>
              ))}
            </Form.Select>
            {selectedListName && !disabled && (
              <Button
                variant="link"
                size="sm"
                onClick={() => handleDeleteClick(selectedListName)}
                className="p-0 text-decoration-none"
                style={{
                  color: "#dc3545",
                  fontSize: "1.1rem",
                  minWidth: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Supprimer cette liste"
              >
                <i className="bi bi-trash"></i>
              </Button>
            )}
          </div>
        ) : listNames.length === 0 ? (
          // Full mode: empty state
          <div
            className="p-3 text-center"
            style={{
              borderRadius: "8px",
              border: "2px dashed #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <i className="bi bi-folder2-open" style={{ fontSize: "2rem", color: "#d1d5db" }}></i>
            <p className="mb-0 mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              Aucune liste disponible
            </p>
          </div>
        ) : (
          // Full mode: list with delete buttons
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {listNames.map((listName, index) => (
              <div
                key={listName}
                className="d-flex align-items-center justify-content-between p-2 px-3"
                style={{
                  borderBottom: index < listNames.length - 1 ? "1px solid #f3f4f6" : "none",
                  backgroundColor: selectedListName === listName ? "#fffbeb" : "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onClick={() => !disabled && onSelectList(listName, wordLists[listName])}
                onMouseEnter={(e) => {
                  if (!disabled && selectedListName !== listName) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedListName !== listName) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  {selectedListName === listName ? (
                    <i className="bi bi-check-circle-fill" style={{ color: "#fbbf24" }}></i>
                  ) : (
                    <i className="bi bi-circle" style={{ color: "#d1d5db" }}></i>
                  )}
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: "500", color: "#374151" }}>
                      {listName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {wordLists[listName].length} mot{wordLists[listName].length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(listName);
                  }}
                  disabled={disabled}
                  className="p-1 text-decoration-none"
                  style={{
                    color: "#dc3545",
                    fontSize: "0.9rem",
                  }}
                  title="Supprimer cette liste"
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </div>
            ))}
          </div>
        )}

        {!disabled && listNames.length === 0 && (
          <Form.Text className="text-muted" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-info-circle me-1"></i>
            Créez votre première liste de mots pour la réutiliser facilement
          </Form.Text>
        )}

        {!disabled && hasReachedLimit && (
          <Form.Text className="text-warning" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-exclamation-triangle me-1"></i>
            Limite de {MAX_WORD_LISTS} listes atteinte. Supprimez une liste pour en créer une nouvelle.
          </Form.Text>
        )}

        {disabled && selectedListName && (
          <Form.Text className="text-muted" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-lock me-1"></i>
            Liste définie par l'exercice d'orthographe
          </Form.Text>
        )}

        {!disabled && selectedListName && wordLists[selectedListName] && (
          <div
            className="mt-2 p-2"
            style={{
              backgroundColor: "#fffbeb",
              borderRadius: "6px",
              border: "1px solid #fbbf24",
            }}
          >
            <small style={{ color: "#d97706", fontWeight: "500" }}>
              <i className="bi bi-check-circle-fill me-1"></i>
              Liste chargée: <strong>{selectedListName}</strong> ({wordLists[selectedListName].length} mots)
            </small>
          </div>
        )}
      </Form.Group>

      {/* Create Word List Modal */}
      <WordListManagementModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSave={handleSaveNewList}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontSize: "1.1rem", fontWeight: "600", color: "#2c3e50" }}>
            <i className="bi bi-exclamation-triangle me-2" style={{ color: "#dc3545" }}></i>
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "1.5rem" }}>
          {deleteError && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {deleteError}
            </div>
          )}

          <p style={{ color: "#374151", marginBottom: "1rem" }}>
            Êtes-vous sûr de vouloir supprimer cette liste de mots ?
          </p>

          {listToDelete && wordLists[listToDelete] && (
            <div
              className="p-3"
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
              }}
            >
              <div style={{ fontWeight: "600", color: "#991b1b", marginBottom: "0.5rem" }}>
                <i className="bi bi-folder2 me-2"></i>
                {listToDelete}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#7f1d1d" }}>
                {wordLists[listToDelete].length} mot{wordLists[listToDelete].length > 1 ? "s" : ""}: {wordLists[listToDelete].slice(0, 5).join(", ")}
                {wordLists[listToDelete].length > 5 && "..."}
              </div>
            </div>
          )}

          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "1rem", marginBottom: "0" }}>
            <i className="bi bi-info-circle me-1"></i>
            Cette action est irréversible.
          </p>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
          <Button
            variant="outline-secondary"
            onClick={handleCancelDelete}
            disabled={isDeleting}
            style={{
              borderRadius: "8px",
              fontWeight: "500",
            }}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              borderRadius: "8px",
              fontWeight: "600",
              padding: "0.5rem 1.5rem",
            }}
          >
            {isDeleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Suppression...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Supprimer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
