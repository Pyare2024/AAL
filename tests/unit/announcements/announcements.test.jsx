import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SharedAnnouncementsPage } from '../../../src/pages/shared/SharedAnnouncementsPage';
import { useAuth } from '../../../src/features/auth/context/AuthContext';
import { announcementService } from '../../../src/services/announcementService';

// Mock dependencies
vi.mock('../../../src/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/services/announcementService', () => ({
  announcementService: {
    fetchAnnouncements: vi.fn(),
    fetchAnnouncementById: vi.fn(),
    fetchAnnouncementSummary: vi.fn(),
    fetchAnnouncementFilterOptions: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
  }
}));

const mockInternAuth = { role: 'intern', profile: { id: 'intern-1' } };
const mockAdminAuth = { role: 'admin', profile: { id: 'admin-1' } };
const mockSuperAdminAuth = { role: 'super_admin', profile: { id: 'sa-1' } };

describe('Announcements Module - Phase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    announcementService.fetchAnnouncementFilterOptions.mockResolvedValue({
      problemStatements: [{ id: 'ps1', title: 'PS 1' }],
      statuses: ['published', 'draft'],
      priorities: ['normal', 'urgent']
    });
    announcementService.fetchAnnouncementSummary.mockResolvedValue({
      total: 10, unread: 2, read: 8, important: 1
    });
    announcementService.fetchAnnouncements.mockResolvedValue({
      rows: [],
      total_count: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
      summary: {}
    });
  });

  it('verifies production mock source is disabled (using real service)', () => {
    // In our test environment, import.meta.env.VITE_USE_ANNOUNCEMENT_MOCKS is not 'true'
    expect(import.meta.env.VITE_USE_ANNOUNCEMENT_MOCKS).not.toBe('true');
  });

  it('renders intern view without composer button', async () => {
    useAuth.mockReturnValue(mockInternAuth);
    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Create Announcement')).not.toBeInTheDocument();
    });
  });

  it('renders admin view with composer button', async () => {
    useAuth.mockReturnValue(mockAdminAuth);
    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });
  });

  it('renders super admin view with composer button', async () => {
    useAuth.mockReturnValue(mockSuperAdminAuth);
    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Announcement')).toBeInTheDocument();
    });
  });

  it('admin opening composer sees assigned problem statements but not all_interns', async () => {
    useAuth.mockReturnValue(mockAdminAuth);
    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      screen.getByText('Create Announcement').click();
    });
    
    // Composer opens
    await waitFor(() => {
      expect(screen.getByText('Compose Announcement')).toBeInTheDocument();
      expect(screen.queryByText('+ All Interns')).not.toBeInTheDocument(); // Admin cannot see this
      expect(screen.getByText('+ Problem Statement')).toBeInTheDocument();
    });
  });

  it('super admin opening composer sees all_interns target option', async () => {
    useAuth.mockReturnValue(mockSuperAdminAuth);
    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      screen.getByText('Create Announcement').click();
    });
    
    await waitFor(() => {
      expect(screen.getByText('+ All Interns')).toBeInTheDocument(); // Super admin can see this
    });
  });

  it('read/unread persistence mapping uses the service', async () => {
    useAuth.mockReturnValue(mockInternAuth);
    announcementService.fetchAnnouncements.mockResolvedValue({
      rows: [{
        id: 'a1', title: 'Test 1', priority: 'normal', status: 'published', is_pinned: false,
        created_at: new Date().toISOString(), tags: [], author: { name: 'Admin', role: 'admin' },
        read_state: { is_read: false }, content: 'Test Content',
        attachments: { count: 0 }, permissions: {}
      }],
      total_count: 1, page: 1, page_size: 20, total_pages: 1
    });

    render(<SharedAnnouncementsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test 1')).toBeInTheDocument();
    });

    const markReadBtn = screen.getByText('Mark as Read');
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(announcementService.markAsRead).toHaveBeenCalledWith('a1');
    });
  });
});
