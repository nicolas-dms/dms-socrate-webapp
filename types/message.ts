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
