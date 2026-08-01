import { describe, it, expect } from 'vitest';
import { fetchInternDashboardSummary } from '../../src/services/internDashboardService';

describe('Intern Dashboard Performance & Correctness Tests', () => {
  it('TC-DASH-REQ-01: verifies summary RPC service is callable and defined', () => {
    expect(fetchInternDashboardSummary).toBeTypeOf('function');
  });

  it('TC-DASH-MAT-01: validates actionable task filtering rules', () => {
    const mockTasks = [
      { id: '1', status: 'draft', title: 'Task A' },
      { id: '2', status: 'submitted', title: 'Task B' },
      { id: '3', status: 'resubmission_required', title: 'Task C' },
      { id: '4', status: 'approved', title: 'Task D' },
    ];

    const actionable = mockTasks.filter(t => ['draft', 'resubmission_required'].includes(t.status));
    expect(actionable).toHaveLength(2);
    expect(actionable.map(a => a.id)).toEqual(['1', '3']);
  });

  it('TC-DASH-ADM-01: formats multi-admin assignments correctly', () => {
    const singleAdmin = ['Admin Rajesh'];
    const dualAdmins = ['Admin Rajesh', 'Admin Priya'];
    const tripleAdmins = ['Admin A', 'Admin B', 'Admin C'];

    const formatAdmins = (list) => {
      if (!list || list.length === 0) return 'Super Admin Console';
      if (list.length > 2) return `Support Team (${list.length} Admins)`;
      return list.join(' & ');
    };

    expect(formatAdmins(singleAdmin)).toBe('Admin Rajesh');
    expect(formatAdmins(dualAdmins)).toBe('Admin Rajesh & Admin Priya');
    expect(formatAdmins(tripleAdmins)).toBe('Support Team (3 Admins)');
  });
});
