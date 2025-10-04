"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Alert, Button, Badge, Spinner, Modal } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { filesService, GeneratedFile } from "../../services/filesService";
import api from "../../services/api";

export default function SessionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<GeneratedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  
  // Tags editing state
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [savingTags, setSavingTags] = useState(false);
  
  // Filter states
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>(''); // Keep for backwards compatibility
  
  // Enhanced tag filtering states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);

  // Récupérer les fichiers PDF de l'utilisateur
  const fetchUserFiles = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Utiliser le service dédié
      const data = await filesService.getUserFiles(user.user_id);
      setFiles(data);
      setFilteredFiles(data); // Initialize filtered files
    } catch (err: any) {
      console.error('Erreur lors de la récupération des fichiers:', err);
      
      // Gestion d'erreur plus précise
      if (err.response?.status === 404) {
        setError('Aucune fiche trouvée pour cet utilisateur');
      } else if (err.response?.status === 403) {
        setError('Accès non autorisé');
      } else {
        setError(err.response?.data?.message || err.message || 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [user?.user_id]);

  // Close tag suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.position-relative')) {
        setShowTagSuggestions(false);
      }
    };

    if (showTagSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTagSuggestions]);

  // Filter files based on selected criteria
  useEffect(() => {
    let filtered = [...files];
    
    if (selectedDomain) {
      filtered = filtered.filter(file => file.exercice_domain === selectedDomain);
    }
    
    if (selectedLevel) {
      filtered = filtered.filter(file => file.class_level.toLowerCase() === selectedLevel.toLowerCase());
    }
    
    if (selectedTimeRange) {
      const now = new Date();
      const fileDate = (file: GeneratedFile) => new Date(file.created_at);
      
      switch (selectedTimeRange) {
        case 'today':
          filtered = filtered.filter(file => {
            const fDate = fileDate(file);
            return fDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(file => fileDate(file) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(file => fileDate(file) >= monthAgo);
          break;
        case '3months':
          const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(file => fileDate(file) >= threeMonthsAgo);
          break;
      }
    }
    
    if (selectedTag) {
      filtered = filtered.filter(file => 
        file.tags && file.tags.some(tag => 
          tag.toLowerCase().includes(selectedTag.toLowerCase())
        )
      );
    }

    // Enhanced tag filtering with multiple tags (AND logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(file => {
        if (!file.tags || file.tags.length === 0) return false;
        
        // All selected tags must be present in the file's tags (AND logic)
        return selectedTags.every(selectedTag => 
          file.tags!.some(fileTag => 
            fileTag.toLowerCase().includes(selectedTag.toLowerCase())
          )
        );
      });
    }
    
    // Sort files by newest first (always)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Always newest first
    });
    
    setFilteredFiles(filtered);
  }, [files, selectedDomain, selectedLevel, selectedTimeRange, selectedTag, selectedTags]);

  // Get unique domains and levels for filter options
  const getUniqueDomains = (): string[] => {
    const domains = files.map(file => file.exercice_domain);
    return [...new Set(domains)].sort();
  };

  const getUniqueLevels = (): string[] => {
    const levels = files.map(file => file.class_level);
    return [...new Set(levels)].sort();
  };

  const getUniqueTags = (): string[] => {
    const tags = files.flatMap(file => file.tags || []);
    return [...new Set(tags)].sort();
  };

  // Get filtered tag suggestions based on input
  const getTagSuggestions = (): string[] => {
    if (!tagInput.trim()) return [];
    
    const allTags = getUniqueTags();
    const filteredTags = allTags.filter(tag => 
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
    
    return filteredTags.slice(0, 5); // Limit to 5 suggestions
  };

  // Add a tag to the selected tags
  const addTagToFilter = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Remove a specific tag from the filter
  const removeTagFromFilter = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Clear all selected tags
  const clearAllTagFilters = () => {
    setSelectedTags([]);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedDomain('');
    setSelectedLevel('');
    setSelectedTimeRange('');
    setSelectedTag('');
    clearAllTagFilters();
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    return filesService.formatDate(dateString);
  };

  // Obtenir l'icône pour le type d'exercice
  const getExerciseIcon = (type: string): string => {
    return filesService.getExerciseIcon(type);
  };

  // Télécharger un fichier PDF
  const downloadFile = async (file: GeneratedFile) => {
    if (!user?.user_id) {
      setError('Utilisateur non connecté');
      return;
    }
    
    try {
      setError(null); // Clear previous errors
      console.log('Attempting to download file:', { 
        filename: file.filename, 
        fileId: file.file_id, 
        userId: user.user_id 
      });
      
      await filesService.downloadFile(file, user.user_id);
      
      console.log('Download completed successfully');
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      
      // More detailed error messages
      let errorMessage = 'Erreur lors du téléchargement du fichier';
      
      if (error.response) {
        // API error
        errorMessage = `Erreur serveur (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      } else if (error.message) {
        // Network or other error
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  // Visualiser un fichier PDF dans une modal
  const viewFile = async (file: GeneratedFile) => {
    if (!user?.user_id) {
      setError('Utilisateur non connecté');
      return;
    }
    
    try {
      setError(null);
      console.log('Attempting to view file:', { 
        filename: file.filename, 
        userId: user.user_id 
      });
      
      // Get PDF blob from backend
      const encodedUserId = encodeURIComponent(user.user_id);
      const encodedFilename = encodeURIComponent(file.filename);
      const downloadUrl = `/api/education/exercises/files/${encodedUserId}/${encodedFilename}/download`;
      
      console.log('📡 Getting PDF blob from backend:', downloadUrl);
      
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });
      
      console.log('✅ PDF blob received:', { 
        size: response.data.size, 
        type: response.data.type || 'application/pdf' 
      });
      
      // Create blob URL for viewing
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      setPdfViewerUrl(url);
      setShowPDFViewerModal(true);
      
      console.log('✅ PDF ready for viewing');
    } catch (error: any) {
      console.error('❌ View failed:', error);
      let errorMessage = 'Erreur lors de la visualisation du fichier';
      
      if (error.response) {
        errorMessage = `Erreur serveur (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  // Imprimer le PDF visualisé
  const handlePrintPDF = () => {
    if (pdfViewerUrl) {
      const printWindow = window.open(pdfViewerUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Fermer le visualiseur PDF
  const closePDFViewer = () => {
    setShowPDFViewerModal(false);
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl);
      setPdfViewerUrl(null);
    }
  };

  // Afficher les détails d'un fichier
  const showFileDetails = (file: GeneratedFile) => {
    setSelectedFile(file);
    setShowPreviewModal(true);
  };

  // Manage tags for a file
  const openTagsModal = (file: GeneratedFile) => {
    setSelectedFile(file);
    setEditingTags([...(file.tags || [])]);
    setNewTag('');
    setShowTagsModal(true);
  };

  const addTag = () => {
    const tagToAdd = newTag.trim().toLowerCase();
    console.log('🏷️ Adding tag:', {
      originalTag: newTag,
      trimmed: newTag.trim(),
      lowercased: tagToAdd,
      length: tagToAdd.length,
      alreadyExists: editingTags.includes(tagToAdd),
      currentTags: editingTags
    });
    
    if (tagToAdd && tagToAdd.length <= 30 && !editingTags.includes(tagToAdd)) {
      const updatedTags = [...editingTags, tagToAdd];
      setEditingTags(updatedTags);
      setNewTag('');
      console.log('✅ Tag added successfully. New tags array:', updatedTags);
    } else {
      console.log('❌ Tag not added - validation failed');
    }
  };

  const removeTag = (tagToRemove: string) => {
    console.log('🗑️ Removing tag:', {
      tagToRemove: tagToRemove,
      currentTags: editingTags,
      indexFound: editingTags.indexOf(tagToRemove)
    });
    
    const updatedTags = editingTags.filter(tag => tag !== tagToRemove);
    setEditingTags(updatedTags);
    console.log('✅ Tag removed successfully. New tags array:', updatedTags);
  };

  const saveTags = async () => {
    if (!selectedFile || !user?.user_id) return;

    setSavingTags(true);
    try {
      console.log('📤 Saving tags:', {
        userId: user.user_id,
        fileId: selectedFile.file_id,
        tags: editingTags,
        tagsLength: editingTags.length
      });
      
      await filesService.updateTags(user.user_id, selectedFile.file_id, editingTags);
      
      console.log('✅ Tags saved successfully');
      
      // Update the file in our local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.file_id === selectedFile.file_id 
            ? { ...file, tags: editingTags }
            : file
        )
      );
      
      setShowTagsModal(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('❌ Failed to save tags:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Erreur lors de la sauvegarde des tags');
    } finally {
      setSavingTags(false);
    }
  };

  return (
    <ProtectedPage>
      <Container className="mt-3">
        <Row className="justify-content-center">
          <Col lg={10}>
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                <i className="bi bi-folder2-open me-2" style={{ color: '#6c757d' }}></i>
                Mes Fiches
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Retrouvez et gérez tous vos exercices générés
              </p>
            </div>

            <Card style={{ 
              border: '2px solid #e9ecef', 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <Card.Body className="p-4">
                {/* Filters Card */}
                <Card className="mb-4" style={{ 
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '10px'
                }}>
                  <Card.Body className="p-3">
                    <h6 className="mb-3 fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                      <i className="bi bi-funnel me-2"></i>
                      Filtres
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      {/* First line: Domain, Level, Timeline filters */}
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {/* Domain Filter */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>Domaine:</label>
                          <select 
                            className="form-select form-select-sm"
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            style={{ width: '120px' }}
                          >
                            <option value="">Tous</option>
                            {getUniqueDomains().map(domain => (
                              <option key={domain} value={domain}>{domain}</option>
                            ))}
                          </select>
                        </div>

                        {/* Level Filter */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>Niveau:</label>
                          <select 
                            className="form-select form-select-sm"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            style={{ width: '90px' }}
                          >
                            <option value="">Tous</option>
                            {getUniqueLevels().map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>

                        {/* Timeline Filter */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>Période:</label>
                          <select 
                            className="form-select form-select-sm"
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            style={{ width: '120px' }}
                          >
                            <option value="">Toutes</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="3months">3 derniers mois</option>
                          </select>
                        </div>

                        {/* Clear Filters */}
                        {(selectedDomain || selectedLevel || selectedTimeRange || selectedTag || selectedTags.length > 0) && (
                          <button
                            onClick={clearFilters}
                            style={{
                              backgroundColor: 'white',
                              color: '#6c757d',
                              border: '1px solid #dee2e6',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                              e.currentTarget.style.borderColor = '#adb5bd';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#dee2e6';
                            }}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Effacer
                          </button>
                        )}
                      </div>

                      {/* Second line: Tags Filter */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>Tags:</label>
                        
                        {/* Tag input with autocomplete */}
                        <div className="position-relative" style={{ minWidth: '200px' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Tapez pour filtrer par tags..."
                            value={tagInput}
                            onChange={(e) => {
                              setTagInput(e.target.value);
                              setShowTagSuggestions(true);
                            }}
                            onFocus={() => setShowTagSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && tagInput.trim()) {
                                e.preventDefault();
                                const suggestions = getTagSuggestions();
                                if (suggestions.length > 0) {
                                  addTagToFilter(suggestions[0]);
                                }
                              }
                              if (e.key === 'Escape') {
                                setShowTagSuggestions(false);
                              }
                            }}
                          />
                          
                          {/* Tag suggestions dropdown */}
                          {showTagSuggestions && tagInput.trim() && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-2 shadow-sm z-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {getTagSuggestions().map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  className="btn btn-link text-start w-100 text-decoration-none py-1 px-2 border-0"
                                  style={{ fontSize: '0.85rem' }}
                                  onClick={() => addTagToFilter(tag)}
                                  onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                                >
                                  {tag}
                                </button>
                              ))}
                              {getTagSuggestions().length === 0 && (
                                <div className="text-muted p-2" style={{ fontSize: '0.8rem' }}>
                                  Aucun tag trouvé
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected tags display inline */}
                        {selectedTags.map(tag => (
                          <span key={tag} className="badge d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', backgroundColor: '#b3d9ff', color: '#1a5490' }}>
                            {tag}
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: '0.6rem', filter: 'invert(1)' }}
                              onClick={() => removeTagFromFilter(tag)}
                              aria-label={`Remove ${tag} filter`}
                            ></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
            
                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted">Chargement de vos fiches...</p>
                  </div>
                )}

                {error && (
                  <Alert variant="danger">
                    <h6>Erreur de chargement</h6>
                    <p className="mb-2">{error}</p>
                    <Button variant="outline-danger" size="sm" onClick={fetchUserFiles}>
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Réessayer
                    </Button>
                  </Alert>
                )}

                {!loading && !error && filteredFiles.length === 0 && files.length === 0 && (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-file-earmark-pdf" style={{ fontSize: '4rem', color: '#adb5bd' }}></i>
                    </div>
                    <h4 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>Aucune fiche générée</h4>
                    <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                      Vous n'avez pas encore généré de fiches d'exercices.
                    </p>
                    <button
                      onClick={() => window.location.href = '/generate/french'}
                      style={{
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Créer ma première fiche
                    </button>
                  </div>
                )}

                {!loading && !error && files.length > 0 && filteredFiles.length === 0 && (selectedDomain || selectedLevel || selectedTimeRange || selectedTag || selectedTags.length > 0) && (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-funnel" style={{ fontSize: '3rem', color: '#adb5bd' }}></i>
                    </div>
                    <h4 className="mb-3" style={{ color: '#495057', fontWeight: '600' }}>Aucun résultat</h4>
                    <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                      Aucune fiche ne correspond aux filtres sélectionnés.
                    </p>
                    <button
                      onClick={clearFilters}
                      style={{
                        backgroundColor: 'white',
                        color: '#6c757d',
                        border: '2px solid #dee2e6',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#adb5bd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Effacer les filtres
                    </button>
                  </div>
                )}

                {!loading && !error && filteredFiles.length > 0 && (
                  <>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {filteredFiles.length} fiche{filteredFiles.length > 1 ? 's' : ''} trouvée{filteredFiles.length > 1 ? 's' : ''}
                        {(selectedDomain || selectedLevel || selectedTimeRange || selectedTag || selectedTags.length > 0) && files.length !== filteredFiles.length && (
                          <span> sur {files.length}</span>
                        )}
                      </small>
                    </div>

                    {/* List View - One file per row */}
                    <div className="d-flex flex-column gap-3">
                      {filteredFiles.map((file) => (
                        <Card 
                          key={file.file_id} 
                          style={{ 
                            border: '2px solid #e9ecef',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = '#e9ecef';
                          }}
                        >
                          <Card.Body className="p-3">
                            <Row className="align-items-center">
                              {/* File Info - Left Side */}
                              <Col md={6} lg={7}>
                                <div className="d-flex align-items-start gap-3">
                                  <div className="flex-shrink-0">
                                    <i className="bi bi-file-earmark-pdf text-danger" style={{ fontSize: '2rem' }}></i>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                      <h6 className="mb-0 text-capitalize fw-semibold" style={{ color: '#2c3e50' }}>
                                        Exercices de {file.exercice_domain}
                                      </h6>
                                      <span className="badge text-uppercase" style={{ 
                                        fontSize: '0.75rem',
                                        backgroundColor: '#f8f9fa',
                                        color: '#495057',
                                        border: '1px solid #dee2e6',
                                        fontWeight: '600'
                                      }}>
                                        {file.class_level}
                                      </span>
                                      <small className="text-muted" style={{ fontSize: '0.85rem' }}>• {file.exercice_time}</small>
                                    </div>
                                    
                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                      {file.exercice_types.map((type) => (
                                        <span key={type} className="badge" style={{ 
                                          fontSize: '0.75rem',
                                          backgroundColor: file.exercice_domain === 'francais' ? '#fffbeb' : '#f0f8ff',
                                          color: file.exercice_domain === 'francais' ? '#d97706' : '#0066cc',
                                          border: `1px solid ${file.exercice_domain === 'francais' ? '#fbbf24' : '#87ceeb'}`,
                                          fontWeight: '500'
                                        }}>
                                          {getExerciseIcon(type)} {type}
                                        </span>
                                      ))}
                                    </div>

                                    {file.tags && file.tags.length > 0 && (
                                      <div className="d-flex flex-wrap gap-1 mb-2">
                                        {file.tags.map((tag) => (
                                          <span key={tag} className="badge" style={{ 
                                            fontSize: '0.7rem',
                                            backgroundColor: '#f1f3f5',
                                            color: '#495057',
                                            border: '1px solid #dee2e6',
                                            fontWeight: '500'
                                          }}>
                                            <i className="bi bi-tag-fill me-1" style={{ fontSize: '0.65rem' }}></i>
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="d-flex align-items-center gap-3 text-muted small">
                                      <span>
                                        <i className="bi bi-calendar3 me-1"></i>
                                        {formatDate(file.created_at)}
                                      </span>
                                      {file.download_count > 0 && (
                                        <span>
                                          <i className="bi bi-download me-1"></i>
                                          {file.download_count} téléchargement{file.download_count > 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Col>

                              {/* Actions - Right Side */}
                              <Col md={6} lg={5}>
                                <div className="d-flex justify-content-end">
                                  <div className="d-flex gap-2">
                                    <button
                                      onClick={() => downloadFile(file)}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        border: '2px solid #dee2e6',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'white';
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                      }}
                                      title="Télécharger"
                                    >
                                      <i className="bi bi-download"></i>
                                    </button>
                                    <button
                                      onClick={() => viewFile(file)}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        border: '2px solid #dee2e6',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'white';
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                      }}
                                    >
                                      <i className="bi bi-eye me-1"></i>
                                      <span className="d-none d-lg-inline">Visualiser</span>
                                    </button>
                                    <button
                                      onClick={() => openTagsModal(file)}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        border: '2px solid #dee2e6',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'white';
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                      }}
                                    >
                                      <i className="bi bi-tags me-1"></i>
                                      <span className="d-none d-lg-inline">Tags</span>
                                    </button>
                                    <button
                                      onClick={() => showFileDetails(file)}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        border: '2px solid #dee2e6',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'white';
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                      }}
                                    >
                                      <i className="bi bi-info-circle me-1"></i>
                                      <span className="d-none d-lg-inline">Détails</span>
                                    </button>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal de détails */}
        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-info-circle me-2"></i>
              Détails de la fiche
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedFile && (
              <div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Niveau :</strong>
                    <span className="badge bg-white text-dark border text-uppercase ms-2" style={{ fontSize: '0.75rem', color: '#495057' }}>
                      {selectedFile.class_level}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Durée :</strong> {selectedFile.exercice_time}
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Types d'exercices :</strong>
                  <div className="mt-2 d-flex flex-wrap gap-1">
                    {selectedFile.exercice_types.map((type) => (
                      <span key={type} className="badge bg-light text-dark border">
                        {getExerciseIcon(type)} {type}
                      </span>
                    ))}
                  </div>
                </div>

                {Object.keys(selectedFile.exercice_type_params).length > 0 && (
                  <div className="mb-3">
                    <strong>Paramètres des exercices :</strong>
                    <div className="mt-2">
                      {Object.entries(selectedFile.exercice_type_params).map(([type, params]) => (
                        <div key={type} className="border rounded p-2 mb-2 bg-light">
                          <div className="fw-semibold text-primary mb-1">
                            {getExerciseIcon(type)} {type}
                          </div>
                          <div className="small text-muted">
                            {Object.entries(params).map(([key, value]) => (
                              <div key={key}>• {key}: {value}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFile && selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div className="mb-3">
                    <strong>Tags :</strong>
                    <div className="mt-2 d-flex flex-wrap gap-1">
                      {selectedFile.tags.map((tag) => (
                        <span key={tag} className="badge" style={{ backgroundColor: '#b3d9ff', color: '#1a5490' }}>
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <strong>Créé le :</strong> {formatDate(selectedFile.created_at)}
                  </div>
                  <div className="col-md-6">
                    <strong>Téléchargements :</strong> {selectedFile.download_count}
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Fermer
            </Button>
            {selectedFile && (
              <>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    viewFile(selectedFile);
                    setShowPreviewModal(false);
                  }}
                >
                  <i className="bi bi-eye me-2"></i>
                  Visualiser
                </Button>
                <Button 
                  style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white' }}
                  onClick={() => {
                    downloadFile(selectedFile);
                    setShowPreviewModal(false);
                  }}
                  title="Télécharger"
                >
                  <i className="bi bi-download"></i>
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>

        {/* Tags Management Modal */}
        <Modal show={showTagsModal} onHide={() => setShowTagsModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-tags me-2"></i>
              Gérer les tags
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedFile && (
              <div>
                <div className="mb-3">
                  <h6>Fiche: Exercices de {selectedFile.exercice_domain} - {selectedFile.class_level}</h6>
                  <small className="text-muted">{selectedFile.filename}</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Ajouter un tag</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nouveau tag (max 30 caractères)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value.slice(0, 30))}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      maxLength={30}
                    />
                    <Button 
                      variant="primary" 
                      onClick={addTag}
                      disabled={!newTag.trim() || editingTags.includes(newTag.trim())}
                      className="d-flex align-items-center justify-content-center"
                      style={{ minWidth: '45px', height: '38px' }}
                    >
                      <span className="fs-5 fw-bold">+</span>
                    </Button>
                  </div>
                  <small className="text-muted">
                    {newTag.length}/30 caractères
                    {newTag.trim() && editingTags.includes(newTag.trim()) && (
                      <span className="text-warning ms-2">Ce tag existe déjà</span>
                    )}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tags actuels ({editingTags.length})</label>
                  {editingTags.length === 0 ? (
                    <p className="text-muted">Aucun tag</p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {editingTags.map((tag) => (
                        <span key={tag} className="badge d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', backgroundColor: '#b3d9ff', color: '#1a5490' }}>
                          🏷️ {tag}
                          <button
                            type="button"
                            className="btn-close"
                            style={{ fontSize: '0.6rem', filter: 'invert(1)' }}
                            onClick={() => removeTag(tag)}
                            aria-label="Supprimer ce tag"
                          ></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTagsModal(false)} disabled={savingTags}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={saveTags}
              disabled={savingTags}
            >
              {savingTags ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Sauvegarder
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* PDF Viewer Modal */}
        <Modal 
          show={showPDFViewerModal} 
          onHide={closePDFViewer} 
          size="xl" 
          centered
          className="pdf-viewer-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>📄 Visualisation de la fiche PDF</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0" style={{ height: '80vh' }}>
            {pdfViewerUrl && (
              <iframe
                src={pdfViewerUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="PDF Viewer"
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={handlePrintPDF}>
              🖨️ Imprimer
            </Button>
            <Button variant="outline-secondary" onClick={closePDFViewer}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </ProtectedPage>
  );
}
