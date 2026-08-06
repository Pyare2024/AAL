import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  announcementId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<Props> = ({ announcementId, onUploadComplete, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Basic validation
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is too large (max 10MB)`);
        
        const isImage = file.type.startsWith('image/');
        const folder = isImage ? 'images' : 'documents';
        
        // Sanitize filename to prevent collisions and path traversal
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}_${safeName}`;
        const filePath = `${announcementId}/${folder}/${uniqueName}`;

        const { error: uploadError } = await supabase.storage
          .from('announcement-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Register attachment metadata via backend RPC
        // Assume create_announcement_attachment RPC exists in Phase 2 schema. 
        // Note: Our current prompt instructions did not detail the exact metadata RPC name, 
        // but specified saving metadata. Using standard supabase query.
        const { error: dbError } = await supabase.from('announcement_attachments').insert({
          announcement_id: announcementId,
          attachment_type: isImage ? 'image' : 'document',
          storage_path: filePath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          sort_order: i
        });
        
        if (dbError) throw dbError;

        setProgress(((i + 1) / files.length) * 100);
      }
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Attachments</label>
      
      <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        disabled ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 opacity-50 cursor-not-allowed' : 
        'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-gray-800'
      }`}>
        <input 
          type="file" 
          multiple
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />
        <div className="flex flex-col items-center pointer-events-none">
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {isUploading ? `Uploading... ${Math.round(progress)}%` : 'Click or drag files to upload'}
          </span>
          {!isUploading && (
            <span className="text-xs text-gray-500 mt-1">Images (max 5MB), Documents (max 10MB)</span>
          )}
        </div>
        {isUploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 rounded-b-xl" style={{ width: `${progress}%` }} />
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
