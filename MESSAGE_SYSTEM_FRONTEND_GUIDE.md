# Message System - Frontend Integration Guide

Complete guide for integrating the feedback and support message system into your React frontend.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [TypeScript Types](#typescript-types)
4. [API Service Layer](#api-service-layer)
5. [React Components](#react-components)
6. [Usage Examples](#usage-examples)
7. [Admin Panel](#admin-panel)
8. [Best Practices](#best-practices)

---

## Overview

The message system supports two distinct types of user communication:

### **Feedback Messages**
- General comments and suggestions
- No response needed from admin
- No status tracking
- Fire-and-forget

### **Support Messages**
- Requires admin response
- Three types: **bug**, **improvement**, **question**
- Status tracking: `pending` → `in_progress` → `resolved` → `closed`
- Full lifecycle management

---

## API Endpoints

### Base URL
```
http://localhost:8000/api
```

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages` | Submit feedback or support message |
| GET | `/messages` | List user's messages |
| GET | `/messages/{message_id}` | Get specific message details |

### Admin Endpoints

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| GET | `/admin/support-messages` | List all support messages | `X-Admin-Email` |
| PUT | `/admin/support-messages/{message_id}` | Update support message | `X-Admin-Email` |
| GET | `/admin/support-statistics` | Get statistics | `X-Admin-Email` |
| DELETE | `/admin/messages/{message_id}` | Delete message | `X-Admin-Email` |

---

## TypeScript Types

Create a `types/message.ts` file:

```typescript
// Message categories
export enum MessageCategory {
  FEEDBACK = "feedback",
  SUPPORT = "support"
}

// Support message types (only for SUPPORT category)
export enum SupportMessageType {
  BUG = "bug",
  IMPROVEMENT = "improvement",
  QUESTION = "question"
}

// Support message status (only for SUPPORT category)
export enum MessageStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

// Base message interface
export interface Message {
  id: string;
  user_email: string;
  category: MessageCategory;
  support_type?: SupportMessageType;
  status?: MessageStatus;
  subject: string;
  content: string;
  created_at: string;
  updated_at?: string;
  admin_response?: string;
  admin_email?: string;
  responded_at?: string;
  metadata?: Record<string, any>;
}

// Request types
export interface SubmitFeedbackRequest {
  category: MessageCategory.FEEDBACK;
  subject: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SubmitSupportRequest {
  category: MessageCategory.SUPPORT;
  support_type: SupportMessageType;
  subject: string;
  content: string;
  metadata?: Record<string, any>;
}

export type SubmitMessageRequest = SubmitFeedbackRequest | SubmitSupportRequest;

// Response types
export interface MessageListResponse {
  messages: Message[];
  total: number;
  category?: string;
}

export interface SupportStatistics {
  total: number;
  by_status: {
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  by_type: {
    bug: number;
    improvement: number;
    question: number;
  };
}
```

---

## API Service Layer

Create a `services/messageService.ts` file:

```typescript
import axios from 'axios';
import {
  Message,
  MessageListResponse,
  SubmitMessageRequest,
  SupportStatistics,
  MessageStatus
} from '../types/message';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class MessageService {
  /**
   * Submit a feedback or support message
   */
  async submitMessage(
    userEmail: string,
    messageData: SubmitMessageRequest
  ): Promise<Message> {
    const response = await axios.post<Message>(
      `${API_BASE_URL}/messages`,
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
      `${API_BASE_URL}/messages`,
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
      `${API_BASE_URL}/messages/${messageId}`,
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
      `${API_BASE_URL}/admin/support-messages`,
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
      `${API_BASE_URL}/admin/support-messages/${messageId}`,
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
      `${API_BASE_URL}/admin/support-statistics`,
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
      `${API_BASE_URL}/admin/messages/${messageId}`,
      {
        params: { user_email: userEmail },
        headers: { 'X-Admin-Email': adminEmail }
      }
    );
  }
}

export default new MessageService();
```

---

## React Components

### 1. Feedback Form Component

```tsx
import React, { useState } from 'react';
import messageService from '../services/messageService';
import { MessageCategory } from '../types/message';

interface FeedbackFormProps {
  userEmail: string;
  onSuccess?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ userEmail, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await messageService.submitMessage(userEmail, {
        category: MessageCategory.FEEDBACK,
        subject,
        content,
        metadata: {
          browser: navigator.userAgent,
          page: window.location.pathname
        }
      });

      setSuccess(true);
      setSubject('');
      setContent('');
      
      if (onSuccess) {
        onSuccess();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form">
      <h3>📝 Send Feedback</h3>
      <p>Share your thoughts and suggestions with us!</p>

      {success && (
        <div className="alert alert-success">
          ✅ Thank you for your feedback!
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your feedback"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Your Feedback</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us what you think..."
            required
            minLength={10}
            maxLength={5000}
            rows={6}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
};
```

### 2. Support Form Component

```tsx
import React, { useState } from 'react';
import messageService from '../services/messageService';
import { MessageCategory, SupportMessageType } from '../types/message';

interface SupportFormProps {
  userEmail: string;
  onSuccess?: () => void;
}

export const SupportForm: React.FC<SupportFormProps> = ({ userEmail, onSuccess }) => {
  const [supportType, setSupportType] = useState<SupportMessageType>(SupportMessageType.QUESTION);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await messageService.submitMessage(userEmail, {
        category: MessageCategory.SUPPORT,
        support_type: supportType,
        subject,
        content,
        metadata: {
          browser: navigator.userAgent,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      });

      setSuccess(true);
      setSubject('');
      setContent('');
      
      if (onSuccess) {
        onSuccess();
      }

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-form">
      <h3>🆘 Get Support</h3>
      <p>We're here to help! Submit a support request and we'll respond as soon as possible.</p>

      {success && (
        <div className="alert alert-success">
          ✅ Support request submitted! We'll respond via email soon.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="supportType">Request Type</label>
          <select
            id="supportType"
            value={supportType}
            onChange={(e) => setSupportType(e.target.value as SupportMessageType)}
            required
          >
            <option value={SupportMessageType.QUESTION}>❓ Question</option>
            <option value={SupportMessageType.BUG}>🐛 Bug Report</option>
            <option value={SupportMessageType.IMPROVEMENT}>💡 Feature Request</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Details</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Please provide as much detail as possible..."
            required
            minLength={10}
            maxLength={5000}
            rows={8}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
        </button>
      </form>
    </div>
  );
};
```

### 3. Message List Component

```tsx
import React, { useEffect, useState } from 'react';
import messageService from '../services/messageService';
import { Message, MessageCategory } from '../types/message';

interface MessageListProps {
  userEmail: string;
  category?: 'feedback' | 'support';
}

export const MessageList: React.FC<MessageListProps> = ({ userEmail, category }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [userEmail, category]);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await messageService.listUserMessages(userEmail, category);
      setMessages(response.messages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const badges: Record<string, string> = {
      pending: '🟡 Pending',
      in_progress: '🔵 In Progress',
      resolved: '🟢 Resolved',
      closed: '⚫ Closed'
    };
    return status ? badges[status] || status : '';
  };

  const getTypeBadge = (type?: string) => {
    const badges: Record<string, string> = {
      bug: '🐛 Bug',
      improvement: '💡 Feature Request',
      question: '❓ Question'
    };
    return type ? badges[type] || type : '';
  };

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <p>No messages yet.</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      <h3>Your Messages ({messages.length})</h3>
      
      {messages.map((message) => (
        <div key={message.id} className="message-card">
          <div className="message-header">
            <h4>{message.subject}</h4>
            <span className="message-category">
              {message.category === MessageCategory.FEEDBACK ? '📝 Feedback' : '🆘 Support'}
            </span>
          </div>

          <div className="message-meta">
            {message.support_type && (
              <span className="badge">{getTypeBadge(message.support_type)}</span>
            )}
            {message.status && (
              <span className="badge">{getStatusBadge(message.status)}</span>
            )}
            <span className="message-date">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>

          <p className="message-content">{message.content}</p>

          {message.admin_response && (
            <div className="admin-response">
              <strong>Admin Response:</strong>
              <p>{message.admin_response}</p>
              {message.responded_at && (
                <small>Responded on {new Date(message.responded_at).toLocaleDateString()}</small>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## Usage Examples

### Simple Feedback Page

```tsx
import React from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { useAuth } from '../hooks/useAuth'; // Your auth hook

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1>Send Us Feedback</h1>
      <FeedbackForm 
        userEmail={user.email}
        onSuccess={() => {
          // Optional: show toast notification, redirect, etc.
          console.log('Feedback submitted successfully!');
        }}
      />
    </div>
  );
};
```

### Combined Support Page

```tsx
import React, { useState } from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { SupportForm } from '../components/SupportForm';
import { MessageList } from '../components/MessageList';
import { useAuth } from '../hooks/useAuth';

type TabType = 'feedback' | 'support' | 'history';

export const HelpCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('feedback');

  return (
    <div className="help-center">
      <h1>Help Center</h1>

      <div className="tabs">
        <button
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          📝 Feedback
        </button>
        <button
          className={activeTab === 'support' ? 'active' : ''}
          onClick={() => setActiveTab('support')}
        >
          🆘 Get Support
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📋 Message History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'feedback' && (
          <FeedbackForm 
            userEmail={user.email}
            onSuccess={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'support' && (
          <SupportForm 
            userEmail={user.email}
            onSuccess={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <MessageList userEmail={user.email} />
        )}
      </div>
    </div>
  );
};
```

---

## Admin Panel

### Admin Dashboard Component

```tsx
import React, { useEffect, useState } from 'react';
import messageService from '../services/messageService';
import { Message, MessageStatus, SupportStatistics } from '../types/message';

export const AdminDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<SupportStatistics | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MessageStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  
  const adminEmail = 'admin@example.com'; // Get from auth context

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [messagesData, statsData] = await Promise.all([
        messageService.listAllSupportMessages(adminEmail, selectedStatus),
        messageService.getSupportStatistics(adminEmail)
      ]);
      setMessages(messagesData.messages);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    messageId: string,
    userEmail: string,
    newStatus: MessageStatus,
    adminResponse?: string
  ) => {
    try {
      await messageService.updateSupportMessage(
        messageId,
        userEmail,
        adminEmail,
        { status: newStatus, admin_response: adminResponse }
      );
      loadData(); // Reload data
    } catch (error) {
      console.error('Failed to update message', error);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Support Dashboard</h1>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Support Requests</p>
          </div>
          <div className="stat-card">
            <h3>{stats.by_status.pending}</h3>
            <p>🟡 Pending</p>
          </div>
          <div className="stat-card">
            <h3>{stats.by_status.in_progress}</h3>
            <p>🔵 In Progress</p>
          </div>
          <div className="stat-card">
            <h3>{stats.by_status.resolved}</h3>
            <p>🟢 Resolved</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="filters">
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(e.target.value as MessageStatus || undefined)}
        >
          <option value="">All Status</option>
          <option value={MessageStatus.PENDING}>Pending</option>
          <option value={MessageStatus.IN_PROGRESS}>In Progress</option>
          <option value={MessageStatus.RESOLVED}>Resolved</option>
          <option value={MessageStatus.CLOSED}>Closed</option>
        </select>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="support-messages">
          {messages.map((message) => (
            <AdminMessageCard
              key={message.id}
              message={message}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Best Practices

### 1. **Error Handling**
Always handle API errors gracefully:
```typescript
try {
  await messageService.submitMessage(userEmail, data);
} catch (error: any) {
  if (error.response?.status === 400) {
    // Validation error
    setError(error.response.data.detail);
  } else if (error.response?.status === 500) {
    // Server error
    setError('Server error. Please try again later.');
  } else {
    // Network error
    setError('Network error. Check your connection.');
  }
}
```

### 2. **Metadata Collection**
Include helpful context in metadata:
```typescript
metadata: {
  browser: navigator.userAgent,
  page: window.location.pathname,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  screenSize: `${window.innerWidth}x${window.innerHeight}`
}
```

### 3. **Form Validation**
Validate on the frontend before submission:
- Subject: 3-200 characters
- Content: 10-5000 characters
- Support type: Required for support messages

### 4. **User Experience**
- Show success/error messages clearly
- Disable submit button during submission
- Clear form after successful submission
- Redirect to message history after submission

### 5. **Admin Authentication**
Replace `X-Admin-Email` header with proper authentication:
```typescript
const token = getAuthToken(); // Your auth method
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Admin-Email': adminEmail
}
```

---

## CSS Styling Example

```css
/* Feedback/Support Forms */
.feedback-form, .support-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

/* Message Cards */
.message-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.message-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  background: #f0f0f0;
}

.admin-response {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 3px solid #007bff;
  border-radius: 4px;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Testing

### Manual Testing Steps

1. **Submit Feedback:**
   - Fill form with valid data
   - Submit and verify success message
   - Check message appears in history

2. **Submit Support Request:**
   - Try all three types (bug, improvement, question)
   - Verify status is set to "pending"
   - Check message appears in support list

3. **Validation Testing:**
   - Try submitting with empty fields
   - Try very short/long content
   - Verify error messages display

4. **Admin Testing:**
   - Load admin dashboard
   - Update message status
   - Add admin response
   - Verify updates persist

---

## Environment Variables

Add to your `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

For production:
```env
REACT_APP_API_URL=https://your-domain.com/api
```

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Ensure backend CORS is configured for your frontend URL.

### Issue: 422 Validation Error
**Solution:** Check that support messages include `support_type` and feedback messages don't.

### Issue: Message Not Found (404)
**Solution:** Verify you're passing the correct `user_email` query parameter.

### Issue: Admin Endpoints Return 401
**Solution:** Ensure `X-Admin-Email` header is set for all admin requests.

---

## Summary

You now have everything needed to integrate the message system:

✅ Complete TypeScript types  
✅ API service layer with all endpoints  
✅ Ready-to-use React components  
✅ Admin dashboard example  
✅ Best practices and error handling  
✅ CSS styling examples  

Start by integrating the **FeedbackForm** component, then add **SupportForm** and **MessageList** as needed!
