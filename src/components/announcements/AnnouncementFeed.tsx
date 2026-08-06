import React from 'react';
import { Announcement } from '../../types/announcementTypes';
import { AnnouncementCard } from './AnnouncementCard';

interface Props {
  announcements: Announcement[];
  onViewDetails: (announcement: Announcement) => void;
  onReadStateChange?: (id: string, isRead: boolean) => void;
  onEdit?: (announcement: Announcement) => void;
  onRefresh?: () => void;
}

export const AnnouncementFeed: React.FC<Props> = ({ announcements, onViewDetails, onReadStateChange, onEdit, onRefresh }) => {
  return (
    <div className="space-y-4">
      {announcements.map(announcement => (
        <AnnouncementCard 
          key={announcement.id} 
          announcement={announcement} 
          onClick={() => onViewDetails(announcement)} 
          onReadStateChange={onReadStateChange}
          onEdit={() => onEdit?.(announcement)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};
