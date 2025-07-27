"use client";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Button, Form, Badge, InputGroup, Modal, Dropdown, ButtonGroup } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import PDFViewerModal from "../../components/PDFViewerModal";
import { useEffect, useState, useCallback, useRef } from "react";
import { exerciseService, ExerciseSession } from "../../services/exerciseService";
import styles from "./sessions.module.css";

export default function SessionsPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ExerciseSession[]>([]);
  const [displayedSessions, setDisplayedSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PDF Viewer Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExerciseSession | null>(null);
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const sessionsPerBatch = 20; // Load 20 sessions at a time
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  // Timeline navigation state
  const [timelineData, setTimelineData] = useState<{[key: string]: {count: number, months: {[key: string]: number}}}>({}); 
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedTimelineYear, setSelectedTimelineYear] = useState<string>("");
  const [selectedTimelineMonth, setSelectedTimelineMonth] = useState<string>("");
  
  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("french"); // Default to français
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedExerciseTypes, setSelectedExerciseTypes] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>(""); // New general search
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false); // Modal state

  const levels = ["CP", "CE1", "CE2", "CM1", "CM2"];
  const subjects = [
    { value: "french", label: "Français" },
    { value: "math", label: "Math" }
  ];
  const durations = ["20 min", "30 min", "40 min"];
  
  // Exercise types by subject
  const exerciseTypesBySubject = {
    french: ["lecture", "compréhension", "grammaire", "conjugaison", "vocabulaire", "orthographe"],
    math: ["calcul", "problèmes", "géométrie"]
  };
  const months = [
    { value: "01", label: "Janvier" },
    { value: "02", label: "Février" },
    { value: "03", label: "Mars" },
    { value: "04", label: "Avril" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juin" },
    { value: "07", label: "Juillet" },
    { value: "08", label: "Août" },
    { value: "09", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Get exercise types based on selected subject
  const getAvailableExerciseTypes = () => {
    if (!selectedSubject) {
      // If no subject is selected, return all types
      return [...exerciseTypesBySubject.french, ...exerciseTypesBySubject.math];
    }
    return exerciseTypesBySubject[selectedSubject as keyof typeof exerciseTypesBySubject] || [];
  };

  // Clear exercise types when subject changes
  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    // Clear exercise type selection when subject changes
    setSelectedExerciseTypes([]);
    // Reset infinite scroll
    setCurrentBatch(0);
    setDisplayedSessions([]);
  };

  // Build timeline data from sessions
  const buildTimelineData = useCallback((sessionsList: ExerciseSession[]) => {
    const timeline: {[key: string]: {count: number, months: {[key: string]: number}}} = {};
    
    sessionsList.forEach(session => {
      const date = new Date(session.created_at);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      if (!timeline[year]) {
        timeline[year] = { count: 0, months: {} };
      }
      
      timeline[year].count++;
      timeline[year].months[month] = (timeline[year].months[month] || 0) + 1;
    });
    
    setTimelineData(timeline);
  }, []);

  // Load more sessions for infinite scroll
  const loadMoreSessions = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Simulate async loading (in real app, this would be an API call)
    setTimeout(() => {
      const nextBatch = currentBatch + 1;
      const startIndex = nextBatch * sessionsPerBatch;
      const endIndex = startIndex + sessionsPerBatch;
      const newSessions = filteredSessions.slice(startIndex, endIndex);
      
      if (newSessions.length > 0) {
        setDisplayedSessions(prev => [...prev, ...newSessions]);
        setCurrentBatch(nextBatch);
        setHasMore(endIndex < filteredSessions.length);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    }, 500);
  }, [currentBatch, filteredSessions, loadingMore, hasMore, sessionsPerBatch]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreSessions();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMoreSessions]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const userSessions = await exerciseService.getUserSessions();
        // Ensure sessions are sorted by creation date (newest first)
        const sortedSessions = userSessions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSessions(sortedSessions);
        setFilteredSessions(sortedSessions);
        
        // Build timeline data
        buildTimelineData(sortedSessions);
        
        // Initialize first batch for infinite scroll
        const firstBatch = sortedSessions.slice(0, sessionsPerBatch);
        setDisplayedSessions(firstBatch);
        setCurrentBatch(0);
        setHasMore(sortedSessions.length > sessionsPerBatch);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [buildTimelineData, sessionsPerBatch]);
  // Filter effect - now resets infinite scroll when filters change
  useEffect(() => {
    let filtered = [...sessions];

    if (selectedLevel) {
      filtered = filtered.filter(session => session.level === selectedLevel);
    }

    if (selectedSubject) {
      filtered = filtered.filter(session => session.subject === selectedSubject);
    }

    if (selectedDuration) {
      filtered = filtered.filter(session => session.duration === selectedDuration);
    }

    if (selectedExerciseTypes.length > 0) {
      filtered = filtered.filter(session => 
        selectedExerciseTypes.some(type => 
          session.exercise_types.includes(type)
        )
      );
    }

    // General text search
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(session => {
        const searchableText = [
          session.level,
          getSubjectLabel(session.subject),
          session.duration || '',
          session.theme || '',
          ...session.exercise_types
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
    }

    if (selectedMonth || selectedYear) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.created_at);
        const sessionMonth = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const sessionYear = String(sessionDate.getFullYear());

        if (selectedMonth && sessionMonth !== selectedMonth) return false;
        if (selectedYear && sessionYear !== selectedYear) return false;

        return true;
      });
    }

    // Timeline-based filtering
    if (selectedTimelineYear || selectedTimelineMonth) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.created_at);
        const sessionMonth = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const sessionYear = String(sessionDate.getFullYear());

        if (selectedTimelineYear && sessionYear !== selectedTimelineYear) return false;
        if (selectedTimelineMonth && sessionMonth !== selectedTimelineMonth) return false;

        return true;
      });
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredSessions(filtered);
    
    // Reset infinite scroll when filters change
    const firstBatch = filtered.slice(0, sessionsPerBatch);
    setDisplayedSessions(firstBatch);
    setCurrentBatch(0);
    setHasMore(filtered.length > sessionsPerBatch);
    
    // Update timeline data for filtered results
    buildTimelineData(filtered);
  }, [sessions, selectedLevel, selectedSubject, selectedDuration, selectedExerciseTypes, selectedMonth, selectedYear, searchText, selectedTimelineYear, selectedTimelineMonth, sessionsPerBatch, buildTimelineData]);

  // Calculate pagination - removed as we now use infinite scroll
  
  const clearFilters = () => {
    setSelectedLevel("");
    setSelectedSubject("french"); // Reset to français by default
    setSelectedDuration("");
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedExerciseTypes([]);
    setSearchText(""); // Clear search text
    setSelectedTimelineYear(""); // Clear timeline filters
    setSelectedTimelineMonth("");
    // Reset infinite scroll
    setCurrentBatch(0);
    setDisplayedSessions([]);
  };

  // Timeline navigation helpers
  const jumpToTimeline = (year?: string, month?: string) => {
    setSelectedTimelineYear(year || "");
    setSelectedTimelineMonth(month || "");
    setShowTimelineModal(false);
  };

  // Get timeline years sorted (newest first)
  const getTimelineYears = () => {
    return Object.keys(timelineData).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const handleDownload = async (sessionId: string) => {
    try {
      const blob = await exerciseService.downloadSessionPDF(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  // PDF Viewer handlers
  const handleViewPDF = useCallback((session: ExerciseSession) => {
    setSelectedSession(session);
    setShowPDFModal(true);
  }, []);

  const handleClosePDFModal = useCallback(() => {
    setShowPDFModal(false);
    setSelectedSession(null);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  const getSubjectLabel = (subject: string) => {
    const subjectObj = subjects.find(s => s.value === subject);
    return subjectObj ? subjectObj.label : subject;
  };

  return (
    <ProtectedPage>
      <Container className="mt-4">
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 d-flex align-items-center">
                📋 Mes fiches d'exercices
              </h2>
              <div className="d-flex align-items-center gap-3">
                {/* Timeline Navigation Button */}
                {Object.keys(timelineData).length > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowTimelineModal(true)}
                    title="Navigation rapide dans l'historique"
                    className={styles['timeline-btn']}
                  >
                    <i className="fas fa-calendar-alt me-2"></i>
                    Timeline
                  </Button>
                )}
                
                <Badge bg="primary" className="fs-6">
                  {filteredSessions.length} fiche{filteredSessions.length > 1 ? 's' : ''}
                  {filteredSessions.length !== sessions.length && (
                    <span className="text-white-50"> sur {sessions.length}</span>
                  )}
                </Badge>
              </div>
            </div>

            {/* Filters Section */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Filtres</h5>
                
                {/* First Row: Subject, Level, Exercise Types */}
                <Row className="mb-2">
                  <Col md={4} lg={3} className="mb-2">
                    <Form.Label>Matière</Form.Label>
                    <Form.Select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                    >
                      {subjects.map(subject => (
                        <option key={subject.value} value={subject.value}>{subject.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4} lg={3} className="mb-2">
                    <Form.Label>Niveau</Form.Label>
                    <Form.Select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                      <option value="">Tous</option>
                      {levels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4} lg={6} className="mb-2">
                    <Form.Label>Types d'exercices ({selectedSubject === 'french' ? 'Français' : 'Math'})</Form.Label>
                    <div className="d-flex gap-1 flex-wrap" style={{ minHeight: '42px' }}>
                      {getAvailableExerciseTypes().map(type => (
                        <Button
                          key={type}
                          variant={selectedExerciseTypes.includes(type) ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => {
                            if (selectedExerciseTypes.includes(type)) {
                              setSelectedExerciseTypes(selectedExerciseTypes.filter(t => t !== type));
                            } else {
                              setSelectedExerciseTypes([...selectedExerciseTypes, type]);
                            }
                          }}
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </Col>
                </Row>

                {/* Second Row: General Search */}
                <Row className="mb-3">
                  <Col md={8} lg={9} className="mb-3">
                    <Form.Label>Recherche générale</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Rechercher par niveau, matière, type d'exercice, thème... (ex: CP conjugaison)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                      {searchText && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchText("")}
                          title="Effacer la recherche"
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col md={4} lg={3} className="mb-3 d-flex align-items-end">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setShowAdvancedFilters(true)}
                      className="w-100"
                    >
                      <i className="fas fa-sliders-h me-2"></i>
                      + de filtres
                    </Button>
                  </Col>
                </Row>

                {/* Clear Filters Button */}
                {(selectedLevel || selectedSubject !== "french" || selectedExerciseTypes.length > 0 || searchText || selectedDuration || selectedMonth || selectedYear || selectedTimelineYear || selectedTimelineMonth) && (
                  <div className="mt-3">
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                      <i className="fas fa-eraser me-1"></i>
                      Effacer tous les filtres
                    </Button>
                  </div>
                )}

                {/* Active Timeline Filters Display */}
                {(selectedTimelineYear || selectedTimelineMonth) && (
                  <div className={`mt-3 p-2 bg-info bg-opacity-10 rounded ${styles['timeline-active-filter']}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <small className="text-info fw-medium">
                        <i className="fas fa-calendar-alt me-1"></i>
                        Navigation timeline active: 
                        {selectedTimelineYear && ` ${selectedTimelineYear}`}
                        {selectedTimelineMonth && ` - ${months.find(m => m.value === selectedTimelineMonth)?.label}`}
                      </small>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => {
                          setSelectedTimelineYear("");
                          setSelectedTimelineMonth("");
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-3 text-muted">Chargement de vos fiches...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-danger">
                <Card.Body className="text-center py-4">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-danger mb-3">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <h5 className="text-danger">Erreur de chargement</h5>
                  <p className="text-muted">{error}</p>
                </Card.Body>
              </Card>
            )}

            {/* Sessions List */}
            {!loading && !error && (
              <>
                {filteredSessions.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                      <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📋</div>
                      <h5 className="text-muted">Aucune fiche trouvée</h5>
                      <p className="text-muted">
                        {sessions.length === 0 
                          ? "Vous n'avez pas encore créé de fiches d'exercices." 
                          : "Aucune fiche ne correspond à vos critères de filtre."
                        }
                      </p>
                      {sessions.length === 0 && (
                        <Link href="/generate">
                          <Button variant="primary" className="mt-3">
                            Créer ma première fiche
                          </Button>
                        </Link>
                      )}
                    </Card.Body>
                  </Card>
                ) : (
                  <>
                    {/* Compact Sessions Table with Infinite Scroll */}
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-0">
                        <div className={`table-responsive ${styles['sessions-table-container']}`}>
                          <table className="table table-hover mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th className="px-3 py-3 border-0">Matière</th>
                                <th className="px-3 py-3 border-0">Niveau</th>
                                <th className="px-3 py-3 border-0">Durée</th>
                                <th className="px-3 py-3 border-0">Types d'exercices</th>
                                {selectedSubject === 'french' && (
                                  <th className="px-3 py-3 border-0">Thème</th>
                                )}
                                <th className="px-3 py-3 border-0">Date</th>
                                <th className="px-3 py-3 border-0 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedSessions.map((session, index) => {
                                // Add date separator for better timeline UX
                                const showDateSeparator = index === 0 || 
                                  new Date(displayedSessions[index - 1].created_at).toDateString() !== 
                                  new Date(session.created_at).toDateString();
                                
                                return (
                                  <React.Fragment key={session.id}>
                                    {showDateSeparator && index > 0 && (
                                      <tr className={`table-light ${styles['date-separator']}`}>
                                        <td colSpan={selectedSubject === 'french' ? 7 : 6} className="text-center py-2 border-0">
                                          <small className="text-muted fw-medium">
                                            <i className="fas fa-calendar me-1"></i>
                                            {new Date(session.created_at).toLocaleDateString('fr-FR', {
                                              weekday: 'long',
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric'
                                            })}
                                          </small>
                                        </td>
                                      </tr>
                                    )}
                                    <tr className={`align-middle ${styles['session-row']}`}>
                                      <td className="px-3 py-2">
                                        <div className="d-flex align-items-center">
                                          <span className="me-2" style={{ fontSize: '1.2rem' }}>
                                            {session.subject === 'french' ? '📚' : '🔢'}
                                          </span>
                                          <span className="fw-medium">
                                            {getSubjectLabel(session.subject)}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <Badge className={styles['badge-level']}>
                                          {session.level}
                                        </Badge>
                                      </td>
                                      <td className="px-3 py-2">
                                        {session.duration && (
                                          <Badge className={styles['badge-duration']}>
                                            {session.duration}
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="d-flex gap-1 flex-wrap">
                                          {session.exercise_types.slice(0, 2).map((type, typeIndex) => (
                                            <span 
                                              key={typeIndex}
                                              className={styles['badge-exercise-type']}
                                            >
                                              {type}
                                            </span>
                                          ))}
                                          {session.exercise_types.length > 2 && (
                                            <span 
                                              className={styles['badge-exercise-type-count']}
                                              title={session.exercise_types.slice(2).join(', ')}
                                            >
                                              +{session.exercise_types.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      {selectedSubject === 'french' && (
                                        <td className="px-3 py-2">
                                          {session.theme ? (
                                            <span 
                                              className="text-primary fw-medium" 
                                              style={{ fontSize: '0.85rem' }}
                                              title={session.theme}
                                            >
                                              {session.theme.length > 20 
                                                ? `${session.theme.substring(0, 20)}...` 
                                                : session.theme
                                              }
                                            </span>
                                          ) : (
                                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>-</span>
                                          )}
                                        </td>
                                      )}
                                      <td className="px-3 py-2">
                                        <small className="text-muted">
                                          {new Date(session.created_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          })}
                                        </small>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {session.status === 'completed' && session.pdf_url ? (
                                          <div className={styles['pdf-actions']}>
                                            <Button 
                                              variant="outline-info"
                                              size="sm"
                                              onClick={() => handleViewPDF(session)}
                                              title="Visualiser PDF"
                                            >
                                              Voir
                                            </Button>
                                            <Button 
                                              variant="outline-primary"
                                              size="sm"
                                              onClick={() => handleDownload(session.id)}
                                              title="Télécharger PDF"
                                            >
                                              ⬇️
                                            </Button>
                                          </div>
                                        ) : (
                                          <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            disabled
                                            title="Non disponible"
                                          >
                                            ❌
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Infinite Scroll Loader */}
                    {hasMore && (
                      <div 
                        ref={loadMoreRef}
                        className={`text-center py-4 ${styles['infinite-scroll-loader']}`}
                      >
                        {loadingMore ? (
                          <div className="d-flex justify-content-center align-items-center">
                            <div className={`spinner-border text-primary me-3 ${styles['custom-spinner']}`} role="status">
                              <span className="visually-hidden">Chargement...</span>
                            </div>
                            <span className="text-muted">Chargement de plus de fiches...</span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={loadMoreSessions}
                            className={styles['infinite-scroll-loader']}
                          >
                            <i className="fas fa-chevron-down me-2"></i>
                            Charger plus de fiches
                          </Button>
                        )}
                      </div>
                    )}

                    {/* End of results indicator */}
                    {!hasMore && displayedSessions.length > 0 && (
                      <div className={`text-center py-3 ${styles['end-indicator']}`}>
                        <small className="text-muted">
                          <i className="fas fa-check-circle me-1 text-success"></i>
                          Toutes les fiches ont été chargées ({displayedSessions.length} fiches affichées)
                        </small>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </Col>
        </Row>

        {/* Advanced Filters Modal */}
        <Modal show={showAdvancedFilters} onHide={() => setShowAdvancedFilters(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-sliders-h me-2"></i>
              Filtres avancés
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Durée</Form.Label>
                <Form.Select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                >
                  <option value="">Toutes</option>
                  {durations.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Mois</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Tous</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Année</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Toutes</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            
            {/* Active Filters Summary */}
            {(selectedDuration || selectedMonth || selectedYear) && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">Filtres avancés actifs :</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {selectedDuration && (
                    <Badge bg="secondary">Durée: {selectedDuration}</Badge>
                  )}
                  {selectedMonth && (
                    <Badge bg="secondary">
                      Mois: {months.find(m => m.value === selectedMonth)?.label}
                    </Badge>
                  )}
                  {selectedYear && (
                    <Badge bg="secondary">Année: {selectedYear}</Badge>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => {
                setSelectedDuration("");
                setSelectedMonth("");
                setSelectedYear("");
              }}
            >
              <i className="fas fa-eraser me-1"></i>
              Effacer filtres avancés
            </Button>
            <Button variant="primary" onClick={() => setShowAdvancedFilters(false)}>
              Appliquer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Timeline Navigation Modal */}
        <Modal show={showTimelineModal} onHide={() => setShowTimelineModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-calendar-alt me-2"></i>
              Navigation Timeline - Accès rapide
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <p className="text-muted">
                Naviguez rapidement dans votre historique de fiches par année et mois.
              </p>
            </div>

            {/* Years Timeline */}
            <div className="mb-4">
              <h6 className="mb-3">🗓️ Par année</h6>
              <div className="d-flex gap-3 flex-wrap">
                {getTimelineYears().map(year => (
                  <div key={year} className="text-center">
                    <Button
                      variant={selectedTimelineYear === year ? "primary" : "outline-primary"}
                      size="sm"
                      onClick={() => jumpToTimeline(year)}
                      className={`mb-2 ${styles['timeline-year-btn']} ${selectedTimelineYear === year ? 'active' : ''}`}
                      style={{ minWidth: '80px' }}
                    >
                      <div className="fw-bold">{year}</div>
                      <small>({timelineData[year].count} fiches)</small>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Months for Selected Year */}
            {selectedTimelineYear && timelineData[selectedTimelineYear] && (
              <div className="mb-4">
                <h6 className="mb-3">📅 {selectedTimelineYear} - Par mois</h6>
                <div className="row g-2">
                  {months.map(month => {
                    const count = timelineData[selectedTimelineYear].months[month.value] || 0;
                    const isActive = selectedTimelineMonth === month.value;
                    
                    return (
                      <div key={month.value} className="col-md-3 col-6">
                        <Button
                          variant={isActive ? "primary" : count > 0 ? "outline-primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => count > 0 ? jumpToTimeline(selectedTimelineYear, month.value) : null}
                          disabled={count === 0}
                          className={`w-100 ${styles['timeline-month-btn']}`}
                        >
                          <div className="fw-medium">{month.label}</div>
                          <small>({count} fiches)</small>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-3">⚡ Actions rapides</h6>
              <div className="d-flex gap-2 flex-wrap">
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={() => jumpToTimeline()}
                >
                  <i className="fas fa-home me-1"></i>
                  Voir tout l'historique
                </Button>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => {
                    const currentYear = new Date().getFullYear().toString();
                    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                    jumpToTimeline(currentYear, currentMonth);
                  }}
                >
                  <i className="fas fa-clock me-1"></i>
                  Ce mois-ci
                </Button>
                {getTimelineYears().length > 0 && (
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={() => jumpToTimeline(getTimelineYears()[0])}
                  >
                    <i className="fas fa-arrow-up me-1"></i>
                    Cette année
                  </Button>
                )}
              </div>
            </div>

            {/* Current Selection Summary */}
            {(selectedTimelineYear || selectedTimelineMonth) && (
              <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <strong className="text-primary">Sélection actuelle :</strong>
                    <div className="mt-1">
                      {selectedTimelineYear && (
                        <Badge bg="primary" className="me-2">{selectedTimelineYear}</Badge>
                      )}
                      {selectedTimelineMonth && (
                        <Badge bg="primary">
                          {months.find(m => m.value === selectedTimelineMonth)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => {
                      setSelectedTimelineYear("");
                      setSelectedTimelineMonth("");
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTimelineModal(false)}>
              Fermer
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowTimelineModal(false)}
              disabled={!selectedTimelineYear && !selectedTimelineMonth}
            >
              Appliquer la navigation
            </Button>
          </Modal.Footer>
        </Modal>

        {/* PDF Viewer Modal */}
        <PDFViewerModal
          show={showPDFModal}
          onHide={handleClosePDFModal}
          session={selectedSession}
        />
      </Container>
    </ProtectedPage>
  );
}
