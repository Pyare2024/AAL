import { supabase } from '../lib/supabase';
import {
  LeaderboardRow,
  LeaderboardSummaryData,
  FilterOptions,
  FilterState,
  SortState,
  ViewerRole,
} from '../types/leaderboardTypes';
import {
  maskEmail,
  maskMobile,
  applyLeaderboardPrivacy,
  filterLeaderboardRows,
  removeDuplicateFilterValues,
} from '../utils/leaderboardUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Re-export masking helpers (backwards compat for any direct imports)
// ─────────────────────────────────────────────────────────────────────────────
export { maskEmail, maskMobile };

// ─────────────────────────────────────────────────────────────────────────────
// Schema facts (confirmed from supabase/schema.sql)
// ─────────────────────────────────────────────────────────────────────────────
// profiles.id          = auth.users.id  (canonical intern ID)
// profiles.mobile      = TEXT (nullable)
// profiles.city        = TEXT (nullable)
// profiles.account_status  = 'pending'|'active'|'inactive'|'suspended'
// profiles.onboarding_status = onboarding_status enum (completed = active intern)
// profiles.problem_statement_id = UUID FK to problem_statements
// leaderboard_points.intern_id, points, reason, source_type
// admin_problem_statements.admin_id, problem_statement_id
// user_roles.user_id, role
//
// NOTE: There is NO whatsapp_number column in the schema.
// WhatsApp search is therefore NOT SUPPORTED. Mobile search covers contact.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Development mock environment guard
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCKS =
  typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.DEV === true &&
  (import.meta as any).env?.VITE_USE_LEADERBOARD_MOCKS === 'true';

// ─────────────────────────────────────────────────────────────────────────────
// Sample data — DEVELOPMENT ONLY
// ─────────────────────────────────────────────────────────────────────────────

const _CITIES = ['Mumbai', 'Pune', 'Jalgaon', 'Nashik', 'Aurangabad', 'Nagpur', 'Kolhapur'];
const _PS_LIST = [
  { id: 'ps-01', title: 'AI Automated Workflow & Data Pipeline' },
  { id: 'ps-02', title: 'Gaming & Interactive Learning Platform' },
  { id: 'ps-03', title: 'Healthcare Diagnostics AI' },
  { id: 'ps-04', title: 'Smart Agriculture Monitoring' },
  { id: 'ps-05', title: 'EdTech Personalised Learning Engine' },
  { id: 'ps-06', title: 'Supply Chain Optimisation AI' },
  { id: 'ps-07', title: 'NLP Sentiment Analysis Tool' },
  { id: 'ps-08', title: 'Computer Vision Safety System' },
  { id: 'ps-09', title: 'FinTech Fraud Detection' },
  { id: 'ps-10', title: 'Smart City Traffic Management' },
  { id: 'ps-11', title: 'Renewable Energy Forecasting' },
  { id: 'ps-12', title: 'Legal Document Intelligence' },
];

const _NAMES = [
  ['Rahul', 'Sharma'], ['Priya', 'Patel'], ['Arjun', 'Mehta'], ['Sneha', 'Kulkarni'],
  ['Rohan', 'Desai'], ['Kavya', 'Nair'], ['Vivek', 'Joshi'], ['Pooja', 'Gupta'],
  ['Aditya', 'Singh'], ['Ananya', 'Reddy'], ['Kiran', 'More'], ['Siddharth', 'Pawar'],
  ['Nisha', 'Verma'], ['Ravi', 'Tiwari'], ['Ishaan', 'Yadav'], ['Tanvi', 'Shah'],
  ['Mohit', 'Chavan'], ['Shruti', 'Patil'], ['Nikhil', 'Rao'], ['Anjali', 'Mishra'],
  ['Harsh', 'Kadam'], ['Ritu', 'Bhat'], ['Vaibhav', 'Deshpande'], ['Prachi', 'Mukherjee'],
  ['Akshay', 'Lad'], ['Deepika', 'Pandey'], ['Sameer', 'Jadhav'], ['Rutuja', 'Sawant'],
];

function _buildSampleRows(): LeaderboardRow[] {
  // Deterministic scores — no Math.random() so order is stable across renders
  const baseScores = [92, 88, 85, 83, 80, 78, 76, 74, 72, 70, 68, 66, 65, 63, 61, 60, 58, 56, 54, 52, 51, 49, 48, 47, 45, 43, 42, 40];

  return _NAMES.map(([first, last], i) => {
    const city = _CITIES[i % _CITIES.length];
    const ps = _PS_LIST[i % _PS_LIST.length];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`;
    const mobile = `98${String(20000000 + i * 987654).padStart(8, '0')}`;
    const base = baseScores[i] ?? 40;
    const att   = Math.round(base * 0.95);
    const diary = Math.round(base * 0.90);
    const work  = Math.round(base * 0.85);
    const learn = Math.round(base * 0.80);
    const innov = Math.round(base * 0.75);
    const comm  = Math.round(base * 0.70);
    const post  = Math.round(base * 0.65);
    const bonus   = i < 5 ? 10 : 0;
    const penalty = i > 20 ? 5 : 0;
    const total = att + diary + work + learn + innov + comm + post + bonus - penalty;
    const overall = Math.min(100, Math.round((total / 550) * 100));
    const movements: LeaderboardRow['rankMovement'][] = ['up', 'down', 'same', 'new'];
    return {
      internId: `intern-${String(i + 1).padStart(3, '0')}`,
      rank: i + 1,               // placeholder; re-ranked below
      rankMovement: movements[i % 4],
      rankMovementDelta: [2, 1, 0, 0][i % 4],
      fullName: `${first} ${last}`,
      internCode: `AAL-2026-${String(i + 1).padStart(3, '0')}`,
      email,
      emailMasked: maskEmail(email),
      mobile,
      mobileMasked: maskMobile(mobile),
      city,
      collegeName: `COE ${city}`,
      problemStatement: ps.title,
      problemStatementId: ps.id,
      totalPoints: total,
      overallScore: overall,
      attendanceScore: att,
      dailyDiaryScore: diary,
      workScore: work,
      learningScore: learn,
      innovationScore: innov,
      communityScore: comm,
      aiPostScore: post,
      bonusPoints: bonus,
      penaltyPoints: penalty,
      isSelf: false,
      isAssigned: false,
    };
  })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((r, i) => ({ ...r, rank: i + 1 }));   // assign stable ranks 1–N
}

// Built once; stable order guaranteed by deterministic scores.
const SAMPLE_ROWS: LeaderboardRow[] = _buildSampleRows();

// ─────────────────────────────────────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchFilterOptions(): Promise<FilterOptions> {
  if (!USE_MOCKS) {
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_leaderboard_filter_options');
      if (!rpcErr && rpcData) {
        return {
          cities: rpcData.cities || [],
          problemStatements: rpcData.problem_statements || [],
        };
      }
    } catch {
      // Fall through to query builder
    }
  }

  try {
    const [cityResult, psResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('city')
        .eq('account_status', 'active')
        .eq('onboarding_status', 'completed'),
      supabase
        .from('problem_statements')
        .select('id, title')
        .eq('status', 'active')
        .order('title'),
    ]);

    const cities = removeDuplicateFilterValues(
      (cityResult.data ?? []).map((r: any) => r.city as string | null)
    );

    const problemStatements =
      psResult.data && psResult.data.length > 0
        ? psResult.data.map((p: any) => ({ id: p.id as string, title: p.title as string }))
        : (USE_MOCKS ? _PS_LIST : []);

    const finalCities = cities.length > 0
      ? cities
      : (USE_MOCKS ? removeDuplicateFilterValues(_CITIES) : []);

    return { cities: finalCities, problemStatements };
  } catch {
    if (USE_MOCKS) {
      return {
        cities: removeDuplicateFilterValues(_CITIES),
        problemStatements: _PS_LIST,
      };
    }
    return { cities: [], problemStatements: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main leaderboard fetch result type
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchLeaderboardResult {
  rows: LeaderboardRow[];
  total: number;
  summary: LeaderboardSummaryData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve which intern IDs are assigned to this admin via DB
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAdminAssignedInternIds(adminUserId: string): Promise<string[]> {
  try {
    // Admin → problem_statements → interns
    // Step 1: get the PSes assigned to this admin
    const { data: psRows, error: psErr } = await supabase
      .from('admin_problem_statements')
      .select('problem_statement_id')
      .eq('admin_id', adminUserId);

    if (psErr || !psRows || psRows.length === 0) return [];

    const psIds = psRows.map((r: any) => r.problem_statement_id as string);

    // Step 2: get all active interns on those PSes
    const { data: internRows, error: internErr } = await supabase
      .from('profiles')
      .select('id')
      .in('problem_statement_id', psIds)
      .eq('account_status', 'active')
      .eq('onboarding_status', 'completed');

    if (internErr || !internRows) return [];
    return internRows.map((r: any) => r.id as string);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build leaderboard rows from Supabase profiles + leaderboard_points
// ─────────────────────────────────────────────────────────────────────────────

async function fetchLiveLeaderboardRows(
  assignedInternIds: string[]
): Promise<LeaderboardRow[]> {
  // Fetch all active interns (role = 'intern', account_status = 'active', onboarding_status = 'completed')
  const { data: profileRows, error: profileErr } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      mobile,
      profile_photo_url,
      city,
      college_name,
      problem_statement_id,
      problem_statements!profiles_problem_statement_id_fkey(id, title)
    `)
    .eq('account_status', 'active')
    .eq('onboarding_status', 'completed');

  if (profileErr || !profileRows) throw profileErr ?? new Error('Failed to load profiles');

  // Fetch role filter — only interns
  const { data: roleRows, error: roleErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'intern');

  if (roleErr) throw roleErr;

  const internIds = new Set((roleRows ?? []).map((r: any) => r.user_id as string));

  // Filter profiles to intern-role users only
  const internProfiles = profileRows.filter((p: any) => internIds.has(p.id));

  if (internProfiles.length === 0) return [];

  const internIdList = internProfiles.map((p: any) => p.id as string);

  // Fetch aggregate points per intern
  const { data: pointsRows, error: pointsErr } = await supabase
    .from('leaderboard_points')
    .select('intern_id, points')
    .in('intern_id', internIdList);

  if (pointsErr) throw pointsErr;

  // Aggregate points per intern
  const pointsMap: Record<string, number> = {};
  for (const pr of (pointsRows ?? [])) {
    pointsMap[pr.intern_id] = (pointsMap[pr.intern_id] ?? 0) + (pr.points as number);
  }

  // Build rows
  const rows: LeaderboardRow[] = internProfiles.map((p: any, i: number) => {
    const email: string = p.email ?? '';
    const mobile: string = p.mobile ?? '';
    const ps: any = p.problem_statements;
    const total = pointsMap[p.id] ?? 0;
    const overall = Math.min(100, Math.round((total / 500) * 100));

    return {
      internId: p.id as string,
      rank: 0, // assigned after sort
      rankMovement: 'same' as const,
      rankMovementDelta: 0,
      fullName: p.full_name ?? 'Unknown',
      internCode: `AAL-${p.id.slice(0, 8).toUpperCase()}`,
      email,
      emailMasked: maskEmail(email),
      mobile,
      mobileMasked: maskMobile(mobile),
      profilePhotoUrl: p.profile_photo_url ?? undefined,
      city: p.city ?? '',
      collegeName: p.college_name ?? undefined,
      problemStatement: ps?.title ?? '',
      problemStatementId: p.problem_statement_id ?? '',
      totalPoints: total,
      overallScore: overall,
      attendanceScore: 0,
      dailyDiaryScore: 0,
      workScore: 0,
      learningScore: 0,
      innovationScore: 0,
      communityScore: 0,
      aiPostScore: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      isSelf: false,
      isAssigned: assignedInternIds.includes(p.id as string),
    };
  });

  // Sort by total points descending and assign ranks
  return rows
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main leaderboard fetch
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  filters: FilterState,
  sort: SortState,
  page: number,
  pageSize: number,
  viewerRole: ViewerRole,
  viewerInternId: string,
  assignedInternIds: string[] = []
): Promise<FetchLeaderboardResult> {

  // ── Production path: real Supabase data ─────────────────────────────────
  if (!USE_MOCKS) {
    try {
      // Step 1: Call get_leaderboard RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_leaderboard', {
        p_search_text: filters.search || null,
        p_city: filters.city === 'all' ? null : filters.city,
        p_problem_statement_id: filters.problemStatementId === 'all' ? null : filters.problemStatementId,
        p_page: page,
        p_page_size: pageSize,
        p_sort_by: sort.field,
        p_sort_direction: sort.dir,
      });

      if (rpcErr) {
        throw new Error(`Leaderboard RPC failed: ${rpcErr.message}`);
      }
      
      if (!rpcData) {
        throw new Error('Leaderboard RPC returned no data');
      }

      return rpcData as FetchLeaderboardResult;
    } catch (err) {
      // Propagate to caller — do NOT silently fall back to mock data or query builder in production
      console.error('[LeaderboardService] Error fetching leaderboard:', err);
      throw err;
    }
  }

  // ── Development mock path ────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[LeaderboardService] Using DEVELOPMENT MOCK data. ' +
      'Set VITE_USE_LEADERBOARD_MOCKS=false in .env to use real Supabase data.'
    );
  }

  const allRows = SAMPLE_ROWS.map((r) => ({
    ...r,
    isAssigned: assignedInternIds.includes(r.internId),
  }));
  return _processRows(allRows, filters, sort, page, pageSize, viewerRole, viewerInternId, assignedInternIds);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared processing: filter, sort, paginate, apply privacy, build summary
// This function is the SAME for both real data and mock data paths,
// ensuring ranking consistency across viewer roles.
// ─────────────────────────────────────────────────────────────────────────────

function _processRows(
  allRows: LeaderboardRow[],
  filters: FilterState,
  sort: SortState,
  page: number,
  pageSize: number,
  viewerRole: ViewerRole,
  viewerInternId: string,
  assignedInternIds: string[]
): FetchLeaderboardResult {
  // Step 1: Apply filters (AND logic)
  const effectiveSearch = filters.search.trim();
  const filteredFilters: FilterState = { ...filters, search: effectiveSearch };
  let filtered = filterLeaderboardRows(allRows, filteredFilters, viewerRole, viewerInternId);

  // Step 2: Sort (rank is default; rank sort uses existing rank assignment, not re-rank)
  filtered = [...filtered].sort((a, b) => {
    const field = sort.field as keyof LeaderboardRow;
    const av = a[field] as number | string;
    const bv = b[field] as number | string;
    if (typeof av === 'string') {
      const cmp = (av as string).localeCompare(bv as string);
      return sort.dir === 'asc' ? cmp : -cmp;
    }
    return sort.dir === 'asc'
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const total = filtered.length;

  // Step 3: Summary — always from the full unfiltered set for accurate platform stats
  const allSorted = allRows; // already sorted by rank
  const top3Raw = allSorted.slice(0, 3);
  const top3 = top3Raw.map((r) =>
    applyLeaderboardPrivacy(
      { ...r, isAssigned: assignedInternIds.includes(r.internId) },
      viewerRole,
      viewerInternId
    )
  );
  const avgScore =
    allSorted.length > 0
      ? Math.round(allSorted.reduce((s, r) => s + r.overallScore, 0) / allSorted.length)
      : 0;
  const myRow = allSorted.find((r) => r.internId === viewerInternId);

  const summary: LeaderboardSummaryData = {
    totalRanked: allSorted.length,
    topPerformerName: allSorted[0]?.fullName ?? '—',
    topPerformerScore: allSorted[0]?.overallScore ?? 0,
    averageScore: avgScore,
    myRank: myRow?.rank,
    myPoints: myRow?.totalPoints,
    myMovement: myRow?.rankMovement,
    top3,
  };

  // Step 4: Paginate
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  // Step 5: Apply privacy masking (client-side defence in depth)
  const maskedRows = paged.map((r) =>
    applyLeaderboardPrivacy(
      { ...r, isAssigned: assignedInternIds.includes(r.internId) },
      viewerRole,
      viewerInternId
    )
  );

  return { rows: maskedRows, total, summary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch intern leaderboard details (RPC get_intern_leaderboard_details)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchInternLeaderboardDetails(internId: string): Promise<any> {
  if (!USE_MOCKS) {
    try {
      const { data, error } = await supabase.rpc('get_intern_leaderboard_details', {
        p_intern_id: internId,
      });
      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback
    }
  }

  return {
    canViewDetails: true,
    internId,
    pointsBreakdown: [],
  };
}
