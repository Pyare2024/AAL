import React from 'react';
import { Announcement } from '../../types/announcementTypes';
import { Pin, Paperclip, Circle } from 'lucide-react';

import { AnnouncementManagementMenu } from './AnnouncementManagementMenu';

interface Props {
  announcement: Announcement;
  onClick: () => void;
  onReadStateChange?: (id: string, isRead: boolean) => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

export const AnnouncementCard: React.FC<Props> = ({ announcement, onClick, onReadStateChange, onEdit, onRefresh }) => {
  const isUnread = !announcement.read_state.is_read;
  
  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReadStateChange) {
      onReadStateChange(announcement.id, !announcement.read_state.is_read);
    }
  };

  return (
    <div 
      onClick={onClick} 
      className={`p-4 border ${isUnread ? 'border-[#FF8A00] bg-[#FF8A00]/5' : 'border-[#EDEDED] bg-white'} rounded-xl hover:shadow-md transition-shadow cursor-pointer relative`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {isUnread && <Circle className="w-2.5 h-2.5 fill-[#FF8A00] text-[#FF8A00]" />}
          {announcement.is_pinned && <Pin className="w-3.5 h-3.5 text-[#737373] rotate-45" />}
          <h3 className={`font-bold text-[#171717] ${isUnread ? 'text-[15px]' : 'text-sm'}`}>{announcement.title}</h3>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
            announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
            announcement.priority === 'important' ? 'bg-[#FF8A00]/20 text-[#FF8A00]' :
            'bg-[#F5F5F5] text-[#737373]'
          }`}>
            {announcement.priority}
          </span>
          <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-[#F5F5F5] text-[#737373]">
            {announcement.status}
          </span>
          
          {(announcement.permissions.can_edit || announcement.permissions.can_delete) && onEdit && onRefresh && (
            <AnnouncementManagementMenu 
              announcement={announcement} 
              onEdit={onEdit} 
              onRefresh={onRefresh} 
            />
          )}
        </div>
      </div>
      
      <p className="text-sm text-[#737373] line-clamp-2 mb-3 pl-4">
        {announcement.summary || announcement.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}
      </p>
      
      <div className="flex justify-between items-center text-xs text-[#9A9A9A] pl-4">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[#171717]">{announcement.author.name}</span>
          {announcement.tags && announcement.tags.length > 0 && (
            <>
              <span>•</span>
              <span className="uppercase text-[10px]">{announcement.tags[0]}</span>
            </>
          )}
          {announcement.attachments?.count > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{announcement.attachments.count}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}</span>
          {onReadStateChange && (
            <button 
              onClick={handleToggleRead}
              className="text-[#FF8A00] hover:text-[#FF3D00] font-semibold text-[10px] uppercase"
            >
              Mark as {isUnread ? 'Read' : 'Unread'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
