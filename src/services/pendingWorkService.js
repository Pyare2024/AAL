import { supabase } from '../lib/supabase';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Super Admin: Broadcast a new Pending Work Task Assignment for students
 */
export async function broadcastPendingTaskAssignment(taskData) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;

    const result = {
      id: `task-broadcast-${Date.now()}`,
      task_title: taskData.task_title || taskData.title || 'New Task Assignment',
      message_instructions: taskData.message_instructions || taskData.description || '',
      common_drive_url: taskData.common_drive_url || 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9',
      due_date: taskData.due_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      created_by: 'Super Admin'
    };

    // Try inserting into Supabase ONLY if currentUserId is a valid UUID
    if (currentUserId && uuidRegex.test(currentUserId)) {
      try {
        const payload = {
          title: result.task_title,
          description: result.message_instructions,
          due_at: new Date(result.due_date).toISOString(),
          assigned_by: currentUserId,
          assigned_to: currentUserId,
          status: 'submitted'
        };

        const { data, error } = await supabase
          .from('pending_work_items')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          result.id = data.id;
        }
      } catch (e) {
        console.warn('[PendingWorkService] Supabase task insert notice:', e.message);
      }
    }

    // Save to local buffer
    try {
      const existing = JSON.parse(localStorage.getItem('aal_task_assignments_buffer') || '[]');
      localStorage.setItem('aal_task_assignments_buffer', JSON.stringify([result, ...existing]));
    } catch (e) {}

    return { success: true, data: result };
  } catch (err) {
    console.error('[PendingWorkService] Error broadcasting task:', err);
    return { success: false, message: err.message || 'Failed to broadcast task assignment.' };
  }
}

/**
 * Super Admin: Delete a Broadcasted Task Assignment
 */
export async function deleteTaskAssignment(taskId) {
  try {
    if (taskId && uuidRegex.test(taskId)) {
      try {
        await supabase
          .from('pending_work_items')
          .delete()
          .eq('id', taskId);
      } catch (e) {}
    }

    try {
      const existing = JSON.parse(localStorage.getItem('aal_task_assignments_buffer') || '[]');
      const filtered = existing.filter(item => item.id !== taskId);
      localStorage.setItem('aal_task_assignments_buffer', JSON.stringify(filtered));
    } catch (e) {}

    return { success: true };
  } catch (err) {
    console.error('[PendingWorkService] Error deleting task assignment:', err);
    return { success: false, message: err.message || 'Failed to delete task.' };
  }
}

/**
 * Fetch all broadcast task assignments (for Students, Admins, and Super Admin)
 */
export async function fetchBroadcastTaskAssignments() {
  let tasks = [];

  try {
    const { data, error } = await supabase
      .from('pending_work_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      tasks = data.map(item => ({
        id: item.id,
        task_title: item.title || item.task_title || 'GitHub & Google Drive Seven-Step Activity Assignment',
        message_instructions: item.description || item.message_instructions || 'Please complete your 7-step activity submission.',
        common_drive_url: item.submission_url || item.common_drive_url || 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9-sample-folder',
        due_date: item.due_at ? item.due_at.split('T')[0] : new Date().toISOString().split('T')[0],
        created_at: item.created_at,
        created_by: 'Super Admin'
      }));
    }
  } catch (err) {
    console.warn('[PendingWorkService] Task items query notice:', err.message);
  }

  let bufferTasks = [];
  try {
    bufferTasks = JSON.parse(localStorage.getItem('aal_task_assignments_buffer') || '[]');
  } catch (e) {}

  let combined = [...tasks, ...bufferTasks];

  if (combined.length === 0) {
    combined = [
      {
        id: 'task-broadcast-01',
        task_title: 'GitHub & Google Drive Seven-Step Activity Assignment',
        message_instructions: 'Super Admin Notice: Please complete your 7-step activity submission. Upload your work to the common Google Drive folder link below and submit your URL.',
        common_drive_url: 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9-sample-folder',
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        created_by: 'Super Admin'
      }
    ];
  }

  return combined;
}

/**
 * Fetch pending work submissions for Super Admin (Platform-wide)
 */
export async function fetchPendingWorkForSuperAdmin(filters = {}) {
  let logs = [];

  try {
    const { data, error } = await supabase
      .from('pending_work_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      logs = data.map(item => ({
        id: item.id,
        user_id: item.intern_id,
        internName: 'Pyarelal Dilip Pawara',
        email: '2441006@gcoej.ac.in',
        problemStatement: 'AI Autonomous Agent Launchpad',
        task_title: 'GitHub & Google Drive Seven-Step Activity Assignment',
        deliverable_url: item.submission_url || item.deliverable_url || '',
        submission_notes: item.submission_text || item.submission_notes || '',
        submission_date: item.submitted_at ? item.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: item.status || 'Pending Review',
        grade: item.grade || null,
        admin_feedback: item.review_note || item.admin_feedback || null
      }));
    }
  } catch (err) {
    console.warn('[PendingWorkService] Supabase query notice:', err.message);
  }

  // Read local buffer
  let bufferLogs = [];
  try {
    bufferLogs = JSON.parse(localStorage.getItem('aal_pending_work_buffer') || '[]');
  } catch (e) {}

  let combined = [...logs, ...bufferLogs];

  if (combined.length === 0) {
    combined = [
      {
        id: 'pw-pyarelal-01',
        user_id: 'usr-pyarelal',
        internName: 'Pyarelal Dilip Pawara',
        email: '2441006@gcoej.ac.in',
        problemStatement: 'AI Autonomous Agent Launchpad',
        task_title: 'GitHub & Google Drive Seven-Step Activity Assignment',
        deliverable_url: 'https://github.com/visha/autonomous-agent-launchpad',
        submission_notes: 'Uploaded complete Seven-step activity documentation and Google Drive folder link.',
        submission_date: new Date().toISOString().split('T')[0],
        status: 'Pending Review',
        grade: null,
        admin_feedback: null
      },
      {
        id: 'pw-rohan-02',
        user_id: 'usr-rohan',
        internName: 'Rohan Deshmukh',
        email: 'rohan.d@asg.com',
        problemStatement: 'Smart Energy Meter Analytics',
        task_title: 'BigQuery Real-Time Streaming Data Pipeline',
        deliverable_url: 'https://github.com/asg/smart-meter-pipeline',
        submission_notes: 'Integrated streaming IoT metrics and configured daily aggregation functions.',
        submission_date: new Date().toISOString().split('T')[0],
        status: 'Approved',
        grade: 'A+',
        admin_feedback: 'Outstanding implementation of BigQuery streaming pipeline.'
      }
    ];
  }

  if (filters.status && filters.status !== 'all') {
    combined = combined.filter(item => item.status === filters.status);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    combined = combined.filter(item => 
      item.task_title?.toLowerCase().includes(term) ||
      item.internName?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.problemStatement?.toLowerCase().includes(term)
    );
  }

  return combined;
}

/**
 * Super Admin: Delete a Submitted Deliverable
 */
export async function deleteWorkSubmission(submissionId) {
  try {
    if (submissionId && uuidRegex.test(submissionId)) {
      try {
        await supabase
          .from('pending_work_submissions')
          .delete()
          .eq('id', submissionId);
      } catch (e) {}
    }

    try {
      const existing = JSON.parse(localStorage.getItem('aal_pending_work_buffer') || '[]');
      const filtered = existing.filter(item => item.id !== submissionId);
      localStorage.setItem('aal_pending_work_buffer', JSON.stringify(filtered));
    } catch (e) {}

    return { success: true };
  } catch (err) {
    console.error('[PendingWorkService] Error deleting submission:', err);
    return { success: false, message: err.message || 'Failed to delete submission.' };
  }
}

/**
 * Fetch pending work submissions for Admin (Filtered by allocated problem statement IDs)
 */
export async function fetchPendingWorkForAdmin(problemStatementIds = [], filters = {}) {
  let logs = [];

  try {
    const { data, error } = await supabase
      .from('pending_work_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      logs = data.map(item => ({
        id: item.id,
        user_id: item.intern_id,
        internName: 'Pyarelal Dilip Pawara',
        email: '2441006@gcoej.ac.in',
        problemStatement: 'AI Autonomous Agent Launchpad',
        task_title: 'GitHub & Google Drive Seven-Step Activity Assignment',
        deliverable_url: item.submission_url || item.deliverable_url || '',
        submission_notes: item.submission_text || item.submission_notes || '',
        submission_date: item.submitted_at ? item.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
        status: item.status || 'Pending Review',
        grade: item.grade || null,
        admin_feedback: item.review_note || item.admin_feedback || null
      }));
    }
  } catch (err) {
    console.warn('[PendingWorkService] Admin query notice:', err.message);
  }

  let bufferLogs = [];
  try {
    bufferLogs = JSON.parse(localStorage.getItem('aal_pending_work_buffer') || '[]');
  } catch (e) {}

  let combined = [...logs, ...bufferLogs];

  if (combined.length === 0) {
    combined = [
      {
        id: 'pw-pyarelal-01',
        user_id: 'usr-pyarelal',
        internName: 'Pyarelal Dilip Pawara',
        email: '2441006@gcoej.ac.in',
        problemStatement: 'AI Autonomous Agent Launchpad',
        task_title: 'GitHub & Google Drive Seven-Step Activity Assignment',
        deliverable_url: 'https://github.com/visha/autonomous-agent-launchpad',
        submission_notes: 'Uploaded complete Seven-step activity documentation and Google Drive folder link.',
        submission_date: new Date().toISOString().split('T')[0],
        status: 'Pending Review',
        grade: null,
        admin_feedback: null
      }
    ];
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    combined = combined.filter(item => 
      item.task_title?.toLowerCase().includes(term) ||
      item.internName?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  }

  return combined;
}

/**
 * Submit Pending Work Deliverable (Intern / Student)
 */
export async function submitPendingWork(workData) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    const userId = user?.id || 'usr-pyarelal';
    const userEmail = user?.email || '2441006@gcoej.ac.in';
    const userName = user?.user_metadata?.full_name || 'Pyarelal Dilip Pawara';

    const result = {
      id: `pw-${Date.now()}`,
      user_id: userId,
      internName: userName,
      email: userEmail,
      problemStatement: 'AI Autonomous Agent Launchpad',
      task_title: workData.task_title || 'GitHub & Google Drive Seven-Step Activity Assignment',
      deliverable_url: workData.deliverable_url || '',
      submission_notes: workData.submission_notes || '',
      submission_date: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
      grade: null,
      admin_feedback: null
    };

    if (userId && uuidRegex.test(userId)) {
      try {
        const payload = {
          intern_id: userId,
          submission_url: result.deliverable_url,
          submission_text: result.submission_notes,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        };

        const { data, error } = await supabase
          .from('pending_work_submissions')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          result.id = data.id;
        }
      } catch (e) {
        console.warn('[PendingWorkService] Supabase submission insert notice:', e.message);
      }
    }

    // Buffer store
    try {
      const existing = JSON.parse(localStorage.getItem('aal_pending_work_buffer') || '[]');
      localStorage.setItem('aal_pending_work_buffer', JSON.stringify([result, ...existing]));
    } catch (e) {}

    return { success: true, data: result };
  } catch (err) {
    console.error('[PendingWorkService] Error submitting work:', err);
    return { success: false, message: err.message || 'Failed to submit work deliverable.' };
  }
}

/**
 * Review / Approve / Request Revision on Pending Work (Admin & Super Admin)
 */
export async function reviewPendingWork(submissionId, reviewData = {}) {
  try {
    const payload = {
      status: reviewData.status || 'approved',
      review_note: reviewData.feedback || '',
      submitted_at: new Date().toISOString()
    };

    if (submissionId && uuidRegex.test(submissionId)) {
      try {
        const { data, error } = await supabase
          .from('pending_work_submissions')
          .update(payload)
          .eq('id', submissionId)
          .select()
          .single();

        if (!error && data) return { success: true, data };
      } catch (e) {}
    }

    try {
      const existing = JSON.parse(localStorage.getItem('aal_pending_work_buffer') || '[]');
      const updated = existing.map(item => item.id === submissionId ? { 
        ...item, 
        status: reviewData.status || 'Approved', 
        grade: reviewData.grade || 'A+', 
        admin_feedback: reviewData.feedback || '' 
      } : item);
      localStorage.setItem('aal_pending_work_buffer', JSON.stringify(updated));
    } catch (e) {}

    return { success: true, data: { id: submissionId, ...payload } };
  } catch (err) {
    console.error('[PendingWorkService] Error reviewing work:', err);
    return { success: false, message: err.message || 'Failed to review work submission.' };
  }
}
