export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type AnnouncementTargetType = 'all_interns' | 'problem_statement' | 'college' | 'city' | 'batch' | 'selected_intern';
export type AnnouncementReadFilter = 'all' | 'read' | 'unread';
export type AnnouncementSortField = 'published_at' | 'created_at' | 'priority' | 'status';
export type AnnouncementSortDirection = 'asc' | 'desc';

export interface AnnouncementPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
  can_schedule: boolean;
  can_archive: boolean;
  can_manage_targets: boolean;
}

export interface AnnouncementAuthor {
  id: string;
  name: string;
  role: string;
}

export interface AnnouncementReadState {
  is_read: boolean;
  read_at?: string;
}

export interface AnnouncementAttachmentMetadata {
  count: number;
  image_count: number;
  document_count: number;
}

export interface Announcement {
  id: string;
  title: string;
  summary?: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  is_pinned: boolean;
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
  tags: string[];
  author: AnnouncementAuthor;
  read_state: AnnouncementReadState;
  attachments: AnnouncementAttachmentMetadata;
  permissions: AnnouncementPermissions;
}

export interface AnnouncementSummary {
  total: number;
  unread: number;
  read: number;
  important: number;
}

export interface AnnouncementFilters {
  search_text: string | null;
  status: string | null;
  priority: string | null;
  read_filter: string | null;
  is_pinned: boolean | null;
  problem_statement_id: string | null;
  date_from: string | null;
  date_to: string | null;
}

export interface AnnouncementFilterOptions {
  problemStatements: Array<{ id: string; title: string }>;
  statuses: AnnouncementStatus[];
  priorities: AnnouncementPriority[];
  colleges?: Array<{ id: string; name: string }>;
  cities?: Array<{ id: string; name: string }>;
  batches?: Array<{ id: string; name: string }>;
  interns?: Array<{ id: string; name: string }>;
}

export interface AnnouncementPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

export interface AnnouncementResponse {
  rows: Announcement[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: any;
}

export interface AnnouncementAttachmentAccess {
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
}
