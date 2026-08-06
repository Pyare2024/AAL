import React from 'react';
import { Announcement, AnnouncementFilterOptions } from '../../types/announcementTypes';
import { TargetSelection } from './AnnouncementTargetSelector';
import { Pin, Paperclip, X } from 'lucide-react';

interface Props {
  announcement: Announcement;
  targets: TargetSelection[];
  options: AnnouncementFilterOptions | null;
  onClose: () => void;
  onPublish: () => void;
}

export const AnnouncementPreviewDialog: React.FC<Props> = ({ announcement, targets, options, onClose, onPublish }) => {
  const getTargetName = (t: TargetSelection) => {
    if (t.target_type === 'all_interns') return 'All Interns';
    if (t.target_type === 'problem_statement') {
      const ps = options?.problemStatements?.find(p => p.id === t.target_reference_id);
      return `Problem Statement: ${ps?.title || t.target_reference_id}`;
    }
    return `${t.target_type}: ${t.target_reference_id}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white max-h-[90vh] shadow-2xl flex flex-col z-10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EDEDED] flex justify-between items-center shrink-0 bg-[#F7F7F7]">
          <h2 className="font-bold text-lg text-[#171717]">Announcement Preview</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#EDEDED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
          <h1 className="text-3xl font-bold text-[#171717] mb-6">{announcement.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-[#737373] mb-6 pb-6 border-b border-[#EDEDED]">
            <div>
              <span className="font-semibold text-[#171717]">Targeting: </span>
              {targets.length > 0 ? targets.map(getTargetName).join(', ') : 'None'}
            </div>
            {announcement.scheduled_at && (
              <div>
                <span className="font-semibold text-[#171717]">Scheduled: </span>
                {new Date(announcement.scheduled_at).toLocaleString()}
              </div>
            )}
            {announcement.expires_at && (
              <div>
                <span className="font-semibold text-[#171717]">Expires: </span>
                {new Date(announcement.expires_at).toLocaleString()}
              </div>
            )}
          </div>

          <div 
            className="prose prose-sm max-w-none text-[#171717] prose-p:leading-relaxed prose-a:text-[#FF8A00]"
            dangerouslySetInnerHTML={{ __html: announcement.content }} 
          />
        </div>

        <div className="p-4 border-t border-[#EDEDED] flex justify-between shrink-0 bg-[#F7F7F7]">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-white border border-[#EDEDED] rounded-xl font-bold text-[#171717] hover:bg-[#F5F5F5]"
          >
            Back to Edit
          </button>
          
          <button 
            onClick={onPublish} 
            className="px-6 py-2 bg-[#FF8A00] text-white rounded-xl font-bold shadow-md hover:bg-[#FF3D00]"
          >
            {announcement.status === 'scheduled' ? 'Schedule Announcement' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
