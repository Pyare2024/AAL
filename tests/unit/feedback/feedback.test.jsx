import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedbackService } from '../../../src/services/feedbackService';
import { supabase } from '../../../src/lib/supabase';

vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('Feedback Module Core Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get_feedback_tickets should map correctly and include pagination and filter logic', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        rows: [{
          id: '1',
          ticket_number: 'FB-20260804-00001',
          author_id: 'intern1',
          author_name: 'Intern One',
          author_role: 'intern',
          title: 'Test Ticket',
          status: 'new',
        }],
        total_count: 1,
        page: 1,
        page_size: 20,
        total_pages: 1
      },
      error: null
    });

    const result = await feedbackService.fetchFeedbackTickets({ status: 'new' });
    
    expect(supabase.rpc).toHaveBeenCalledWith('get_feedback_tickets', expect.objectContaining({
      p_status: 'new'
    }));
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].ticket_number).toBe('FB-20260804-00001');
    expect(result.rows[0].author.role).toBe('intern');
  });

  it('createFeedbackTicket should pass request_id for idempotency and create ticket securely', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        id: '123',
        ticket_number: 'FB-20260804-00002',
        title: 'New Suggestion'
      },
      error: null
    });

    const result = await feedbackService.createFeedbackTicket({
      category: 'program_suggestion',
      priority: 'low',
      title: 'New Suggestion',
      description: 'Desc',
      is_complaint: false,
      request_id: 'some-uuid'
    });

    expect(supabase.rpc).toHaveBeenCalledWith('create_feedback_ticket', expect.objectContaining({
      p_request_id: 'some-uuid',
      p_is_complaint: false
    }));
    expect(result.id).toBe('123');
  });

  it('fetchFeedbackMessages should return messages hiding internal notes based on backend filtering', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{
        id: 'msg1',
        content: 'Public reply',
        is_internal_note: false
      }],
      error: null
    });

    const msgs = await feedbackService.fetchFeedbackMessages('123');
    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe('Public reply');
  });
  
  it('addFeedbackReply should insert a message securely via RPC', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        id: 'msg2',
        ticket_id: '123',
        content: 'My reply'
      },
      error: null
    });

    const msg = await feedbackService.addFeedbackReply('123', 'My reply', false);
    expect(supabase.rpc).toHaveBeenCalledWith('add_feedback_reply', expect.objectContaining({
      p_content: 'My reply',
      p_is_internal: false
    }));
    expect(msg.content).toBe('My reply');
  });
});
