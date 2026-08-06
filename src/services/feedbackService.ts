import { supabase } from '../lib/supabase';
import { FeedbackTicket, FeedbackSummary, FeedbackMessage } from '../types/feedbackTypes';

export const feedbackService = {
  async getFeedbackSummary(): Promise<FeedbackSummary> {
    const { data, error } = await supabase.rpc('get_feedback_summary');
    if (error) throw new Error(error.message);
    return data as FeedbackSummary;
  },

  async fetchFeedbackTickets(params: {
    status?: string | null;
    priority?: string | null;
    search?: string | null;
    type?: string | null;
    category?: string | null;
    problem_statement_id?: string | null;
    assigned_to_me?: boolean | null;
    date_from?: string | null;
    date_to?: string | null;
    page?: number;
    pageSize?: number;
  }): Promise<{ rows: FeedbackTicket[], total_count: number, page: number, page_size: number, total_pages: number }> {
    const { data, error } = await supabase.rpc('get_feedback_tickets', {
      p_search_text: params.search || null,
      p_status: params.status && params.status !== 'all' ? params.status : null,
      p_priority: params.priority && params.priority !== 'all' ? params.priority : null,
      p_type: params.type && params.type !== 'all' ? params.type : null,
      p_category: params.category && params.category !== 'all' ? params.category : null,
      p_problem_statement_id: params.problem_statement_id || null,
      p_assigned_to_me: params.assigned_to_me ?? null,
      p_date_from: params.date_from || null,
      p_date_to: params.date_to || null,
      p_page: params.page || 1,
      p_page_size: params.pageSize || 20
    });

    if (error) throw new Error(error.message);

    return {
      rows: (data.rows || []).map((row: any) => ({
        id: row.id,
        ticket_number: row.ticket_number,
        author: {
          id: row.author_id,
          name: row.author_name,
          role: row.author_role
        },
        category: row.category,
        priority: row.priority,
        status: row.status,
        title: row.title,
        description: row.description,
        assigned_admin_id: row.assigned_admin_id,
        is_complaint: row.is_complaint,
        complaint_target_admin_id: row.complaint_target_admin_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        resolved_at: row.resolved_at,
        resolution_rating: row.resolution_rating,
        message_count: row.message_count,
        unread_reply_count: row.unread_reply_count
      })),
      total_count: data.total_count,
      page: data.page,
      page_size: data.page_size,
      total_pages: data.total_pages
    };
  },

  async fetchFeedbackTicketById(ticketId: string): Promise<FeedbackTicket> {
    const { data, error } = await supabase.rpc('get_feedback_ticket_by_id', {
      p_ticket_id: ticketId
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Ticket not found");

    return {
      id: data.id,
      ticket_number: data.ticket_number,
      author: {
        id: data.author_id,
        name: data.author_name,
        role: data.author_role
      },
      category: data.category,
      priority: data.priority,
      status: data.status,
      title: data.title,
      description: data.description,
      assigned_admin_id: data.assigned_admin_id,
      is_complaint: data.is_complaint,
      complaint_target_admin_id: data.complaint_target_admin_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      resolved_at: data.resolved_at,
      resolution_rating: data.resolution_rating
    } as FeedbackTicket;
  },

  async createFeedbackTicket(params: {
    category: string;
    priority: string;
    title: string;
    description: string;
    is_complaint?: boolean;
    complaint_target_admin_id?: string;
    request_id?: string;
  }): Promise<FeedbackTicket> {
    const { data, error } = await supabase.rpc('create_feedback_ticket', {
      p_category: params.category,
      p_priority: params.priority,
      p_title: params.title,
      p_description: params.description,
      p_is_complaint: params.is_complaint || false,
      p_complaint_target_admin_id: params.complaint_target_admin_id || null,
      p_request_id: params.request_id || null
    });

    if (error) throw new Error(error.message);
    
    return {
      id: data.id,
      ticket_number: data.ticket_number,
      author: {
        id: data.author_id,
        name: data.author_name || 'Me (Display Only)', // Simplified RPC return doesn't join profile on insert
        role: data.author_role || 'intern' // Display-only fallback, true role is fetched on refresh
      },
      category: data.category,
      priority: data.priority,
      status: data.status,
      title: data.title,
      description: data.description,
      assigned_admin_id: data.assigned_admin_id,
      is_complaint: data.is_complaint,
      complaint_target_admin_id: data.complaint_target_admin_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      resolved_at: data.resolved_at,
      resolution_rating: data.resolution_rating
    } as FeedbackTicket;
  },

  async fetchFeedbackMessages(ticketId: string): Promise<FeedbackMessage[]> {
    const { data, error } = await supabase.rpc('get_feedback_messages', {
      p_ticket_id: ticketId
    });
    if (error) throw new Error(error.message);
    
    return (data || []).map((row: any) => ({
      id: row.id,
      ticket_id: row.ticket_id,
      author: {
        id: row.author_id,
        name: row.author_name,
        role: row.author_role
      },
      content: row.content,
      is_internal_note: row.is_internal_note,
      created_at: row.created_at
    }));
  },

  async updateFeedbackStatus(ticketId: string, status: string, reason?: string) {
    const { data, error } = await supabase.rpc('update_feedback_status', {
      p_ticket_id: ticketId,
      p_new_status: status
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data) {
      throw new Error('Status update failed: no response from server');
    }
    
    return data;
  },

  async addFeedbackReply(ticketId: string, content: string, isInternal: boolean = false): Promise<FeedbackMessage> {
    const { data, error } = await supabase.rpc('add_feedback_reply', {
      p_ticket_id: ticketId,
      p_content: content,
      p_is_internal: isInternal
    });
    if (error) throw new Error(error.message);
    
    return {
      id: data.id,
      ticket_id: data.ticket_id,
      author: {
        id: data.author_id,
        name: data.author_name,
        role: data.author_role
      },
      content: data.content,
      is_internal_note: data.is_internal_note,
      created_at: data.created_at
    };
  }
};
