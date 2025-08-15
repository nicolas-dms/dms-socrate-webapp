import api from './api';
import { debugLog } from '../utils/debug';

// Interface pour les fichiers PDF générés
export interface GeneratedFile {
  file_id: string;
  parcours_id: string | null;
  filename: string;
  filepath: string;
  class_level: string;
  exercice_time: string;
  exercice_domain: string;
  exercice_types: string[];
  exercice_type_params: {
    [key: string]: {
      [param: string]: any;
    };
  };
  created_at: string;
  created_by: string | null;
  download_count: number;
  tags: string[];
}

// Interface pour la réponse de téléchargement du backend
export interface DownloadResponse {
  download_url: string;
  filename: string;
  file_id: string;
  expires_in_hours: string;
  download_count: string;
}

export const filesService = {
  // Get user's generated files
  getUserFiles: async (userId: string): Promise<GeneratedFile[]> => {
    try {
      debugLog.user('Getting user files', { userId });
      const response = await api.get<GeneratedFile[]>(`/api/education/exercises/files/${userId}`);
      debugLog.user('User files retrieved', { count: response.data.length });
      
      // Sort by creation date (newest first)
      const sortedFiles = response.data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return sortedFiles;
    } catch (error) {
      debugLog.error('Failed to get user files', error);
      throw error;
    }
  },

  // Download a specific file using backend download endpoint
  downloadFile: async (file: GeneratedFile, userId: string): Promise<void> => {
    try {
      console.log('🔄 Starting download process:', { filename: file.filename, userId });
      debugLog.user('Requesting download via backend proxy', { filename: file.filename, userId });
      
      // Use new backend endpoint with userId and filename
      const encodedUserId = encodeURIComponent(userId);
      const encodedFilename = encodeURIComponent(file.filename);
      const downloadUrl = `/api/education/exercises/files/${encodedUserId}/${encodedFilename}/download`;
      
      console.log('📡 Downloading via backend proxy:', downloadUrl);
      
      const response = await api.get(downloadUrl, {
        responseType: 'blob' // Get the file as blob directly
      });
      
      console.log('✅ File received from backend:', { 
        size: response.data.size, 
        type: response.data.type || 'application/pdf',
        headers: response.headers
      });
      
      // Create download link
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header if available, otherwise use original filename
      let downloadFilename = file.filename;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Download completed successfully:', downloadFilename);
      debugLog.user('File downloaded successfully', { 
        filename: downloadFilename,
        size: blob.size
      });
    } catch (error) {
      console.error('❌ Download failed:', error);
      debugLog.error('Failed to download file', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: file.filename,
        userId
      });
      throw error;
    }
  },

  // Get file statistics
  getFileStats: (files: GeneratedFile[]): {
    total: number;
    byDomain: Record<string, number>;
    byLevel: Record<string, number>;
    totalDownloads: number;
  } => {
    const stats = {
      total: files.length,
      byDomain: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      totalDownloads: 0
    };

    files.forEach(file => {
      // Count by domain
      stats.byDomain[file.exercice_domain] = (stats.byDomain[file.exercice_domain] || 0) + 1;
      
      // Count by level
      stats.byLevel[file.class_level] = (stats.byLevel[file.class_level] || 0) + 1;
      
      // Sum downloads
      stats.totalDownloads += file.download_count;
    });

    return stats;
  },

  // Format file creation date
  formatDate: (dateString: string, locale: string = 'fr-FR'): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get exercise type icon
  getExerciseIcon: (type: string): string => {
    const iconMap: Record<string, string> = {
      'lecture': '📖',
      'comprehension': '💡',
      'grammaire': '📚',
      'conjugaison': '🔄',
      'vocabulaire': '💬',
      'orthographe': '✏️'
    };
    
    return iconMap[type] || '📝';
  },

  // Get level badge color
  getLevelBadgeColor: (level: string): string => {
    const colorMap: Record<string, string> = {
      'cp': 'primary',
      'ce1': 'success',
      'ce2': 'info',
      'cm1': 'warning',
      'cm2': 'danger'
    };
    
    return colorMap[level.toLowerCase()] || 'secondary';
  },

  // Update tags for a file
  updateTags: async (userId: string, fileId: string, tags: string[]): Promise<void> => {
    try {
      debugLog.user('Updating file tags', { userId, fileId, tags });
      const endpoint = `/api/education/exercises/files/${userId}/${fileId}/tags`;
      const payload = { tags };
      debugLog.user('Making PUT request', { endpoint, payload });
      
      await api.put(endpoint, payload);
      debugLog.user('File tags updated successfully');
    } catch (error) {
      debugLog.error('Failed to update file tags', error);
      throw error;
    }
  }
};
