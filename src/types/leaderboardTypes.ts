// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard — Type Definitions
// One shared type set used by Intern, Admin, and Super Admin views.
// ─────────────────────────────────────────────────────────────────────────────

export type ViewerRole = 'intern' | 'admin' | 'super_admin';

export interface LeaderboardRow {
  /** Database ID of the intern profile */
  internId: string;
  rank: number;
  /** Direction vs previous period: up | down | same | new */
  rankMovement: 'up' | 'down' | 'same' | 'new';
  rankMovementDelta: number;

  // ── Identity ──────────────────────────────────────────────────────────────
  fullName: string;
  internCode: string;        // e.g. AAL-2026-001
  /** Raw email — will be masked if viewer not authorised */
  email: string;
  /** Masked email shown to unauthorised viewers */
  emailMasked: string;
  /** Raw mobile — will be masked */
  mobile: string;
  mobileMasked: string;
  profilePhotoUrl?: string;

  // ── Location & context ───────────────────────────────────────────────────
  city: string;
  collegeName?: string;
  problemStatement: string;
  problemStatementId: string;

  // ── Scores ────────────────────────────────────────────────────────────────
  totalPoints: number;
  overallScore: number;       // 0–100 normalised
  attendanceScore: number;
  dailyDiaryScore: number;
  workScore: number;
  learningScore: number;
  innovationScore: number;
  communityScore: number;
  aiPostScore: number;
  bonusPoints: number;
  penaltyPoints: number;

  /** Whether this intern is the currently logged-in user */
  isSelf?: boolean;
  /** Whether this intern is assigned to the current Admin */
  isAssigned?: boolean;
}

export interface LeaderboardSummaryData {
  totalRanked: number;
  topPerformerName: string;
  topPerformerScore: number;
  averageScore: number;
  myRank?: number;
  myPoints?: number;
  myMovement?: 'up' | 'down' | 'same' | 'new';
  top3: LeaderboardRow[];
}

export interface FilterState {
  search: string;
  city: string;
  problemStatementId: string;
}

export interface FilterOptions {
  cities: string[];
  problemStatements: { id: string; title: string }[];
}

export interface PaginationState {
  page: number;
  pageSize: 25 | 50 | 100;
  total: number;
}

export type SortField =
  | 'rank'
  | 'fullName'
  | 'city'
  | 'problemStatement'
  | 'totalPoints'
  | 'overallScore';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  dir: SortDir;
}

// Score category metadata for column headers
export const SCORE_CATEGORIES: { key: keyof LeaderboardRow; label: string }[] = [
  { key: 'attendanceScore',  label: 'Attendance' },
  { key: 'dailyDiaryScore',  label: 'Daily Diary' },
  { key: 'workScore',        label: 'Work' },
  { key: 'learningScore',    label: 'Learning' },
  { key: 'innovationScore',  label: 'Innovation' },
  { key: 'communityScore',   label: 'Community' },
  { key: 'aiPostScore',      label: 'AI Post' },
  { key: 'bonusPoints',      label: 'Bonus' },
  { key: 'penaltyPoints',    label: 'Penalty' },
];
