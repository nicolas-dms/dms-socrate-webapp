import { apiClient } from './apiClient';

// Types for feedback
export interface FeedbackSubmission {
  type: 'general' | 'bug' | 'feature' | 'improvement';
  rating?: number; // 1-5 stars
  message: string;
  page?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ContextualFeedback {
  context: string; // e.g., 'session-download', 'pdf-viewer', 'filter-usage'
  action: string; // e.g., 'download-pdf', 'view-pdf', 'apply-filter'
  rating: number; // 1-5 stars
  message?: string;
  page: string;
  timestamp: string;
}

class FeedbackService {
  async submitFeedback(feedback: FeedbackSubmission): Promise<boolean> {
    try {
      // In a real application, this would call your backend API
      // For now, we'll simulate the API call and log for development
      console.log('📋 Feedback submitted:', feedback);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store in localStorage for demonstration (in real app, send to backend)
      const existingFeedback = JSON.parse(localStorage.getItem('user_feedback') || '[]');
      existingFeedback.push({
        id: Date.now(),
        ...feedback
      });
      localStorage.setItem('user_feedback', JSON.stringify(existingFeedback));
      
      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  async submitContextualFeedback(feedback: ContextualFeedback): Promise<boolean> {
    try {
      console.log('🎯 Contextual feedback submitted:', feedback);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Store in localStorage for demonstration
      const existingFeedback = JSON.parse(localStorage.getItem('contextual_feedback') || '[]');
      existingFeedback.push({
        id: Date.now(),
        ...feedback
      });
      localStorage.setItem('contextual_feedback', JSON.stringify(existingFeedback));
      
      return true;
    } catch (error) {
      console.error('Failed to submit contextual feedback:', error);
      return false;
    }
  }

  // Get feedback statistics (for admin)
  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    averageRating: number;
    feedbackByType: Record<string, number>;
    recentFeedback: any[];
  }> {
    try {
      const generalFeedback = JSON.parse(localStorage.getItem('user_feedback') || '[]');
      const contextualFeedback = JSON.parse(localStorage.getItem('contextual_feedback') || '[]');
      
      const allFeedback = [...generalFeedback, ...contextualFeedback];
      
      const totalFeedback = allFeedback.length;
      const averageRating = totalFeedback > 0 
        ? allFeedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / totalFeedback 
        : 0;
      
      const feedbackByType = allFeedback.reduce((acc, fb) => {
        const type = fb.type || fb.context || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const recentFeedback = allFeedback
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      return {
        totalFeedback,
        averageRating,
        feedbackByType,
        recentFeedback
      };
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        feedbackByType: {},
        recentFeedback: []
      };
    }
  }
}

export const feedbackService = new FeedbackService();
