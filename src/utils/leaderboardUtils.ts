// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Pure Utility Functions
// All functions in this module are pure and contain zero side-effects.
// They operate only on their arguments and return deterministic results.
//
// Schema notes (confirmed from supabase/schema.sql):
//   profiles.id        = auth.users.id  (the canonical intern ID for active interns)
//   profiles.mobile    = TEXT (nullable)  — no whatsapp_number column in schema
//   user_roles.role    = 'intern' | 'admin' | 'super_admin'
//   admin_can_access_intern(UUID) → boolean — existing DB helper
// ─────────────────────────────────────────────────────────────────────────────

import type { LeaderboardRow, FilterState, ViewerRole } from '../types/leaderboardTypes';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Privacy masking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Masks an email address, preserving first 3 chars of local part and full domain.
 * Examples:
 *   "rahul.sharma@gmail.com" → "rah***@gmail.com"
 *   "ab@test.com"           → "***@test.com"
 *   ""                      → "***@***.***"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 3) return `***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}

/**
 * Masks a mobile number, revealing only the last 4 digits.
 * Strips all non-digit characters before masking.
 * Examples:
 *   "9876543210" → "******3210"
 *   "+91 98765 43210" → "*********3210"
 *   "1234"      → "****"  (short → all stars)
 */
export function maskMobile(mobile: string): string {
  if (!mobile) return '******';
  const cleaned = mobile.replace(/[^\d+]/g, '');
  if (cleaned.length < 4) return '*'.repeat(Math.max(6, cleaned.length));
  return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Contact normalisation for search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a contact string for comparison.
 * Strips country code (+91 / 0091 / 0), spaces, dashes, parentheses.
 * Returns only digit characters.
 *
 * NOTE: whatsapp_number does NOT exist in the schema. This function
 * handles mobile numbers only. WhatsApp search is NOT SUPPORTED by schema.
 */
export function normalizeContact(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  // Strip leading country-code prefix: 0091, +91, or leading 0 (for STD codes)
  if (digits.startsWith('0091')) return digits.slice(4);
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  return digits;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Combined search matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if a leaderboard row matches the search query.
 *
 * Searches (case-insensitive, trimmed):
 *   - Full name
 *   - Intern code (AAL-2026-xxx)
 *   - Email (masked for unauthorised viewers via the row fields already set)
 *   - Mobile (normalized digits, partial match)
 *
 * Authorised viewers (self / admin-assigned / super_admin) also match against
 * raw email and raw mobile. Unauthorised viewers only see masked values so we
 * use those for matching — this prevents leaking data through search inference.
 *
 * WhatsApp: NOT SUPPORTED — column does not exist in schema.
 */
export function matchesLeaderboardSearch(
  row: LeaderboardRow,
  rawQuery: string,
  viewerRole: ViewerRole,
  viewerInternId: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const canSeeRaw =
    viewerRole === 'super_admin' ||
    (viewerRole === 'admin' && row.isAssigned) ||
    row.internId === viewerInternId;

  // Always-searchable public fields
  if (row.fullName.toLowerCase().includes(q)) return true;
  if (row.internCode.toLowerCase().includes(q)) return true;

  // Email matching
  if (canSeeRaw) {
    if (row.email.toLowerCase().includes(q)) return true;
  } else {
    if (row.emailMasked.toLowerCase().includes(q)) return true;
  }

  // Mobile matching (normalized digit comparison)
  const normalizedQ = normalizeContact(q);
  if (normalizedQ.length >= 4) {
    const rawNorm = normalizeContact(canSeeRaw ? row.mobile : row.mobileMasked);
    if (rawNorm.includes(normalizedQ)) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Row-level filter (AND logic across all filters)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies all filters to a row set using strict AND logic.
 * Ranking numbers on the input rows are NOT recomputed here;
 * ranking comes from the data source (DB or sorted sample).
 */
export function filterLeaderboardRows(
  rows: LeaderboardRow[],
  filters: FilterState,
  viewerRole: ViewerRole,
  viewerInternId: string
): LeaderboardRow[] {
  const search = (filters.search ?? "").trim().toLowerCase();
  const city = (filters.city ?? "").trim().toLowerCase();
  const problemStatementId = (filters.problemStatementId ?? "").trim();

  return rows.filter((row) => {
    const searchMatch =
      !search ||
      [
        row.fullName,
        row.internCode,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );

    // Some filters use 'all' as a special value to mean "no filter"
    const isCityAll = city === 'all';
    const cityMatch =
      !city || isCityAll ||
      String(row.city ?? "").trim().toLowerCase() === city;

    const isPsAll = problemStatementId === 'all';
    const psMatch =
      !problemStatementId || isPsAll ||
      String(row.problemStatementId ?? "") === problemStatementId;

    return searchMatch && cityMatch && psMatch;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Privacy application (client-side defence in depth)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies role-aware privacy to a single leaderboard row.
 *
 * IMPORTANT: This is a UI-layer defence-in-depth measure only.
 * The database / RPC layer must NEVER return raw sensitive fields
 * to unauthorised callers. This function is a last-line guard for
 * client-rendered views using sample data.
 *
 * Access matrix:
 *   super_admin          → full raw data
 *   admin + isAssigned   → full raw data
 *   intern viewing self  → full raw data
 *   everyone else        → masked email + masked mobile
 */
export function applyLeaderboardPrivacy(
  row: LeaderboardRow,
  viewerRole: ViewerRole,
  viewerInternId: string
): LeaderboardRow {
  const isSelf = row.internId === viewerInternId;

  const canSeeRaw =
    viewerRole === 'super_admin' ||
    (viewerRole === 'admin' && !!row.isAssigned) ||
    isSelf;

  if (canSeeRaw) {
    return { ...row, isSelf };
  }

  // Mask sensitive fields for all other viewers
  return {
    ...row,
    isSelf: false,
    email: row.emailMasked,
    mobile: row.mobileMasked,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Rank movement label
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable label for a rank movement.
 */
export function calculateRankMovementLabel(
  movement: LeaderboardRow['rankMovement'],
  delta: number
): string {
  switch (movement) {
    case 'up':   return `↑ Improved by ${delta}`;
    case 'down': return `↓ Dropped by ${delta}`;
    case 'new':  return 'New entry';
    default:     return '→ No change';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Filter option deduplication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes duplicates, null/empty values from a string array, and sorts alphabetically.
 * Used for building the City dropdown from DB rows.
 */
export function removeDuplicateFilterValues(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v && v.trim() !== ''))].sort();
}
