import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  GripVertical,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
} from 'lucide-react';
import {
  UploadedImage,
  Platform,
  PLATFORM_IMAGE_LIMITS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '../../types/aiPostTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type || file.name.split('.').pop()}. Use JPG, PNG, or WEBP.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `File too large: ${formatBytes(file.size)}. Maximum is 5 MB.`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

function UploadProgressBar({ progress, state }: { progress: number; state: UploadedImage['uploadState'] }) {
  if (state === 'done') return null;

  const barColor =
    state === 'error' ? 'bg-red-500' :
    state === 'uploading' ? 'bg-[#FF8A00]' : 'bg-gray-300';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${barColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Image Thumbnail Card
// ─────────────────────────────────────────────────────────────────────────────

function ImageThumb({
  image,
  index,
  isCover,
  onRemove,
  onPreview,
  onRetry,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  image: UploadedImage;
  index: number;
  isCover: boolean;
  onRemove: (id: string) => void;
  onPreview: (image: UploadedImage) => void;
  onRetry: (id: string) => void;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(image.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={() => onDrop(image.id)}
      className={`relative group rounded-xl border-2 overflow-hidden bg-[#FAFAFA] transition-all select-none ${
        dragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${
        image.uploadState === 'error'
          ? 'border-red-300'
          : isCover
          ? 'border-[#FF8A00]'
          : 'border-[#EDEDED] hover:border-gray-300'
      }`}
      style={{ aspectRatio: '1' }}
    >
      {/* Thumbnail Image */}
      <img
        src={image.previewUrl}
        alt={image.name}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E";
        }}
      />

      {/* Progress */}
      <UploadProgressBar progress={image.uploadProgress} state={image.uploadState} />

      {/* Cover Badge */}
      {isCover && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#FF8A00] text-white text-[9px] font-bold rounded-md shadow">
          COVER
        </div>
      )}

      {/* State Overlay */}
      {image.uploadState === 'uploading' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}
      {image.uploadState === 'error' && (
        <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center gap-1 p-2">
          <AlertTriangle className="h-5 w-5 text-red-200" />
          <p className="text-[9px] text-red-100 text-center leading-tight">{image.errorMessage}</p>
        </div>
      )}
      {image.uploadState === 'done' && (
        <div className="absolute top-1.5 right-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow" />
        </div>
      )}

      {/* Action Overlay (hover) */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onPreview(image)}
          title="Preview"
          className="p-1.5 bg-white/90 rounded-lg text-[#171717] hover:bg-white transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {image.uploadState === 'error' && (
          <button
            onClick={() => onRetry(image.id)}
            title="Retry upload"
            className="p-1.5 bg-white/90 rounded-lg text-[#171717] hover:bg-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onRemove(image.id)}
          title="Remove"
          className="p-1.5 bg-red-500/90 rounded-lg text-white hover:bg-red-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drag Handle */}
      <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-white drop-shadow" />
      </div>

      {/* Index badge */}
      <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-black/60 text-white text-[9px] font-bold rounded flex items-center justify-center">
        {index + 1}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Lightbox Preview
// ─────────────────────────────────────────────────────────────────────────────

function ImageLightbox({ image, onClose }: { image: UploadedImage; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-[#EDEDED] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#171717] truncate max-w-xs">{image.name}</p>
            <p className="text-[10px] text-[#737373]">{formatBytes(image.sizeBytes)}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={image.previewUrl}
              download={image.name}
              className="p-1.5 rounded-lg text-[#737373] hover:bg-gray-100 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#737373] hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center bg-[#F5F5F5] p-4">
          <img
            src={image.previewUrl}
            alt={image.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Preview Grid — shows all uploaded images with drag-reorder
// ─────────────────────────────────────────────────────────────────────────────

export function ImagePreviewGrid({
  images,
  platform,
  onRemove,
  onReorder,
  onRetry,
}: {
  images: UploadedImage[];
  platform: Platform;
  onRemove: (id: string) => void;
  onReorder: (newOrder: UploadedImage[]) => void;
  onRetry: (id: string) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const fromIdx = images.findIndex((i) => i.id === draggingId);
    const toIdx = images.findIndex((i) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggingId(null); return; }

    const next = [...images];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    onReorder(next);
    setDraggingId(null);
  };

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <ImageThumb
            key={img.id}
            image={img}
            index={idx}
            isCover={idx === 0}
            onRemove={onRemove}
            onPreview={setPreviewImage}
            onRetry={onRetry}
            dragging={draggingId === img.id}
            onDragStart={setDraggingId}
            onDragOver={() => {}}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Instagram carousel hint */}
      {platform === 'instagram' && images.length > 1 && (
        <p className="text-[10px] text-[#737373] flex items-center gap-1 mt-1">
          <ImageIcon className="h-3 w-3" />
          Drag to reorder carousel. First image is the cover.
        </p>
      )}

      {previewImage && (
        <ImageLightbox image={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Uploader — drop zone + file picker
// ─────────────────────────────────────────────────────────────────────────────

export function ImageUploader({
  platform,
  images,
  onFilesSelected,
  disabled,
}: {
  platform: Platform;
  images: UploadedImage[];
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxImages = PLATFORM_IMAGE_LIMITS[platform];
  const remaining = maxImages - images.length;
  const atLimit = remaining <= 0;

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setValidationError(null);
      const arr = Array.from(files);

      if (arr.length > remaining) {
        setValidationError(
          `You can add ${remaining} more image${remaining === 1 ? '' : 's'} (max ${maxImages} for this platform).`
        );
        return;
      }

      const errors: string[] = [];
      const valid: File[] = [];
      for (const file of arr) {
        const err = validateFile(file);
        if (err) {
          errors.push(`${file.name}: ${err}`);
        } else {
          valid.push(file);
        }
      }

      if (errors.length > 0) {
        setValidationError(errors[0]);
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [remaining, maxImages, onFilesSelected]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || atLimit) return;
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ''; // allow re-selecting same file
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      {!atLimit && (
        <div
          onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && !atLimit && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
            disabled
              ? 'border-[#EDEDED] bg-[#FAFAFA] opacity-50 pointer-events-none'
              : isDragOver
              ? 'border-[#FF8A00] bg-orange-50'
              : 'border-[#EDEDED] bg-[#FAFAFA] hover:border-[#FF8A00] hover:bg-orange-50/30'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-orange-100' : 'bg-[#F0F0F0]'
          }`}>
            <Upload className={`h-5 w-5 ${isDragOver ? 'text-[#FF8A00]' : 'text-[#737373]'}`} />
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-[#171717]">
              {isDragOver ? 'Drop to upload' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-[10px] text-[#737373] mt-0.5">
              JPG, PNG, WEBP · Max 5 MB · {remaining} of {maxImages} remaining
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleFileInput}
            disabled={disabled || atLimit}
          />
        </div>
      )}

      {/* At limit message */}
      {atLimit && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Maximum {maxImages} images reached for {platform === 'twitter' ? 'Twitter / X' : platform.charAt(0).toUpperCase() + platform.slice(1)}. Remove an image to add another.</span>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Media Gallery — shown in history card (read-only thumbnails)
// ─────────────────────────────────────────────────────────────────────────────

export function PostMediaGallery({
  imageUrls,
  platform,
}: {
  imageUrls: string[];
  platform: Platform;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {imageUrls.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setPreviewUrl(url)}
            className="relative rounded-xl overflow-hidden border border-[#EDEDED] hover:border-gray-300 transition-colors group"
            style={{ aspectRatio: '1' }}
          >
            <img
              src={url}
              alt={`Image ${idx + 1}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#FF8A00] text-white text-[9px] font-bold rounded-md">
                COVER
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Eye className="h-5 w-5 text-white drop-shadow" />
            </div>
          </button>
        ))}
      </div>

      {/* Full-screen preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
