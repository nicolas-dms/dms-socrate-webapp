import axios from 'axios';
import {
  Message,
  MessageListResponse,
  SubmitMessageRequest,
  SupportStatistics,
  MessageStatus
} from '../types/message';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class MessageService {
  /**
   * Submit a feedback or support message
   */
  async submitMessage(
    userEmail: string,
    messageData: SubmitMessageRequest
  ): Promise<Message> {
    const response = await axios.post<Message>(
      `${API_BASE_URL}/api/messages`,
      messageData,
      {
        params: { user_email: userEmail }
      }
    );
    return response.data;
  }

  /**
   * List user's messages
   */
  async listUserMessages(
    userEmail: string,
    category?: 'feedback' | 'support',
    limit: number = 50
  ): Promise<MessageListResponse> {
    const response = await axios.get<MessageListResponse>(
      `${API_BASE_URL}/api/messages`,
      {
        params: {
          user_email: userEmail,
          category,
          limit
        }
      }
    );
    return response.data;
  }

  /**
   * Get a specific message
   */
  async getMessage(
    messageId: string,
    userEmail: string
  ): Promise<Message> {
    const response = await axios.get<Message>(
      `${API_BASE_URL}/api/messages/${messageId}`,
      {
        params: { user_email: userEmail }
      }
    );
    return response.data;
  }

  // ========== ADMIN METHODS ==========

  /**
   * List all support messages (admin only)
   */
  async listAllSupportMessages(
    adminEmail: string,
    status?: MessageStatus,
    limit: number = 100
  ): Promise<MessageListResponse> {
    const response = await axios.get<MessageListResponse>(
      `${API_BASE_URL}/api/admin/support-messages`,
      {
        params: { status, limit },
        headers: { 'X-Admin-Email': adminEmail }
      }
    );
    return response.data;
  }

  /**
   * Update a support message (admin only)
   */
  async updateSupportMessage(
    messageId: string,
    userEmail: string,
    adminEmail: string,
    updates: {
      status?: MessageStatus;
      admin_response?: string;
    }
  ): Promise<Message> {
    const response = await axios.put<Message>(
      `${API_BASE_URL}/api/admin/support-messages/${messageId}`,
      updates,
      {
        params: { user_email: userEmail },
        headers: { 'X-Admin-Email': adminEmail }
      }
    );
    return response.data;
  }

  /**
   * Get support statistics (admin only)
   */
  async getSupportStatistics(
    adminEmail: string
  ): Promise<SupportStatistics> {
    const response = await axios.get<SupportStatistics>(
      `${API_BASE_URL}/api/admin/support-statistics`,
      {
        headers: { 'X-Admin-Email': adminEmail }
      }
    );
    return response.data;
  }

  /**
   * Delete a message (admin only)
   */
  async deleteMessage(
    messageId: string,
    userEmail: string,
    adminEmail: string
  ): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/admin/messages/${messageId}`,
      {
        params: { user_email: userEmail },
        headers: { 'X-Admin-Email': adminEmail }
      }
    );
  }
}

export default new MessageService();
