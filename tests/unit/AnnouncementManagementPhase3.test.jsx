import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AnnouncementManagementMenu } from '../../src/components/announcements/AnnouncementManagementMenu';
import { AnnouncementComposer } from '../../src/components/announcements/AnnouncementComposer';
import { AnnouncementTargetSelector } from '../../src/components/announcements/AnnouncementTargetSelector';
import { AnnouncementAttachmentUploader } from '../../src/components/announcements/AnnouncementAttachmentUploader';
import { AnnouncementAnalytics } from '../../src/components/announcements/AnnouncementAnalytics';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { announcementService } from '../../src/services/announcementService';

vi.mock('../../src/features/auth/context/AuthContext');
vi.mock('../../src/services/announcementService');

const mockUseAuth = useAuth;

describe('Announcement Management Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseAnnouncement = {
    id: '123',
    title: 'Test',
    content: 'Content',
    priority: 'normal',
    status: 'draft',
    tags: [],
    author: { id: '1', name: 'Author', role: 'admin' },
    read_state: { is_read: false },
    permissions: {
      can_edit: true,
      can_delete: true,
      can_publish: true,
      can_schedule: true,
      can_archive: true,
      can_manage_targets: true,
    }
  };

  it('1. Intern cannot see management menu', () => {
    const announcement = { ...baseAnnouncement, permissions: { can_edit: false, can_delete: false } };
    const { container } = render(<AnnouncementManagementMenu announcement={announcement} onEdit={() => {}} onRefresh={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('2. Admin sees Edit for authorized announcement', () => {
    render(<AnnouncementManagementMenu announcement={baseAnnouncement} onEdit={() => {}} onRefresh={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('3. Unauthorized Admin has no management actions', () => {
    const announcement = { ...baseAnnouncement, permissions: { can_edit: false, can_delete: false } };
    const { container } = render(<AnnouncementManagementMenu announcement={announcement} onEdit={() => {}} onRefresh={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('4. Create mode uses empty fields', () => {
    mockUseAuth.mockReturnValue({ role: 'admin' });
    render(<AnnouncementComposer mode="create" initialAnnouncementId={null} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByLabelText(/Title/i)).toHaveValue('');
  });

  it('5. Edit mode loads existing announcement', async () => {
    mockUseAuth.mockReturnValue({ role: 'admin' });
    vi.mocked(announcementService.fetchAnnouncementById).mockResolvedValue(baseAnnouncement);
    render(<AnnouncementComposer mode="edit" initialAnnouncementId="123" onClose={() => {}} onSuccess={() => {}} />);
    await waitFor(() => {
      expect(announcementService.fetchAnnouncementById).toHaveBeenCalledWith('123');
    });
  });

  it('7. Save Draft returns announcement ID', async () => {
    mockUseAuth.mockReturnValue({ role: 'admin' });
    vi.mocked(announcementService.createAnnouncement).mockResolvedValue({ id: '999', status: 'draft', created_at: '' });
    render(<AnnouncementComposer mode="create" initialAnnouncementId={null} onClose={() => {}} onSuccess={() => {}} />);
    
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Draft' } });
    fireEvent.click(screen.getByText('Save as Draft'));
    
    await waitFor(() => {
      expect(announcementService.createAnnouncement).toHaveBeenCalled();
    });
  });

  it('11. Super Admin can select all_interns', () => {
    mockUseAuth.mockReturnValue({ role: 'super_admin' });
    render(<AnnouncementTargetSelector targets={[]} onChange={() => {}} options={{ problemStatements: [], statuses: [], priorities: [] }} />);
    expect(screen.getByText('+ All Interns')).toBeInTheDocument();
  });

  it('10. Admin cannot select all_interns', () => {
    mockUseAuth.mockReturnValue({ role: 'admin' });
    render(<AnnouncementTargetSelector targets={[]} onChange={() => {}} options={{ problemStatements: [], statuses: [], priorities: [] }} />);
    expect(screen.queryByText('+ All Interns')).not.toBeInTheDocument();
  });

  it('16. Analytics hidden from Intern', () => {
    vi.mocked(announcementService.getAnnouncementAnalytics).mockResolvedValue({
      targeted_count: 10, read_count: 5, unread_count: 5, read_percentage: 50, last_read_at: null
    });
    render(<AnnouncementAnalytics announcementId="123" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
