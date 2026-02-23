"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Alert, Button, Badge, Spinner, Modal } from "react-bootstrap";
import ProtectedPage from "../../components/ProtectedPage";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { filesService, GeneratedFile } from "../../services/filesService";
import api from "../../services/api";
import SkeletonFileCard from "../../components/SkeletonFileCard";
import EmptyState from "../../components/EmptyState";
import { useDebounce } from "../../hooks/useDebounce";
import styles from './sessions.module.css';
import { getApiUrl } from '../../services/configService';

// Phase 6: localStorage key for filter persistence
const FILTERS_STORAGE_KEY = 'mesFiches_lastFilters_v1';

// Phase 6: Interface for saved filters
interface SavedFilters {
  selectedDomain: string;
  selectedLevel: string;
  selectedTimeRange: string;
  selectedTags: string[];
  searchInput: string;
}

// Phase 6: Get default filters
const getDefaultFilters = (): SavedFilters => ({
  selectedDomain: '',
  selectedLevel: '',
  selectedTimeRange: 'week', // Default to week
  selectedTags: [],
  searchInput: ''
});

// Phase 6: Load saved filters from localStorage
const loadSavedFilters = (): SavedFilters => {
  try {
    if (typeof window === 'undefined') return getDefaultFilters();
    
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!saved) return getDefaultFilters();
    
    const parsed = JSON.parse(saved) as SavedFilters;
    
    // Validate parsed data
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('⚠️ Invalid saved filters format, using defaults');
      return getDefaultFilters();
    }
    
    console.log('✅ Filtres chargés depuis localStorage:', parsed);
    return {
      selectedDomain: typeof parsed.selectedDomain === 'string' ? parsed.selectedDomain : '',
      selectedLevel: typeof parsed.selectedLevel === 'string' ? parsed.selectedLevel : '',
      selectedTimeRange: typeof parsed.selectedTimeRange === 'string' ? parsed.selectedTimeRange : 'week',
      selectedTags: Array.isArray(parsed.selectedTags) ? parsed.selectedTags : [],
      searchInput: typeof parsed.searchInput === 'string' ? parsed.searchInput : ''
    };
  } catch (error) {
    console.warn('⚠️ Erreur lors du chargement des filtres sauvegardés:', error);
    return getDefaultFilters();
  }
};

// Phase 6: Save filters to localStorage
const saveFiltersToStorage = (filters: SavedFilters): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    console.log('💾 Filtres sauvegardés dans localStorage');
  } catch (error) {
    // Handle quota exceeded or localStorage disabled
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota dépassé, impossible de sauvegarder les filtres');
    } else {
      console.warn('⚠️ Erreur lors de la sauvegarde des filtres:', error);
    }
  }
};

export default function SessionsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading, userPreferences } = useAuth();
  const { status } = useSubscription();
  
  // Phase 6: Load saved filters on initialization (before early return, safe because it only reads localStorage)
  const savedFilters = loadSavedFilters();
  
  // Early return if auth is loading or no user - must be before any state hooks
  if (authLoading || !user) {
    return (
      <ProtectedPage>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" />
        </div>
      </ProtectedPage>
    );
  }
  
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<GeneratedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [showPDFViewerModal, setShowPDFViewerModal] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [loadingPdfViewer, setLoadingPdfViewer] = useState(false);
  
  // Tags editing state
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [savingTags, setSavingTags] = useState(false);
  
  // Phase 6: Track if filters were restored from localStorage
  const [filtersRestored, setFiltersRestored] = useState(false);
  const [showRestoredNotification, setShowRestoredNotification] = useState(false);
  
  // Filter states - Phase 6: Initialize from localStorage only
  const [selectedDomain, setSelectedDomain] = useState<string>(savedFilters.selectedDomain || '');
  const [selectedLevel, setSelectedLevel] = useState<string>(savedFilters.selectedLevel || '');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(savedFilters.selectedTimeRange || 'week');
  const [selectedTag, setSelectedTag] = useState<string>(''); // Keep for backwards compatibility
  
  // Enforce 'week' for freemium users
  useEffect(() => {
    if (status?.tier === 'freemium' && selectedTimeRange !== 'week') {
      setSelectedTimeRange('week');
    }
  }, [status?.tier, selectedTimeRange]);
  
  // Enhanced tag filtering states - Phase 6: Initialize from localStorage
  const [selectedTags, setSelectedTags] = useState<string[]>(savedFilters.selectedTags);
  const [tagInput, setTagInput] = useState<string>('');
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  
  // Phase 4: Available tags from backend
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Phase 3: Search input state with debounce - Phase 6: Initialize from localStorage
  const [searchInput, setSearchInput] = useState<string>(savedFilters.searchInput);
  const [isSearching, setIsSearching] = useState(false); // Visual indicator for debounced search

  // Phase 2: Backend pagination states (remplace displayedCount)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 20; // 20 items per page

  // Phase 1: Chargement optimisé - nouveaux states
  const [totalCount, setTotalCount] = useState(0); // Compteur total de fiches
  const [showingPeriod, setShowingPeriod] = useState<'week' | 'all'>('week'); // Période affichée

  // Phase 3: Debounced values (300ms delay)
  const debouncedSearchInput = useDebounce(searchInput, 300);
  const debouncedSelectedDomain = useDebounce(selectedDomain, 300);
  const debouncedSelectedLevel = useDebounce(selectedLevel, 300);
  const debouncedSelectedTimeRange = useDebounce(selectedTimeRange, 300);
  const debouncedSelectedTags = useDebounce(selectedTags, 300);

  // Helper: Dédupliquer et trier les fichiers (plus récents en premier)
  const deduplicateAndSortFiles = (files: GeneratedFile[]): GeneratedFile[] => {
    const originalCount = files.length;
    
    // Dédupliquer par file_id
    const uniqueFiles = Array.from(
      new Map(files.map(file => [file.file_id, file])).values()
    );
    
    if (uniqueFiles.length < originalCount) {
      console.log(`🔧 Déduplication: ${originalCount} → ${uniqueFiles.length} fiches (${originalCount - uniqueFiles.length} doublons supprimés)`);
    }
    
    // Trier par date (plus récents en premier)
    const sortedFiles = uniqueFiles.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Décroissant (plus récent en premier)
    });
    
    console.log(`📅 Tri: ${sortedFiles.length} fiches triées (plus récent: ${sortedFiles[0]?.created_at})`);
    
    return sortedFiles;
  };

  // Helper: Get period label based on selected time range
  const getPeriodLabel = (): string => {
    if (!selectedTimeRange) return 'Toutes les fiches';
    
    switch (selectedTimeRange) {
      case 'today':
        return "Aujourd'hui";
      case 'week':
        return '7 derniers jours';
      case 'month':
        return 'Ce mois';
      case '3months':
        return '3 derniers mois';
      default:
        return 'Toutes les fiches';
    }
  };

  // Phase 5: Helper - Get domain label
  const getDomainLabel = (domain: string): string => {
    const labels: Record<string, string> = {
      'francais': 'Français',
      'math': 'Mathématiques',
      'anglais': 'Anglais'
    };
    return labels[domain] || domain;
  };

  // Phase 5: Helper - Get level label
  const getLevelLabel = (level: string): string => {
    return level.toUpperCase(); // CP, CE1, CE2, CM1, CM2
  };

  // Phase 5: Helper - Check if any filter is active
  const hasActiveFilters = (): boolean => {
    return !!(
      selectedDomain ||
      selectedLevel ||
      (selectedTimeRange && selectedTimeRange !== 'week') || // Exclude default 'week'
      searchInput ||
      selectedTags.length > 0
    );
  };

  // Phase 5: Helper - Count active filters
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (selectedDomain) count++;
    if (selectedLevel) count++;
    if (selectedTimeRange && selectedTimeRange !== 'week') count++; // Exclude default
    if (searchInput) count++;
    count += selectedTags.length;
    return count;
  };

  // Phase 2: Fonction de recherche avec pagination backend
  const searchFiles = async (pageNum: number, resetFiles = false) => {
    if (!user?.user_id) return;

    try {
      if (resetFiles) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      // Construire les filtres pour la requête
      const searchBody: any = {
        page: pageNum,
        page_size: PAGE_SIZE,
        active_only: false
      };

      // Phase 3: Ajouter les filtres actifs (avec debounce)
      if (debouncedSelectedDomain) searchBody.exercice_domain = debouncedSelectedDomain;
      if (debouncedSelectedLevel) searchBody.class_level = debouncedSelectedLevel;
      if (debouncedSelectedTimeRange) searchBody.time_period = debouncedSelectedTimeRange;
      if (debouncedSearchInput) searchBody.custom_name = debouncedSearchInput;
      if (debouncedSelectedTags.length > 0) {
        searchBody.tags = debouncedSelectedTags;
        searchBody.match_all_tags = true; // AND logic
      }

      console.log('🔍 Recherche avec filtres (debounced):', searchBody);

      const apiUrl = await getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/education/exercises/files/${user.user_id}/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchBody)
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche de fiches');
      }

      const data = await response.json();

      console.log('✅ Résultats pagination:', {
        page: data.page,
        items: data.items.length,
        total: data.total_count,
        hasMore: data.has_more
      });

      // Mettre à jour les states avec déduplication et tri
      let updatedFiles: GeneratedFile[];
      if (resetFiles) {
        // Première page: remplacer les fiches
        updatedFiles = deduplicateAndSortFiles(data.items);
      } else {
        // Page suivante: ajouter aux fiches existantes (dédupliquer et trier)
        updatedFiles = deduplicateAndSortFiles([...files, ...data.items]);
      }

      setFiles(updatedFiles);
      setFilteredFiles(updatedFiles);
      setTotalCount(data.total_count);
      setHasMore(data.has_more);
      setTotalPages(data.total_pages);
      setPage(pageNum);

    } catch (err: any) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Erreur lors de la recherche de fiches');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Phase 1: Récupérer les fichiers PDF de l'utilisateur - VERSION OPTIMISÉE
  const fetchUserFiles = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Phase 1: Chargement parallèle optimisé
      // Charger le compteur total ET les fiches récentes (7 derniers jours) en parallèle
      const [countData, recentFiles] = await Promise.all([
        // Compteur total
        getApiUrl().then(apiUrl => fetch(`${apiUrl}/api/education/exercises/files/${user.user_id}/count?active_only=false`))
          .then(res => {
            if (!res.ok) throw new Error('Erreur lors de la récupération du compteur');
            return res.json();
          }),
        // Fiches récentes (7 derniers jours)
        getApiUrl().then(apiUrl => fetch(`${apiUrl}/api/education/exercises/files/${user.user_id}/by-period/week?active_only=false`))
          .then(res => {
            if (!res.ok) throw new Error('Erreur lors de la récupération des fiches récentes');
            return res.json();
          })
      ]);

      // Dédupliquer et trier les fiches récentes
      const sortedRecentFiles = deduplicateAndSortFiles(recentFiles);

      setTotalCount(countData.total_count);
      setFiles(sortedRecentFiles);
      setFilteredFiles(sortedRecentFiles); // Initialize filtered files
      setShowingPeriod('week');
      setPage(1);
      setHasMore(sortedRecentFiles.length < countData.total_count);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des fichiers:', err);
      
      // Gestion d'erreur plus précise
      if (err.message?.includes('compteur')) {
        setError('Impossible de charger le compteur de fiches');
      } else if (err.response?.status === 404) {
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

  // Phase 1: Fonction pour charger toutes les fiches
  const loadAllFiles = async () => {
    if (!user?.user_id || showingPeriod === 'all') return;

    try {
      setLoading(true);
      setError(null);
      setShowingPeriod('all');
      
      // Charger toutes les fiches
      const apiUrl = await getApiUrl();
      const allFiles = await fetch(
        `${apiUrl}/api/education/exercises/files/${user.user_id}/by-period/all?active_only=false`
      ).then(res => {
        if (!res.ok) throw new Error('Erreur lors de la récupération de toutes les fiches');
        return res.json();
      });

      // Dédupliquer et trier toutes les fiches
      const sortedAllFiles = deduplicateAndSortFiles(allFiles);

      setFiles(sortedAllFiles);
      setFilteredFiles(sortedAllFiles);
    } catch (err: any) {
      console.error('Erreur lors du chargement de toutes les fiches:', err);
      setError(err.message || 'Erreur lors du chargement de toutes les fiches');
    } finally {
      setLoading(false);
    }
  };

  // Phase 4: Load available tags from backend
  const loadAvailableTags = async () => {
    if (!user?.user_id) return;

    try {
      setLoadingTags(true);
      console.log('🏷️ Chargement des tags disponibles depuis le backend...');
      
      const apiUrl = await getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/education/exercises/files/${user.user_id}/available-tags?active_only=false`
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tags');
      }

      const tags = await response.json();
      console.log('✅ Tags backend chargés:', tags.length, 'tags disponibles');
      
      setAvailableTags(tags);
    } catch (err: any) {
      console.error('❌ Erreur chargement tags backend:', err);
      // Don't set error state, just log it - tags are not critical
      // Fallback: try to extract tags from loaded files
      console.log('⚠️ Fallback: extraction tags depuis les fiches chargées');
      setAvailableTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
    // Don't load tags at mount - let users type freely
    // Tags will be loaded on first focus of tag input (lazy loading)
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

  // Phase 3: Appliquer les filtres via backend avec debounce
  useEffect(() => {
    // Skip si on est en mode "week" initial sans autres filtres (géré par fetchUserFiles)
    if (showingPeriod === 'week' && 
        !debouncedSelectedDomain && 
        !debouncedSelectedLevel && 
        debouncedSelectedTimeRange === 'week' && // Default initial state
        !debouncedSearchInput &&
        debouncedSelectedTags.length === 0) {
      setIsSearching(false);
      return; // Garder les fiches initiales chargées par fetchUserFiles
    }

    // Si des filtres sont actifs (ou période changée), utiliser la recherche backend
    if (debouncedSelectedDomain || 
        debouncedSelectedLevel || 
        (debouncedSelectedTimeRange && debouncedSelectedTimeRange !== 'week') || // Période différente de l'initial
        debouncedSearchInput ||
        debouncedSelectedTags.length > 0) {
      console.log('🔄 Filtres debouncés appliqués, nouvelle recherche backend');
      setIsSearching(true);
      searchFiles(1, true).finally(() => setIsSearching(false)); // Reset à la page 1
    }
  }, [debouncedSelectedDomain, debouncedSelectedLevel, debouncedSelectedTimeRange, debouncedSearchInput, debouncedSelectedTags]);

  // Phase 3: Indicateur visuel pendant le debounce
  useEffect(() => {
    // Si les valeurs immédiates diffèrent des valeurs debouncées, on est en train de debouncer
    const isDifferent = 
      selectedDomain !== debouncedSelectedDomain ||
      selectedLevel !== debouncedSelectedLevel ||
      selectedTimeRange !== debouncedSelectedTimeRange ||
      searchInput !== debouncedSearchInput ||
      JSON.stringify(selectedTags) !== JSON.stringify(debouncedSelectedTags);
    
    if (isDifferent) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [selectedDomain, selectedLevel, selectedTimeRange, searchInput, selectedTags, 
      debouncedSelectedDomain, debouncedSelectedLevel, debouncedSelectedTimeRange, debouncedSearchInput, debouncedSelectedTags]);

  // Phase 6: Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave: SavedFilters = {
      selectedDomain,
      selectedLevel,
      selectedTimeRange,
      selectedTags,
      searchInput
    };
    
    saveFiltersToStorage(filtersToSave);
  }, [selectedDomain, selectedLevel, selectedTimeRange, selectedTags, searchInput]);

  // Phase 6: Check if filters were restored on mount
  useEffect(() => {
    const hasNonDefaultFilters = 
      savedFilters.selectedDomain !== '' ||
      savedFilters.selectedLevel !== '' ||
      savedFilters.selectedTimeRange !== 'week' ||
      savedFilters.selectedTags.length > 0 ||
      savedFilters.searchInput !== '';
    
    if (hasNonDefaultFilters) {
      setFiltersRestored(true);
      setShowRestoredNotification(true);
      
      // Auto-hide notification after 4 seconds
      const timer = setTimeout(() => {
        setShowRestoredNotification(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, []); // Run once on mount

  // Phase 2: Charger la page suivante
  const loadMoreFiles = () => {
    if (!hasMore || isLoadingMore) return;
    
    console.log(`📄 Chargement page ${page + 1}/${totalPages}`);
    searchFiles(page + 1, false); // Page suivante
  };

  // Phase 2: Intersection Observer pour infinite scroll avec backend pagination
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreFiles();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoadingMore, page]);

  // Get unique domains and levels for filter options
  // Use static options to ensure filters are always available (even when files not loaded yet)
  const getUniqueDomains = (): string[] => {
    return ['francais', 'math', 'anglais'];
  };

  const getUniqueLevels = (): string[] => {
    return ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
  };

  const getUniqueTags = (): string[] => {
    const tags = files.flatMap(file => file.tags || []);
    return [...new Set(tags)].sort();
  };

  // Get filtered tag suggestions based on input
  // Phase 4: Now uses backend availableTags instead of frontend extraction
  const getTagSuggestions = (): string[] => {
    if (!tagInput.trim()) return [];
    
    // Use backend tags if available, fallback to frontend extraction
    const tagsSource = availableTags.length > 0 ? availableTags : getUniqueTags();
    
    const filteredTags = tagsSource.filter(tag => 
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
    
    return filteredTags.slice(0, 8); // Increased to 8 suggestions for better UX
  };

  // Add a tag to the selected tags
  const addTagToFilter = (tag: string) => {
    // Only allow Famille+ users to add tags
    if (status?.tier !== 'famille_plus') return;
    
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Remove a specific tag from the filter
  const removeTagFromFilter = (tagToRemove: string) => {
    // Only allow Famille+ users to remove tags
    if (status?.tier !== 'famille_plus') return;
    
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Clear all selected tags
  const clearAllTagFilters = () => {
    // Only allow Famille+ users to clear tags
    if (status?.tier !== 'famille_plus') return;
    
    setSelectedTags([]);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedDomain('');
    setSelectedLevel('');
    setSelectedTimeRange('week'); // Reset to initial state (last week)
    setSelectedTag('');
    setSearchInput(''); // Phase 3: Clear search input
    clearAllTagFilters();
    
    // Reload initial data (last week)
    fetchUserFiles();
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
    
    setLoadingPdfViewer(true);
    
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
    } finally {
      setLoadingPdfViewer(false);
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
      
      // Update the file in our local state (keep sorted)
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(file => 
          file.file_id === selectedFile.file_id 
            ? { ...file, tags: editingTags }
            : file
        );
        return deduplicateAndSortFiles(updatedFiles);
      });

      // Also update filteredFiles to reflect the change immediately
      setFilteredFiles(prevFilteredFiles => {
        const updatedFilteredFiles = prevFilteredFiles.map(file => 
          file.file_id === selectedFile.file_id 
            ? { ...file, tags: editingTags }
            : file
        );
        return updatedFilteredFiles;
      });
      
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
      <Container style={{ marginTop: '0.65rem' }}>
        <Row className="justify-content-center">
          <Col lg={10}>
            {/* Enhanced Main Title */}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ 
                color: '#2c3e50',
                fontSize: '2rem'
              }}>
                <i className="bi bi-folder2-open me-2" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #87ceeb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}></i>
                Mes Fiches
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Retrouvez et gérez tous vos exercices générés
              </p>
            </div>

            <Card style={{ 
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.03) 0%, rgba(135,206,235,0.03) 100%)',
              backgroundAttachment: 'fixed'
            }}>
              <Card.Body className="p-4">
                {/* Filters Card */}
                <Card className="mb-4" style={{ 
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(135,206,235,0.05) 100%)',
                  border: '1px solid #e9ecef',
                  borderRadius: '10px',
                  boxShadow: '0 1px 3px rgba(251,191,36,0.1)'
                }}>
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0 fw-semibold" style={{ color: '#495057', fontSize: '0.9rem' }}>
                        <i className="bi bi-funnel me-2" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #87ceeb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}></i>
                        Filtres
                      </h6>
                      {/* Phase 6: Notification de restauration des filtres */}
                      {showRestoredNotification && (
                        <div 
                          className="d-flex align-items-center gap-2 px-3 py-1 rounded"
                          style={{
                            backgroundColor: '#e7f3ff',
                            border: '1px solid #b3d9ff',
                            fontSize: '0.85rem',
                            color: '#0056b3',
                            animation: 'fadeIn 0.3s ease-in'
                          }}
                        >
                          <i className="bi bi-clock-history"></i>
                          <span>Filtres restaurés</span>
                        </div>
                      )}
                    </div>
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
                            style={{ width: '140px' }}
                          >
                            <option value="">Tous</option>
                            <option value="francais">Français</option>
                            <option value="math">Mathématiques</option>
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
                            <option value="CP">CP</option>
                            <option value="CE1">CE1</option>
                            <option value="CE2">CE2</option>
                            <option value="CM1">CM1</option>
                            <option value="CM2">CM2</option>
                          </select>
                        </div>

                        {/* Timeline Filter */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>Période:</label>
                          <select 
                            className="form-select form-select-sm"
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            disabled={status?.tier === 'freemium'}
                            style={{ width: '160px' }}
                          >
                            {status?.tier === 'freemium' ? (
                              <option value="week">7 derniers jours</option>
                            ) : status?.tier === 'famille_plus' ? (
                              <>
                                <option value="week">7 derniers jours</option>
                                <option value="month">30 derniers jours</option>
                                <option value="3months">90 derniers jours</option>
                                <option value="unlimited">Illimité</option>
                              </>
                            ) : (
                              <>
                                <option value="week">7 derniers jours</option>
                                <option value="month">30 derniers jours</option>
                                <option value="3months">90 derniers jours</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Second line: Tags Filter */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <label className="form-label mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>
                          <i className="bi bi-tags me-1"></i>
                          Tags:
                        </label>
                        
                        {/* Phase 4: Enhanced tag input with backend autocomplete */}
                        <div className="position-relative" style={{ minWidth: '250px', flexGrow: 1, maxWidth: '400px' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={status?.tier !== 'famille_plus' ? "✨ Fonctionnalité Famille+" : (loadingTags ? "Chargement des tags..." : "Tapez pour filtrer par tags...")}
                            value={tagInput}
                            disabled={loadingTags || status?.tier !== 'famille_plus'}
                            title={status?.tier !== 'famille_plus' ? "✨ Fonctionnalité Famille+\nDébloquez les tags pour classer vos fiches,\nretrouver les exercices rapidement\net gagner du temps au quotidien." : ""}
                            onChange={(e) => {
                              setTagInput(e.target.value);
                              setShowTagSuggestions(true);
                            }}
                            onFocus={(e) => {
                              e.preventDefault();
                              window.scrollTo(0, 0);
                              setShowTagSuggestions(true);
                              // Lazy load tags on first focus
                              if (availableTags.length === 0 && !loadingTags) {
                                loadAvailableTags();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const suggestions = getTagSuggestions();
                                if (suggestions.length > 0) {
                                  addTagToFilter(suggestions[0]);
                                } else if (tagInput.trim()) {
                                  // Allow adding custom tag if it doesn't exist
                                  addTagToFilter(tagInput.trim());
                                }
                              }
                              if (e.key === 'Escape') {
                                setShowTagSuggestions(false);
                              }
                            }}
                            style={{ paddingRight: '30px' }}
                          />
                          
                          {/* Clear tag input button */}
                          {tagInput && !loadingTags && (
                            <button
                              onClick={() => {
                                setTagInput('');
                                setShowTagSuggestions(false);
                              }}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                color: '#6c757d',
                                fontSize: '1rem'
                              }}
                              title="Effacer"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                          
                          {/* Loading spinner in input */}
                          {loadingTags && (
                            <div style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}>
                              <Spinner animation="border" size="sm" style={{ width: '14px', height: '14px' }} />
                            </div>
                          )}
                          
                          {/* Tag suggestions dropdown - Phase 4: Enhanced with backend data */}
                          {showTagSuggestions && !loadingTags && (
                            <div 
                              className="position-absolute top-100 start-0 w-100 bg-white border rounded-2 shadow-sm z-3 mt-1" 
                              style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                              {(() => {
                                const suggestions = getTagSuggestions();
                                const allAvailableTags = availableTags.filter(tag => !selectedTags.includes(tag));
                                
                                // If user is typing, show filtered suggestions
                                if (tagInput.trim()) {
                                  if (suggestions.length > 0) {
                                    return suggestions.map((tag, index) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        className="btn btn-link text-start w-100 text-decoration-none py-2 px-3 border-0 d-flex align-items-center gap-2"
                                        style={{ 
                                          fontSize: '0.85rem',
                                          borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                          color: '#212529',
                                          transition: 'background-color 0.15s ease'
                                        }}
                                        onClick={() => addTagToFilter(tag)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                      >
                                        <i className="bi bi-tag" style={{ color: '#6c757d' }}></i>
                                        {tag}
                                      </button>
                                    ));
                                  } else {
                                    return (
                                      <div className="p-3 text-center">
                                        <small className="text-muted">
                                          <i className="bi bi-info-circle me-1"></i>
                                          Aucun tag trouvé pour "{tagInput}"
                                        </small>
                                        <div className="mt-2">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                              if (tagInput.trim()) {
                                                addTagToFilter(tagInput.trim());
                                              }
                                            }}
                                          >
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Ajouter "{tagInput}"
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                } else {
                                  // Show all available tags when focused without typing
                                  if (allAvailableTags.length > 0) {
                                    return (
                                      <>
                                        <div className="px-3 py-2 bg-light border-bottom">
                                          <small className="text-muted fw-semibold">
                                            <i className="bi bi-tags me-1"></i>
                                            Tags disponibles ({allAvailableTags.length})
                                          </small>
                                        </div>
                                        {allAvailableTags.slice(0, 10).map((tag, index) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            className="btn btn-link text-start w-100 text-decoration-none py-2 px-3 border-0 d-flex align-items-center gap-2"
                                            style={{ 
                                              fontSize: '0.85rem',
                                              color: '#212529',
                                              transition: 'background-color 0.15s ease'
                                            }}
                                            onClick={() => addTagToFilter(tag)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                          >
                                            <i className="bi bi-tag" style={{ color: '#6c757d' }}></i>
                                            {tag}
                                          </button>
                                        ))}
                                        {allAvailableTags.length > 10 && (
                                          <div className="px-3 py-2 bg-light text-center border-top">
                                            <small className="text-muted">
                                              Tapez pour rechercher parmi {allAvailableTags.length - 10} autres tags...
                                            </small>
                                          </div>
                                        )}
                                      </>
                                    );
                                  } else if (availableTags.length === 0 && !loadingTags) {
                                    return (
                                      <div className="p-3 text-center text-muted">
                                        <i className="bi bi-tags me-1"></i>
                                        <small>Aucun tag disponible</small>
                                      </div>
                                    );
                                  }
                                }
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Phase 4: Show available tags count */}
                        {!loadingTags && availableTags.length > 0 && selectedTags.length === 0 && !tagInput && (
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-info-circle me-1"></i>
                            {availableTags.length} tag{availableTags.length > 1 ? 's' : ''} disponible{availableTags.length > 1 ? 's' : ''}
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
            
                {/* Phase 5: Active Filters Bar */}
                {!loading && hasActiveFilters() && (
                  <Card 
                    className="mb-3" 
                    style={{ 
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      boxShadow: 'none'
                    }}
                  >
                    <Card.Body className="py-2 px-3">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {/* Header */}
                        <small className="text-muted fw-semibold me-2" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-funnel-fill me-1"></i>
                          Filtres actifs ({getActiveFiltersCount()}):
                        </small>

                        {/* Domain Chip */}
                        {selectedDomain && (
                          <span 
                            className={`badge d-flex align-items-center gap-1 ${styles['tag-chip']}`}
                            style={{
                              backgroundColor: '#e7f3ff',
                              color: '#0056b3',
                              border: '1px solid #b3d9ff',
                              fontSize: '0.8rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="bi bi-book" style={{ fontSize: '0.75rem' }}></i>
                            <span>Domaine: {getDomainLabel(selectedDomain)}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedDomain('')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '4px',
                                color: '#0056b3',
                                fontSize: '1rem',
                                lineHeight: '1',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                              aria-label={`Retirer filtre ${getDomainLabel(selectedDomain)}`}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}

                        {/* Level Chip */}
                        {selectedLevel && (
                          <span 
                            className={`badge d-flex align-items-center gap-1 ${styles['tag-chip']}`}
                            style={{
                              backgroundColor: '#fff3cd',
                              color: '#856404',
                              border: '1px solid #ffc107',
                              fontSize: '0.8rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="bi bi-mortarboard" style={{ fontSize: '0.75rem' }}></i>
                            <span>Niveau: {getLevelLabel(selectedLevel)}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedLevel('')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '4px',
                                color: '#856404',
                                fontSize: '1rem',
                                lineHeight: '1',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                              aria-label={`Retirer filtre ${getLevelLabel(selectedLevel)}`}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}

                        {/* Period Chip (only if not default 'week') */}
                        {selectedTimeRange && selectedTimeRange !== 'week' && (
                          <span 
                            className={`badge d-flex align-items-center gap-1 ${styles['tag-chip']}`}
                            style={{
                              backgroundColor: '#d1ecf1',
                              color: '#0c5460',
                              border: '1px solid #bee5eb',
                              fontSize: '0.8rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="bi bi-calendar-week" style={{ fontSize: '0.75rem' }}></i>
                            <span>Période: {getPeriodLabel()}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedTimeRange('week')} // Reset to default
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '4px',
                                color: '#0c5460',
                                fontSize: '1rem',
                                lineHeight: '1',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                              aria-label={`Retirer filtre ${getPeriodLabel()}`}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}

                        {/* Search Chip */}
                        {searchInput && (
                          <span 
                            className={`badge d-flex align-items-center gap-1 ${styles['tag-chip']}`}
                            style={{
                              backgroundColor: '#f8d7da',
                              color: '#721c24',
                              border: '1px solid #f5c6cb',
                              fontSize: '0.8rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              maxWidth: '250px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={`Recherche: "${searchInput}"`}
                          >
                            <i className="bi bi-search" style={{ fontSize: '0.75rem' }}></i>
                            <span>Recherche: "{searchInput}"</span>
                            <button
                              type="button"
                              onClick={() => setSearchInput('')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '4px',
                                color: '#721c24',
                                fontSize: '1rem',
                                lineHeight: '1',
                                opacity: 0.7,
                                transition: 'opacity 0.2s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                              aria-label="Retirer recherche"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}

                        {/* Tag Chips */}
                        {selectedTags.map(tag => (
                          <span 
                            key={tag}
                            className={`badge d-flex align-items-center gap-1 ${styles['tag-chip']}`}
                            style={{
                              backgroundColor: '#d4edda',
                              color: '#155724',
                              border: '1px solid #c3e6cb',
                              fontSize: '0.8rem',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="bi bi-tag-fill" style={{ fontSize: '0.7rem' }}></i>
                            <span>Tag: {tag}</span>
                            {status?.tier === 'famille_plus' && (
                              <button
                                type="button"
                                onClick={() => removeTagFromFilter(tag)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                  marginLeft: '4px',
                                  color: '#155724',
                                  fontSize: '1rem',
                                  lineHeight: '1',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                                aria-label={`Retirer tag ${tag}`}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            )}
                          </span>
                        ))}

                        {/* Clear All Button */}
                        <button
                          onClick={clearFilters}
                          className={`btn btn-sm ${styles['filter-btn']}`}
                          style={{
                            backgroundColor: 'white',
                            color: '#dc3545',
                            border: '1px solid #dc3545',
                            fontSize: '0.8rem',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontWeight: '500',
                            marginLeft: 'auto'
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Tout effacer
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                )}
            
                {/* Loading state with active filters summary */}
                {loading && hasActiveFilters() && (
                  <Card 
                    className="mb-3" 
                    style={{ 
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      boxShadow: 'none'
                    }}
                  >
                    <Card.Body className="py-2 px-3">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <small className="text-muted fw-semibold me-2" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-funnel-fill me-1"></i>
                          Recherche en cours avec les filtres:
                        </small>

                        {selectedDomain && (
                          <span className="badge" style={{ backgroundColor: '#e7f3ff', color: '#0056b3', fontSize: '0.75rem', fontWeight: '500' }}>
                            <i className="bi bi-journals me-1"></i>
                            {getDomainLabel(selectedDomain)}
                          </span>
                        )}

                        {selectedLevel && (
                          <span className="badge" style={{ backgroundColor: '#fff3cd', color: '#856404', fontSize: '0.75rem', fontWeight: '500' }}>
                            <i className="bi bi-bar-chart-steps me-1"></i>
                            {getLevelLabel(selectedLevel)}
                          </span>
                        )}

                        {selectedTimeRange && selectedTimeRange !== 'week' && (
                          <span className="badge" style={{ backgroundColor: '#d1ecf1', color: '#0c5460', fontSize: '0.75rem', fontWeight: '500' }}>
                            <i className="bi bi-calendar-week me-1"></i>
                            {getPeriodLabel()}
                          </span>
                        )}

                        {searchInput && (
                          <span className="badge" style={{ backgroundColor: '#f8d7da', color: '#721c24', fontSize: '0.75rem', fontWeight: '500' }}>
                            <i className="bi bi-search me-1"></i>
                            "{searchInput}"
                          </span>
                        )}

                        {selectedTags.map(tag => (
                          <span key={tag} className="badge" style={{ backgroundColor: '#d4edda', color: '#155724', fontSize: '0.75rem', fontWeight: '500' }}>
                            <i className="bi bi-tag-fill me-1"></i>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Phase 1.2: Skeleton Loader */}
                {loading && <SkeletonFileCard count={3} />}

                {/* Phase 1.3: Error State */}
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

                {/* Phase 1.3: Empty States with Context */}
                {!loading && !error && filteredFiles.length === 0 && files.length === 0 && showingPeriod === 'week' && (
                  <EmptyState 
                    type="no-recent-files" 
                    onShowAll={loadAllFiles}
                  />
                )}

                {!loading && !error && filteredFiles.length === 0 && files.length === 0 && showingPeriod === 'all' && (
                  <EmptyState type="new-user" />
                )}

                {!loading && !error && files.length > 0 && filteredFiles.length === 0 && (selectedDomain || selectedLevel || selectedTimeRange || selectedTag || selectedTags.length > 0) && (
                  <EmptyState 
                    type="no-filtered-results" 
                    onClearFilters={clearFilters}
                    onShowAll={showingPeriod === 'week' ? loadAllFiles : undefined}
                  />
                )}

                {/* Phase 1.1: Context-aware file counter */}
                {!loading && !error && filteredFiles.length > 0 && (
                  <>
                    <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex flex-column">
                        <small className="text-muted">
                          <strong className={styles['counter-badge']}>{totalCount}</strong> fiche{totalCount > 1 ? 's' : ''} générée{totalCount > 1 ? 's' : ''}
                          {(showingPeriod === 'week' || selectedTimeRange) && (
                            <span className="ms-2" style={{ color: '#6c757d' }}>
                              · <i className="bi bi-calendar-week me-1"></i>
                              {getPeriodLabel()}
                            </span>
                          )}
                        </small>
                        {(selectedDomain || selectedLevel || selectedTimeRange || selectedTag || selectedTags.length > 0) && (
                          <small className="text-muted mt-1">
                            <span className={styles['counter-badge']}>{filteredFiles.length}</span> résultat{filteredFiles.length > 1 ? 's' : ''} correspondant{filteredFiles.length > 1 ? 's' : ''} aux filtres
                          </small>
                        )}
                      </div>
                      
                      {showingPeriod === 'week' && totalCount > files.length && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={loadAllFiles}
                          style={{
                            borderRadius: '8px',
                            fontWeight: '500'
                          }}
                        >
                          <i className="bi bi-clock-history me-2"></i>
                          Afficher tout ({totalCount})
                        </Button>
                      )}
                    </div>

                    {/* List View - One file per row */}
                    <div className="d-flex flex-column gap-3">
                      {filteredFiles.map((file) => {
                        // Determine color theme based on domain
                        const isDomainFrench = file.exercice_domain === 'francais';
                        const borderColor = isDomainFrench ? '#fbbf24' : '#87ceeb';
                        const accentColor = isDomainFrench ? 'rgba(251,191,36,0.08)' : 'rgba(135,206,235,0.08)';
                        const shadowColor = isDomainFrench ? 'rgba(251,191,36,0.15)' : 'rgba(135,206,235,0.15)';
                        
                        return (
                        <Card 
                          key={file.file_id}
                          className={styles['file-card']}
                          style={{ 
                            border: `2px solid ${borderColor}`,
                            borderRadius: '10px',
                            boxShadow: `0 4px 12px ${shadowColor}`,
                            background: `linear-gradient(135deg, ${accentColor} 0%, transparent 100%)`,
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            const element = e.currentTarget as HTMLElement;
                            element.style.boxShadow = `0 6px 16px ${shadowColor}`;
                            element.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            const element = e.currentTarget as HTMLElement;
                            element.style.boxShadow = `0 4px 12px ${shadowColor}`;
                            element.style.transform = 'translateY(0)';
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
                                    
                                    {/* Display custom name if available */}
                                    {file.custom_name && (
                                      <div className="mb-2">
                                        <span style={{ 
                                          fontSize: '0.9rem',
                                          color: '#495057',
                                          fontStyle: 'italic',
                                          backgroundColor: '#e7f3ff',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          border: '1px solid #b3d9ff'
                                        }}>
                                          <i className="bi bi-pencil-square me-1" style={{ fontSize: '0.8rem' }}></i>
                                          {file.custom_name}
                                        </span>
                                      </div>
                                    )}
                                    
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
                                      onClick={() => status?.tier === 'famille_plus' && openTagsModal(file)}
                                      disabled={status?.tier !== 'famille_plus'}
                                      title={status?.tier !== 'famille_plus' ? "✨ Fonctionnalité Famille+\nDébloquez les tags pour classer vos fiches,\nretrouver les exercices rapidement\net gagner du temps au quotidien." : ""}
                                      style={{
                                        backgroundColor: status?.tier !== 'famille_plus' ? '#f3f4f6' : 'white',
                                        color: status?.tier !== 'famille_plus' ? '#9ca3af' : '#495057',
                                        border: '2px solid #dee2e6',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: status?.tier !== 'famille_plus' ? 'default' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500',
                                        opacity: status?.tier !== 'famille_plus' ? 0.6 : 1
                                      }}
                                      onMouseEnter={(e) => {
                                        if (status?.tier === 'famille_plus') {
                                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                                          e.currentTarget.style.borderColor = '#adb5bd';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (status?.tier === 'famille_plus') {
                                          e.currentTarget.style.backgroundColor = 'white';
                                          e.currentTarget.style.borderColor = '#dee2e6';
                                        }
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
                        );
                      })}
                    </div>

                    {/* Phase 2: Backend Pagination - Loading Indicator */}
                    {hasMore && (
                      <div className="text-center mt-4 mb-3">
                        {isLoadingMore ? (
                          <div className="d-flex flex-column align-items-center gap-2">
                            <div className={styles['load-more-spinner']}></div>
                            <small className="text-muted">
                              <span className={styles.pulse}>Chargement page {page + 1}/{totalPages}...</span>
                            </small>
                          </div>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={loadMoreFiles}
                            className={styles['infinite-scroll-loader']}
                            style={{ fontSize: '0.85rem', position: 'relative' }}
                          >
                            <i className="bi bi-arrow-down-circle me-2"></i>
                            Charger plus de fiches ({files.length}/{totalCount})
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Sentinel element for intersection observer */}
                    <div id="scroll-sentinel" style={{ height: '20px' }}></div>

                    {/* Phase 2: All files loaded message */}
                    {!hasMore && files.length > 0 && (
                      <div className={`text-center mt-3 mb-3 ${styles['end-indicator']}`}>
                        <small className="text-muted">
                          <i className="bi bi-check-circle me-1"></i>
                          Toutes les fiches sont affichées ({files.length}/{totalCount})
                        </small>
                      </div>
                    )}
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

                {status?.tier !== 'famille_plus' && (
                  <Alert variant="info" className="mb-3" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div className="d-flex align-items-start">
                      <div style={{
                        fontSize: '2rem',
                        marginRight: '12px',
                        animation: 'bounce 2s infinite'
                      }}>✨</div>
                      <div>
                        <h6 className="mb-2" style={{ fontWeight: '600' }}>Fonctionnalité Famille+ 🌟</h6>
                        <p className="mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                          Débloquez les tags pour classer vos fiches, retrouver les exercices rapidement et gagner du temps au quotidien.
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Ajouter un tag</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={status?.tier !== 'famille_plus' ? "✨ Fonctionnalité Famille+" : "Nouveau tag (max 30 caractères)"}
                      value={newTag}
                      onChange={(e) => status?.tier === 'famille_plus' && setNewTag(e.target.value.slice(0, 30))}
                      onKeyPress={(e) => status?.tier === 'famille_plus' && e.key === 'Enter' && addTag()}
                      onFocus={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}
                      maxLength={30}
                      disabled={status?.tier !== 'famille_plus'}
                      title={status?.tier !== 'famille_plus' ? "Fonctionnalité Famille+ : Débloquez les tags pour classer vos fiches, retrouver les exercices rapidement et gagner du temps au quotidien." : ""}
                    />
                    <Button 
                      variant="primary" 
                      onClick={addTag}
                      disabled={status?.tier !== 'famille_plus' || !newTag.trim() || editingTags.includes(newTag.trim())}
                      className="d-flex align-items-center justify-content-center"
                      style={{ minWidth: '45px', height: '38px', opacity: status?.tier !== 'famille_plus' ? 0.6 : 1 }}
                      title={status?.tier !== 'famille_plus' ? "Fonctionnalité Famille+ : Débloquez les tags pour classer vos fiches, retrouver les exercices rapidement et gagner du temps au quotidien." : ""}
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
                            style={{ fontSize: '0.6rem', filter: 'invert(1)', opacity: status?.tier !== 'famille_plus' ? 0.5 : 1 }}
                            onClick={() => status?.tier === 'famille_plus' && removeTag(tag)}
                            disabled={status?.tier !== 'famille_plus'}
                            title={status?.tier !== 'famille_plus' ? "Fonctionnalité Famille+ : Débloquez les tags pour classer vos fiches, retrouver les exercices rapidement et gagner du temps au quotidien." : ""}
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
              disabled={savingTags || status?.tier !== 'famille_plus'}
              title={status?.tier !== 'famille_plus' ? "Fonctionnalité Famille+ : Débloquez les tags pour classer vos fiches, retrouver les exercices rapidement et gagner du temps au quotidien." : ""}
              style={{ opacity: status?.tier !== 'famille_plus' ? 0.6 : 1 }}
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

        {/* PDF Loading Modal */}
        <Modal 
          show={loadingPdfViewer} 
          centered 
          backdrop="static"
          className="loading-modal"
        >
          <Modal.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 mb-0">Chargement du fichier...</p>
          </Modal.Body>
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
