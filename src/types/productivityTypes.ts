export interface AttendanceRecord {
  id: string;
  intern_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'late' | 'absent' | 'leave' | 'manual_present';
  latitude?: number | null;
  longitude?: number | null;
  working_minutes?: number | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoTask {
  id: string;
  intern_id: string;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DailyDiary {
  id: string;
  intern_id: string;
  diary_date: string;
  work_completed: string;
  learning?: string | null;
  challenges?: string | null;
  solution_taken?: string | null;
  hours_worked: number;
  tomorrow_plan: string;
  evidence_link?: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'changes_requested';
  admin_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingWorkItem {
  id: string;
  intern_id: string;
  assigned_by: string;
  assigned_by_name?: string;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high';
  assigned_date: string;
  due_date: string;
  status: 'assigned' | 'submitted' | 'changes_requested' | 'approved' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface PendingWorkSubmission {
  id: string;
  pending_work_id: string;
  intern_id: string;
  description: string;
  submission_link?: string | null;
  github_link?: string | null;
  attachment_url?: string | null;
  version_number: number;
  submitted_at: string;
  status: 'submitted' | 'changes_requested' | 'approved';
  reviewer_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}
