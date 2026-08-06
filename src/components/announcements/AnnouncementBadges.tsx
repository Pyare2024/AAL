import React from 'react';
import { AnnouncementStatus, AnnouncementPriority } from '../../types/announcementTypes';

export const AnnouncementStatusBadge: React.FC<{ status: AnnouncementStatus }> = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'expired': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'archived': return 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStyle()} capitalize`}>
      {status}
    </span>
  );
};

export const AnnouncementPriorityBadge: React.FC<{ priority: AnnouncementPriority }> = ({ priority }) => {
  const getStyle = () => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200';
      case 'important': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200';
      case 'normal': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStyle()} capitalize flex items-center gap-1`}>
      {priority === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      {priority}
    </span>
  );
};
