import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types/announcementTypes';
import { announcementService } from '../../services/announcementService';
import { AnnouncementManagementMenu } from './AnnouncementManagementMenu';
import { AnnouncementAnalytics } from './AnnouncementAnalytics';
import { Pin, Paperclip, X } from 'lucide-react';

interface Props {
  announcementId: string;
  onClose: () => void;
  onReadStateChange?: (id: string, isRead: boolean) => void;
  onEdit?: (announcement: Announcement) => void;
  onRefresh?: () => void;
}

export const AnnouncementDetailDrawer: React.FC<Props> = ({ announcementId, onClose, onReadStateChange, onEdit, onRefresh }) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncement = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await announcementService.fetchAnnouncementById(announcementId);
      setAnnouncement(data);
      if (!data.read_state.is_read && onReadStateChange) {
        onReadStateChange(data.id, true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load announcement details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncement();
  }, [announcementId, onReadStateChange]);

  const canManage = announcement?.permissions?.can_edit || announcement?.permissions?.can_delete;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-lg bg-white h-dvh shadow-2xl flex flex-col z-10 transition-transform transform translate-x-0">
        <div className="p-4 border-b border-[#EDEDED] flex justify-between items-center shrink-0 bg-white">
          <h2 className="font-bold text-lg text-[#171717] truncate pr-4">
            {isLoading ? 'Loading...' : 'Announcement Details'}
          </h2>
          <div className="flex items-center gap-1">
            {announcement && canManage && onEdit && onRefresh && (
              <AnnouncementManagementMenu 
                announcement={announcement} 
                onEdit={() => onEdit(announcement)} 
                onRefresh={() => {
                  loadAnnouncement();
                  onRefresh();
                }} 
              />
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-[#F5F5F5] rounded w-3/4"></div>
              <div className="h-4 bg-[#F5F5F5] rounded w-1/2 mb-8"></div>
              <div className="space-y-2">
                <div className="h-3 bg-[#F5F5F5] rounded"></div>
                <div className="h-3 bg-[#F5F5F5] rounded"></div>
                <div className="h-3 bg-[#F5F5F5] rounded w-5/6"></div>
              </div>
            </div>
          ) : error || !announcement ? (
            <div className="p-6 text-center text-red-500">
              <p>{error || 'Announcement not found.'}</p>
            </div>
          ) : (
            <div className="p-4 md:p-6 pb-20">
              <div className="flex flex-wrap gap-2 mb-4">
                {announcement.is_pinned && (
                  <span className="inline-flex items-center gap-1 bg-[#F5F5F5] text-[#171717] text-[10px] font-bold px-2 py-1 rounded uppercase">
                    <Pin className="w-3 h-3 rotate-45" /> Pinned
                  </span>
                )}
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
                {announcement.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-[#F5F5F5] text-[#737373]">
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl font-bold text-[#171717] mb-2">{announcement.title}</h1>
              
              <div className="flex items-center gap-2 text-sm text-[#737373] mb-6 pb-6 border-b border-[#EDEDED]">
                <span className="font-semibold text-[#171717]">{announcement.author.name}</span>
                <span>•</span>
                <span>{new Date(announcement.published_at || announcement.created_at).toLocaleString()}</span>
              </div>

              <div 
                className="prose prose-sm max-w-none text-[#171717] prose-p:leading-relaxed prose-a:text-[#FF8A00] mb-8"
                dangerouslySetInnerHTML={{ __html: announcement.content }} 
              />

              {announcement.attachments?.count > 0 && (
                <div className="bg-[#F7F7F7] border border-[#EDEDED] rounded-xl p-4 mb-8">
                  <h4 className="font-bold text-sm text-[#171717] mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#737373]" />
                    Attachments ({announcement.attachments.count})
                  </h4>
                  <p className="text-xs text-[#737373] mb-3">
                    Images: {announcement.attachments.image_count} | Documents: {announcement.attachments.document_count}
                  </p>
                  <button 
                    disabled 
                    className="w-full py-2 bg-white border border-[#EDEDED] rounded-lg text-sm font-semibold text-[#9A9A9A] opacity-50 cursor-not-allowed"
                  >
                    Download Attachments (Available in Phase 2)
                  </button>
                </div>
              )}

              {canManage && <AnnouncementAnalytics announcementId={announcement.id} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
