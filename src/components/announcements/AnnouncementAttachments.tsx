import React, { useState } from 'react';
import { AnnouncementAttachmentMetadata } from '../../types/announcementTypes';
import { announcementService } from '../../services/announcementService';

interface Props {
  // Since we don't have full attachment list in the feed summary, the DetailDrawer will fetch them or pass them.
  // Wait, the API for get_announcements only returns a count. 
  // We need the full attachment list which comes from get_announcement_by_id.
  attachments: any[];
}

export const AnnouncementAttachments: React.FC<Props> = ({ attachments }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (attachment: any) => {
    try {
      setLoadingId(attachment.id);
      setError(null);
      const access = await announcementService.getAttachmentAccess(attachment.id);
      // Mocked download flow since signed URLs require Edge functions.
      // We simulate opening a signed URL based on storage_path.
      alert(`Secure Access Granted.\nPath: ${access.storage_path}\nThis would normally open a signed URL.`);
    } catch (err: any) {
      setError(err.message || 'Failed to access attachment');
    } finally {
      setLoadingId(null);
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Attachments</h4>
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map(att => (
          <div key={att.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <svg className="w-8 h-8 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{att.file_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{att.attachment_type} • {(att.file_size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(att)}
              disabled={loadingId === att.id}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50"
            >
              {loadingId === att.id ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
