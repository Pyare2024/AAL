export type FeedbackCategory = 'platform_issue' | 'program_suggestion' | 'academic_query' | 'mentor_complaint' | 'other';
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical';
export type FeedbackStatus = 'new' | 'in_progress' | 'awaiting_reply' | 'escalated' | 'resolved' | 'closed';

export interface FeedbackAuthor {
  id: string;
  name: string;
  role: string;
}

export interface FeedbackTicket {
  id: string;
  ticket_number?: string;
  author: FeedbackAuthor;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  title: string;
  description: string;
  assigned_admin_id: string | null;
  is_complaint: boolean;
  complaint_target_admin_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_rating: number | null;
  message_count?: number;
  unread_reply_count?: number;
}

export interface FeedbackMessage {
  id: string;
  ticket_id: string;
  author: FeedbackAuthor;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}

export interface FeedbackAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface FeedbackSummary {
  total: number;
  pending: number;
  resolved: number;
  critical?: number;
  escalated?: number;
}
