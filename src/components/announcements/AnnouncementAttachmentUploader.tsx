import React, { useState } from 'react';
import { announcementService } from '../../services/announcementService';
import { Paperclip } from 'lucide-react';

interface Props {
  announcementId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
const REJECTED_EXTENSIONS = ['.exe', '.bat', '.apk', '.js', '.sh', '.cmd', '.zip', '.rar', '.7z'];

export const AnnouncementAttachmentUploader: React.FC<Props> = ({ announcementId, onUploadComplete, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    const name = file.name.toLowerCase();
    
    for (const ext of REJECTED_EXTENSIONS) {
      if (name.endsWith(ext)) return `${file.name} is a rejected file type.`;
    }

    let isAllowed = false;
    for (const ext of ALLOWED_EXTENSIONS) {
      if (name.endsWith(ext)) {
        isAllowed = true;
        break;
      }
    }
    
    if (!isAllowed) return `${file.name} has an unsupported extension.`;

    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return `${file.name} is too large (max ${isImage ? '5MB' : '10MB'}).`;
    }

    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!announcementId) {
      setError('Cannot upload attachments without a valid draft.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const validationError = validateFile(file);
        if (validationError) throw new Error(validationError);
        
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
        const folder = isImage ? 'images' : 'documents';
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2,8)}_${safeName}`;
        const filePath = `${announcementId}/${folder}/${uniqueName}`;

        await announcementService.uploadAttachment(filePath, file);

        try {
          await announcementService.createAttachmentMetadata({
            announcementId,
            attachmentType: isImage ? 'image' : 'document',
            storagePath: filePath,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size
          });
        } catch (metaErr) {
          try {
            await announcementService.removeAttachment('mock_id', filePath);
          } catch (e) {
            // ignore
          }
          throw metaErr;
        }

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
      <label className="text-sm font-bold text-[#171717]">Upload Attachments</label>
      
      <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        disabled ? 'bg-[#F5F5F5] border-[#EDEDED] opacity-50 cursor-not-allowed' : 
        'bg-[#F7F7F7] border-[#EDEDED] hover:bg-[#F5F5F5] hover:border-[#FF8A00]'
      }`}>
        <input 
          type="file" 
          multiple
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        />
        <div className="flex flex-col items-center pointer-events-none">
          <Paperclip className="w-8 h-8 text-[#9A9A9A] mb-2" />
          <span className="text-sm text-[#171717] font-bold">
            {isUploading ? `Uploading... ${Math.round(progress)}%` : 'Click or drag files to upload'}
          </span>
          {!isUploading && (
            <span className="text-xs text-[#737373] mt-1">Images, PDF, DOC, PPT, XLS accepted. ZIP/EXE rejected.</span>
          )}
        </div>
        {isUploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-[#FF8A00] transition-all duration-300 rounded-b-xl" style={{ width: `${progress}%` }} />
        )}
      </div>
      {error && <p className="text-sm text-red-500 font-bold">{error}</p>}
    </div>
  );
};
