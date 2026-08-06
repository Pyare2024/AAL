import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../features/auth/context/AuthContext';
import { AnnouncementFilterOptions, Announcement } from '../../types/announcementTypes';
import { AnnouncementTargetSelector, TargetSelection } from './AnnouncementTargetSelector';
import { AnnouncementAttachmentUploader } from './AnnouncementAttachmentUploader';
import { AnnouncementPreviewDialog } from './AnnouncementPreviewDialog';
import { supabase } from '../../lib/supabase';

interface Props {
  mode: 'create' | 'edit';
  initialAnnouncementId: string | null;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export const AnnouncementComposer: React.FC<Props> = ({ mode, initialAnnouncementId, onClose, onSuccess }) => {
  const { role } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targets, setTargets] = useState<TargetSelection[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [draftId, setDraftId] = useState<string | null>(initialAnnouncementId);
  const [announcementData, setAnnouncementData] = useState<Announcement | null>(null);
  
  const [filterOptions, setFilterOptions] = useState<AnnouncementFilterOptions | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    announcementService.fetchAnnouncementFilterOptions()
      .then(opts => {
        if (mounted) setFilterOptions(opts);
      })
      .catch(e => console.error('Failed to load filter options', e));

    if (mode === 'edit' && initialAnnouncementId) {
      setIsLoading(true);
      Promise.all([
        announcementService.fetchAnnouncementById(initialAnnouncementId),
        supabase.from('announcement_targets').select('*').eq('announcement_id', initialAnnouncementId)
      ])
      .then(([data, targetsRes]) => {
        if (!mounted) return;
        setAnnouncementData(data);
        setTitle(data.title);
        setContent(data.content);
        setScheduledAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : '');
        setExpiresAt(data.expires_at ? data.expires_at.slice(0, 16) : '');
        
        if (targetsRes.data) {
          setTargets(targetsRes.data.map((t: any) => ({
            target_type: t.target_type,
            target_reference_id: t.target_reference_id
          })));
        }
      })
      .catch((e: any) => {
        if (mounted) setError(e.message || 'Failed to load announcement.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => { mounted = false; };
  }, [mode, initialAnnouncementId]);

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!content.trim()) return 'Full content is required';
    if (targets.length === 0) return 'Select at least one target user';
    
    if (scheduledAt) {
      if (new Date(scheduledAt) <= new Date()) {
        return 'Schedule time must be in the future';
      }
    }
    
    if (expiresAt) {
      if (new Date(expiresAt) <= new Date()) {
        return 'Expiry date must be in the future';
      }
      const compareDate = scheduledAt ? new Date(scheduledAt) : new Date();
      if (new Date(expiresAt) <= compareDate) {
        return 'Expiry date must be later than the scheduled publish time';
      }
    }
    return null;
  };

  const handleSaveDraft = async () => {
    // Basic validation for draft (empty targets allowed by backend for drafts, but UI requires some input)
    try {
      setIsSaving(true);
      setError(null);
      
      if (draftId) {
        await announcementService.updateAnnouncement({
          id: draftId, title, content, targets
        });
      } else {
        const res = await announcementService.createAnnouncement({
          title: title || 'Untitled Draft', content, targets, scheduledAt, expiresAt
        });
        setDraftId(res);
      }
      await onSuccess(); // Close and refetch only on success
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (doSchedule = false) => {
    console.log("Publish clicked");
    console.log({ title, content, targets, scheduledAt, expiresAt });
    
    const vErr = validate();
    if (vErr) {
      setError(vErr);
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      let id = draftId;
      if (!id) {
        console.log("Calling createAnnouncement");
        const res = await announcementService.createAnnouncement({
          title, content, targets, scheduledAt, expiresAt
        });
        console.log(res);
        id = res;
        setDraftId(id);
      } else {
        await announcementService.updateAnnouncement({
          id, title, content, targets
        });
      }
      
      if (!doSchedule || !scheduledAt) {
        console.log("Calling publishAnnouncement");
        await announcementService.publishAnnouncement(id);
      }
      
      await onSuccess(); // Close and refetch only on success
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-center items-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col z-10 overflow-hidden">
          
          <div className="p-6 border-b border-[#EDEDED] flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-[#171717]">{mode === 'edit' ? 'Edit Announcement' : 'Compose Announcement'}</h2>
            <button onClick={onClose} className="text-[#737373] hover:text-[#171717] font-bold">Close</button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold text-sm">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-[#171717] block mb-1">Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" value={title} onChange={e => setTitle(e.target.value)} 
                    className="w-full border border-[#EDEDED] rounded-lg p-2 focus:ring-[#FF8A00] outline-none"
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#171717] block mb-1">Full Content <span className="text-red-500">*</span></label>
                  <textarea 
                    value={content} onChange={e => setContent(e.target.value)} rows={12}
                    className="w-full border border-[#EDEDED] rounded-lg p-2 focus:ring-[#FF8A00] outline-none"
                    placeholder="Write your announcement content here..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <AnnouncementTargetSelector 
                  targets={targets} 
                  onChange={setTargets} 
                  options={filterOptions} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-[#171717] block mb-1">Schedule Publish (Optional)</label>
                    <input 
                      type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                      className="w-full border border-[#EDEDED] rounded-lg p-2 focus:ring-[#FF8A00] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-[#171717] block mb-1">Expiry Date (Optional)</label>
                    <input 
                      type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                      className="w-full border border-[#EDEDED] rounded-lg p-2 focus:ring-[#FF8A00] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-[#EDEDED] flex justify-between shrink-0 bg-[#F7F7F7]">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSaveDraft();
                }} 
                disabled={isSaving}
                className="px-6 py-2 bg-white border border-[#EDEDED] rounded-xl font-bold text-[#171717] hover:bg-[#F5F5F5]"
              >
                {isSaving ? 'Saving...' : draftId ? 'Save Changes' : 'Save as Draft'}
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (validate()) {
                    setError(validate());
                    return;
                  }
                  setPreviewOpen(true);
                }} 
                className="px-6 py-2 bg-white border border-[#EDEDED] rounded-xl font-bold text-[#171717] hover:bg-[#F5F5F5]"
              >
                Preview
              </button>
            </div>
            
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePublish(!!scheduledAt);
              }} 
              disabled={isSaving}
              className="px-6 py-2 bg-[#FF8A00] text-white rounded-xl font-bold shadow-md hover:bg-[#FF3D00] disabled:opacity-50"
            >
              {isSaving ? (scheduledAt ? 'Scheduling...' : 'Publishing...') : (scheduledAt ? 'Schedule Announcement' : 'Publish Now')}
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <AnnouncementPreviewDialog 
          announcement={{
            id: draftId || 'preview',
            title,
            summary: '',
            content,
            priority: 'normal',
            status: scheduledAt ? 'scheduled' : 'draft',
            is_pinned: false,
            tags: [],
            scheduled_at: scheduledAt || undefined,
            expires_at: expiresAt || undefined,
            created_at: new Date().toISOString(),
            author: { id: '', name: 'You', role: role || 'admin' },
            read_state: { is_read: false },
            attachments: { count: 0, image_count: 0, document_count: 0 },
            permissions: { can_edit: true, can_delete: true, can_publish: true, can_schedule: true, can_archive: true, can_manage_targets: true }
          }}
          targets={targets}
          options={filterOptions}
          onClose={() => setPreviewOpen(false)}
          onPublish={() => {
            setPreviewOpen(false);
            handlePublish(!!scheduledAt);
          }}
        />
      )}
    </>
  );
};
