import { supabase } from '../lib/supabase';
import {
  Announcement,
  AnnouncementResponse,
  AnnouncementSummary,
  AnnouncementFilterOptions,
  AnnouncementAttachmentAccess
} from '../types/announcementTypes';

export const announcementService = {
  async fetchAnnouncements(params: {
    search_text?: string | null;
    status?: string | null;
    priority?: string | null;
    read_filter?: string | null;
    is_pinned?: boolean | null;
    problem_statement_id?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_direction?: string;
  }): Promise<AnnouncementResponse> {
    const rpcParams: Record<string, any> = {};

    if (params.search_text && params.search_text !== 'all') rpcParams.p_search_text = params.search_text;
    if (params.status && params.status !== 'all') rpcParams.p_status = params.status;
    if (params.priority && params.priority !== 'all') rpcParams.p_priority = params.priority;
    if (params.read_filter && params.read_filter !== 'all') rpcParams.p_read_filter = params.read_filter;
    if (params.is_pinned !== undefined && params.is_pinned !== null) rpcParams.p_is_pinned = params.is_pinned;
    if (params.problem_statement_id && params.problem_statement_id !== 'all') rpcParams.p_problem_statement_id = params.problem_statement_id;
    if (params.date_from) rpcParams.p_date_from = params.date_from;
    if (params.date_to) rpcParams.p_date_to = params.date_to;
    
    rpcParams.p_page = params.page || 1;
    rpcParams.p_page_size = params.page_size || 20;
    rpcParams.p_sort_by = params.sort_by || 'published_at';
    rpcParams.p_sort_direction = params.sort_direction || 'desc';

    const { data, error } = await supabase.rpc('get_announcements', rpcParams);

    if (error) {
      throw new Error(error.message);
    }
    return data as AnnouncementResponse;
  },

  async fetchAnnouncementById(announcementId: string): Promise<Announcement> {
    const { data, error } = await supabase.rpc('get_announcement_by_id', {
      p_announcement_id: announcementId
    });

    if (error) {
      throw new Error(error.message);
    }
    return data as Announcement;
  },

  async fetchAnnouncementSummary(): Promise<AnnouncementSummary> {
    const { data, error } = await supabase.rpc('get_announcement_summary');

    if (error) {
      throw new Error(error.message);
    }
    return data as AnnouncementSummary;
  },

  async fetchAnnouncementFilterOptions(): Promise<AnnouncementFilterOptions> {
    const { data, error } = await supabase.rpc('get_announcement_filter_options');

    if (error) {
      throw new Error(error.message);
    }
    return data as AnnouncementFilterOptions;
  },

  async markAsRead(announcementId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_announcement_read', {
      p_announcement_id: announcementId
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async markAsUnread(announcementId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_announcement_unread', {
      p_announcement_id: announcementId
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async getAttachmentAccess(attachmentId: string): Promise<AnnouncementAttachmentAccess & { signed_url?: string }> {
    const { data: metadata, error: metadataError } = await supabase.rpc('get_announcement_attachment_url', {
      p_attachment_id: attachmentId
    });

    if (metadataError) throw new Error(metadataError.message);

    // Call Supabase Edge Function to securely retrieve the signed URL based on storage path
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('announcement-signed-url', {
      body: { storage_path: metadata.storage_path },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to retrieve secure attachment URL');
    }
    return { ...metadata, signed_url: data.signed_url };
  },

  // Role-ready Administrative wrappers matching backend exact signatures

  async createAnnouncement(params: {
    title: string;
    content: string;
    targets: any;
    scheduledAt?: string;
    expiresAt?: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_announcement', {
      p_title: params.title,
      p_summary: '',
      p_content: params.content,
      p_priority: 'normal',
      p_tags: [],
      p_targets: params.targets,
      p_scheduled_at: params.scheduledAt || null,
      p_expires_at: params.expiresAt || null
    });

    if (error) throw new Error(error.message);
    
    const createdId = typeof data === 'string' ? data : data?.id;
    if (!createdId) {
      throw new Error('Backend did not return the created announcement ID');
    }
    
    return createdId;
  },

  async updateAnnouncement(params: {
    id: string;
    title: string;
    content: string;
    targets: any;
  }): Promise<void> {
    const { error } = await supabase.rpc('update_announcement', {
      p_id: params.id,
      p_title: params.title,
      p_summary: '',
      p_content: params.content,
      p_priority: 'normal',
      p_tags: [],
      p_targets: params.targets
    });

    if (error) throw new Error(error.message);
  },

  async publishAnnouncement(id: string): Promise<void> {
    if (!id) {
      throw new Error('Announcement ID is required for publishing');
    }
    const { error } = await supabase.rpc('publish_announcement', { p_id: id });
    if (error) throw new Error(error.message);
  },

  async archiveAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.rpc('archive_announcement', { p_id: id });
    if (error) throw new Error(error.message);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.rpc('delete_announcement', { p_id: id });
    if (error) throw new Error(error.message);
  },

  async duplicateAnnouncement(id: string): Promise<string> {
    const { data, error } = await supabase.rpc('duplicate_announcement', { p_announcement_id: id });
    if (error) throw new Error(error.message);
    return data;
  },

  async getAnnouncementAnalytics(id: string): Promise<{
    targeted_count: number;
    read_count: number;
    unread_count: number;
    read_percentage: number;
    last_read_at: string | null;
  }> {
    const { data, error } = await supabase.rpc('get_announcement_read_analytics', { p_announcement_id: id });
    if (error) throw new Error(error.message);
    return data;
  },

  // Attachment upload to storage
  async uploadAttachment(filePath: string, file: File): Promise<void> {
    const { error } = await supabase.storage
      .from('announcement-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);
  },

  // Insert metadata using secure RPC
  async createAttachmentMetadata(params: {
    announcementId: string;
    attachmentType: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }): Promise<{ id: string; storage_path: string }> {
    const { data, error } = await supabase.rpc('create_announcement_attachment', {
      p_announcement_id: params.announcementId,
      p_attachment_type: params.attachmentType,
      p_storage_path: params.storagePath,
      p_file_name: params.fileName,
      p_mime_type: params.mimeType,
      p_file_size: params.fileSize
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Remove attachment using secure RPC (storage object removal must also be done or handled by a db trigger)
  async removeAttachment(attachmentId: string, storagePath: string): Promise<void> {
    const { error: dbError } = await supabase.rpc('delete_announcement_attachment', {
      p_attachment_id: attachmentId
    });

    if (dbError) throw new Error(dbError.message);

    // Also remove from storage bucket
    const { error: storageError } = await supabase.storage
      .from('announcement-assets')
      .remove([storagePath]);

    if (storageError) console.error('Failed to remove storage object:', storageError);
  }
};
