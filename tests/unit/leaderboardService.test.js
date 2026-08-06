import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLeaderboard, fetchFilterOptions } from '../../src/services/leaderboardService';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  }
}));

describe('Leaderboard Service - Phase 3 Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRpcResponse = {
    rows: [
      { internId: 'i-1', rank: 1, fullName: 'Intern 1', isSelf: true, email: 'raw@example.com' },
      { internId: 'i-2', rank: 2, fullName: 'Intern 2', isSelf: false, emailMasked: '***@example.com' },
      { internId: 'i-3', rank: 3, fullName: 'Intern 3', isSelf: false, emailMasked: '***@example.com' },
    ],
    total: 3,
    summary: {
      totalRanked: 3,
      top3: [
        { internId: 'i-1', rank: 1 },
        { internId: 'i-2', rank: 2 },
        { internId: 'i-3', rank: 3 }
      ]
    }
  };

  const defaultParams = [
    { search: '', city: 'all', problemStatementId: 'all' },
    { field: 'rank', dir: 'asc' },
    1,
    25
  ];

  it('1 & 6. Intern viewer receives all eligible Intern rows and others remain present', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'intern', 'i-1');
    expect(result.rows.length).toBe(3);
    expect(supabase.rpc).toHaveBeenCalledWith('get_leaderboard', expect.any(Object));
  });

  it('2. Admin viewer receives all eligible Intern rows', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'admin', 'a-1', ['i-2']);
    expect(result.rows.length).toBe(3);
  });

  it('3. Super Admin viewer receives all eligible Intern rows', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'super_admin', 'sa-1');
    expect(result.rows.length).toBe(3);
  });

  it('4. Rank order is identical for all roles', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockRpcResponse, error: null });
    const r1 = await fetchLeaderboard(...defaultParams, 'intern', 'i-1');
    const r2 = await fetchLeaderboard(...defaultParams, 'super_admin', 'sa-1');
    expect(r1.rows.map(r => r.internId)).toEqual(r2.rows.map(r => r.internId));
  });

  it('5. Logged-in Intern row is highlighted', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'intern', 'i-1');
    const selfRow = result.rows.find(r => r.internId === 'i-1');
    expect(selfRow?.isSelf).toBe(true);
  });

  it('7, 8, 9. Privacy is handled by RPC, frontend passes viewer info', async () => {
    // Privacy is verified in DB tests, but we ensure the frontend just returns the RPC rows
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'intern', 'i-1');
    expect(result.rows[1].emailMasked).toBe('***@example.com');
  });

  it('10. Filter options come from all eligible Interns', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { cities: ['Pune', 'Mumbai'], problem_statements: [{ id: '1', title: 'PS1' }] },
      error: null
    });
    const filters = await fetchFilterOptions();
    expect(filters.cities).toEqual(['Pune', 'Mumbai']);
  });

  it('11. Top 3 comes from the full ranking', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRpcResponse, error: null });
    const result = await fetchLeaderboard(...defaultParams, 'intern', 'i-1');
    expect(result.summary.top3.length).toBe(3);
    expect(result.summary.top3.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('12. RPC failure in production shows an error, not incomplete fallback data', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
    await expect(fetchLeaderboard(...defaultParams, 'intern', 'i-1')).rejects.toThrow('Leaderboard RPC failed');
  });
});
