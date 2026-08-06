import React, { useState } from 'react';
import {
  Copy,
  Check,
  Globe,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AiGeneratedPost,
  Platform,
  PostStatus,
  ReviewStatus,
  ThreadPost,
  PLATFORM_META,
  POST_TYPE_LABELS,
  TONE_LABELS,
} from '../../types/aiPostTypes';
import { PostMediaGallery } from './ImageUploadComponents';

// ─────────────────────────────────────────────────────────────────────────────
// Utility: copy text to clipboard
// ─────────────────────────────────────────────────────────────────────────────

function useCopyToClipboard(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };
  return { copied, copy };
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform Icon
// ─────────────────────────────────────────────────────────────────────────────

export function PlatformIcon({ platform, size = 16 }: { platform: Platform; size?: number }) {
  const dim = { width: size, height: size };

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="#0A66C2" {...dim}>
        <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.988V9h3.102v1.561h.046c.432-.818 1.487-1.681 3.062-1.681 3.274 0 3.879 2.156 3.879 4.961v6.611zM5.337 7.433a1.801 1.801 0 1 1 0-3.602 1.801 1.801 0 0 1 0 3.602zm1.558 13.019H3.776V9h3.119v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="#1877F2" {...dim}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="url(#ig-grad)" {...dim}>
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  // Twitter / X
  return (
    <svg viewBox="0 0 24 24" fill="#000" {...dim}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.904-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PostStatus, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  generated: 'bg-blue-50 text-blue-700 border-blue-200',
  edited:    'bg-amber-50 text-amber-700 border-amber-200',
  saved:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged:   'bg-red-50 text-red-700 border-red-200',
  archived:  'bg-gray-100 text-gray-500 border-gray-200',
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function ReviewBadge({ reviewStatus }: { reviewStatus: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    not_reviewed:   'bg-gray-50 text-gray-500 border-gray-200',
    reviewed:       'bg-teal-50 text-teal-700 border-teal-200',
    feedback_added: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const labels: Record<ReviewStatus, string> = {
    not_reviewed:   'Not Reviewed',
    reviewed:       'Reviewed',
    feedback_added: 'Feedback Added',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${styles[reviewStatus]}`}>
      {labels[reviewStatus]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Character Counter (Twitter / X)
// ─────────────────────────────────────────────────────────────────────────────

export function CharacterCounter({ content, limit = 280 }: { content: string; limit?: number }) {
  const len = content.length;
  const remaining = limit - len;
  const pct = Math.min((len / limit) * 100, 100);

  let color = '#22c55e'; // green
  if (pct > 80) color = '#f59e0b'; // amber
  if (pct > 95) color = '#ef4444'; // red

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#EDEDED" strokeWidth="2.5" />
          <circle
            cx="12" cy="12" r="10"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}
          />
        </svg>
      </div>
      <span
        className={`text-xs font-bold tabular-nums ${
          remaining < 0 ? 'text-red-600' : remaining < 20 ? 'text-amber-600' : 'text-[#737373]'
        }`}
      >
        {remaining < 0 ? `−${Math.abs(remaining)}` : remaining}
      </span>
      {remaining < 0 && (
        <span className="text-[10px] text-red-600 font-semibold">over limit</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thread Post Item — individually editable & copyable
// ─────────────────────────────────────────────────────────────────────────────

export function ThreadPostItem({
  post,
  index,
  onChange,
}: {
  post: ThreadPost;
  index: number;
  onChange: (id: string, content: string) => void;
}) {
  const { copied, copy } = useCopyToClipboard(post.content);
  const len = post.content.length;
  const over = len > 280;

  return (
    <div className="border border-[#EDEDED] rounded-xl p-4 bg-[#FAFAFA] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
          Post {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <CharacterCounter content={post.content} />
          <button
            onClick={copy}
            title="Copy this post"
            className="flex items-center gap-1 px-2 py-1 bg-white border border-[#EDEDED] rounded-lg text-[10px] font-bold text-[#737373] hover:text-[#171717] transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <textarea
        rows={3}
        value={post.content}
        onChange={(e) => onChange(post.id, e.target.value)}
        className={`w-full p-2.5 bg-white border rounded-lg text-xs outline-none resize-none transition-all ${
          over ? 'border-red-300 focus:ring-2 focus:ring-red-400' : 'border-[#EDEDED] focus:ring-2 focus:ring-[#FF8A00]'
        }`}
      />

      {over && (
        <p className="text-[10px] text-red-600 font-semibold">
          ⚠ This post exceeds 280 characters. Twitter/X may truncate it.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark As Published Modal
// ─────────────────────────────────────────────────────────────────────────────

export function MarkPublishedModal({
  platform,
  postId,
  isOpen,
  onClose,
  onConfirm,
}: {
  platform: Platform;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (postId: string, url: string, date: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const meta = PLATFORM_META[platform];

  const urlPlaceholders: Record<Platform, string> = {
    linkedin: 'https://www.linkedin.com/posts/...',
    facebook: 'https://www.facebook.com/...',
    instagram: 'https://www.instagram.com/p/...',
    twitter: 'https://x.com/...',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-[#171717]">Mark as Published</h3>
          <p className="text-xs text-[#737373] mt-1">
            Publishing is completed manually outside AI Apex Launchpad. Adding the post URL helps maintain your activity record.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#171717] block mb-1">Platform</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
              <PlatformIcon platform={platform} size={16} />
              <span className="font-semibold">{meta.label}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Published Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">
              Published URL <span className="text-[#737373] font-normal">(optional, recommended)</span>
            </label>
            <input
              type="url"
              placeholder={urlPlaceholders[platform]}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-[#EDEDED]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(postId, url, date);
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            Mark as Published
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post History Card
// ─────────────────────────────────────────────────────────────────────────────

export function PostHistoryCard({
  post,
  onMarkPublished,
  onArchive,
}: {
  post: AiGeneratedPost;
  onMarkPublished: (post: AiGeneratedPost) => void;
  onArchive: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useCopyToClipboard(post.editedContent);
  const isTwitter = post.platform === 'twitter';
  const isThread = isTwitter && post.twitterFormat === 'thread';

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden hover:border-gray-300 transition-all">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            <PlatformIcon platform={post.platform} size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#171717]">
                {PLATFORM_META[post.platform].label}
                {isThread ? ' — Thread' : ''}
              </span>
              <StatusBadge status={post.status} />
              <ReviewBadge reviewStatus={post.reviewStatus} />
              {post.imageUrls && post.imageUrls.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                  🖼️ {post.imageUrls.length} image{post.imageUrls.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#737373]">
              {POST_TYPE_LABELS[post.postType]} · {TONE_LABELS[post.tone]} ·{' '}
              {new Date(post.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            {post.publishedUrl && (
              <a
                href={post.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#FF8A00] font-semibold mt-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Published Post
              </a>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded((p) => !p)}
          className="p-1.5 rounded-lg text-[#737373] hover:bg-gray-100 transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Content Preview */}
      {expanded && (
        <div className="border-t border-[#EDEDED] p-4 space-y-4">
          <div className="bg-[#FAFAFA] rounded-xl p-4">
            <p className="text-xs text-[#171717] whitespace-pre-line leading-relaxed">
              {post.editedContent}
            </p>
            {isTwitter && post.twitterFormat === 'single' && (
              <div className="mt-2 flex justify-end">
                <CharacterCounter content={post.editedContent} />
              </div>
            )}
          </div>

          {isThread && post.threadPosts && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Thread</p>
              {post.threadPosts.map((tp, i) => (
                <div key={tp.id} className="border border-[#EDEDED] rounded-xl p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#737373]">Post {i + 1}</span>
                    <CharacterCounter content={tp.content} />
                  </div>
                  <p className="text-xs text-[#171717] whitespace-pre-line">{tp.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Image Gallery (read-only) */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                Images · {post.imageUrls.length}
              </p>
              <PostMediaGallery imageUrls={post.imageUrls} platform={post.platform} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-xl hover:bg-gray-100 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            {post.status !== 'published' && (
              <button
                onClick={() => onMarkPublished(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl shadow-sm"
              >
                <Globe className="h-3.5 w-3.5" />
                Mark as Published
              </button>
            )}

            {(post.status === 'draft' || post.status === 'generated' || post.status === 'saved') && (
              <button
                onClick={() => onArchive(post.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Archive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
