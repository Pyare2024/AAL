import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Copy, Send, Calendar, Archive, Trash2 } from 'lucide-react';
import { Announcement } from '../../types/announcementTypes';
import { announcementService } from '../../services/announcementService';

interface Props {
  announcement: Announcement;
  onEdit: () => void;
  onRefresh: () => void;
}

export const AnnouncementManagementMenu: React.FC<Props> = ({ announcement, onEdit, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { permissions, status } = announcement;
  const canEdit = permissions.can_edit;
  const canDelete = permissions.can_delete;
  
  // Also checking publish/archive logic. Assuming they require can_edit.
  const canPublish = canEdit && (status === 'draft' || status === 'scheduled');
  const canSchedule = canEdit && (status === 'draft');
  const canArchive = canEdit && (status === 'published' || status === 'expired');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (action: string, handler: () => Promise<void>) => {
    try {
      setIsProcessing(true);
      await handler();
      setIsOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to ${action}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = () => {
    handleAction('duplicate', async () => {
      await announcementService.duplicateAnnouncement(announcement.id);
    });
  };

  const handlePublish = () => {
    if (confirm('Are you sure you want to publish this announcement now?')) {
      handleAction('publish', async () => {
        await announcementService.publishAnnouncement(announcement.id);
      });
    }
  };

  const handleArchive = () => {
    if (confirm('Are you sure you want to archive this announcement?')) {
      handleAction('archive', async () => {
        await announcementService.archiveAnnouncement(announcement.id);
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to permanently delete this announcement?')) {
      handleAction('delete', async () => {
        await announcementService.deleteAnnouncement(announcement.id);
      });
    }
  };

  if (!canEdit && !canDelete) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition-colors"
        disabled={isProcessing}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EDEDED] rounded-xl shadow-lg py-1 z-50">
          {canEdit && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-[#171717] hover:bg-[#F5F5F5] flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-[#171717] hover:bg-[#F5F5F5] flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              
              {canPublish && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePublish(); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-[#FF8A00] hover:bg-[#FF8A00]/10 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Publish Now
                </button>
              )}
              
              {canArchive && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleArchive(); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-[#737373] hover:bg-[#F5F5F5] flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
              )}
            </>
          )}
          
          {canDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
