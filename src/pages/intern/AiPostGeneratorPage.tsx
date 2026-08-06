import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  generateAiPost,
  fetchMyPosts,
  saveDraft,
  markAsPublished,
  archivePost,
  uploadPostImage,
  removePostImage,
  updatePostImageUrls,
} from '../../services/aiPostService';
import {
  PlatformIcon,
  StatusBadge,
  ReviewBadge,
  CharacterCounter,
  ThreadPostItem,
  MarkPublishedModal,
  PostHistoryCard,
} from '../../components/ai-post/AiPostComponents';
import {
  ImageUploader,
  ImagePreviewGrid,
} from '../../components/ai-post/ImageUploadComponents';
import {
  AiGeneratedPost,
  Platform,
  PostType,
  Tone,
  TwitterFormat,
  ThreadPost,
  UploadedImage,
  PLATFORM_META,
  POST_TYPE_LABELS,
  TONE_LABELS,
  GeneratePostInput,
} from '../../types/aiPostTypes';
import {
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  Globe,
  RefreshCw,
  Scissors,
  History,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Platform Selector Tab
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter'];

function PlatformTab({
  platform,
  isActive,
  onClick,
}: {
  platform: Platform;
  isActive: boolean;
  onClick: () => void;
}) {
  const meta = PLATFORM_META[platform];
  return (
    <button
      id={`ai-post-platform-${platform}`}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
        isActive
          ? 'bg-white border-[#EDEDED] shadow-sm text-[#171717]'
          : 'bg-transparent border-transparent text-[#737373] hover:text-[#171717] hover:bg-white/60'
      }`}
    >
      <PlatformIcon platform={platform} size={15} />
      <span>{meta.label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Select field helper
// ─────────────────────────────────────────────────────────────────────────────

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#171717] mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#171717] outline-none focus:ring-2 focus:ring-[#FF8A00] pr-8"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Tab
// ─────────────────────────────────────────────────────────────────────────────

type PageTab = 'generate' | 'history';

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function AiPostGeneratorPage() {
  const { user } = useAuth();

  const userId      = (user as any)?.id                         || 'demo-user';
  const userName    = (user as any)?.user_metadata?.full_name   || 'Intern User';

  // ── Page Tab ──────────────────────────────────────────────────────────────
  const [pageTab, setPageTab] = useState<PageTab>('generate');

  // ── Generator Form State ─────────────────────────────────────────────────
  const [platform, setPlatform]       = useState<Platform>('linkedin');
  const [postType, setPostType]       = useState<PostType>('learning_update');
  const [tone, setTone]               = useState<Tone>('professional');
  const [twitterFormat, setTwitterFormat] = useState<TwitterFormat>('single');
  const [inputData, setInputData]     = useState('');
  const [generating, setGenerating]   = useState(false);

  // ── Generated Post State ─────────────────────────────────────────────────
  const [currentPost, setCurrentPost] = useState<AiGeneratedPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [threadPosts, setThreadPosts] = useState<ThreadPost[]>([]);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [copied, setCopied]           = useState(false);

  // ── Publish Modal ─────────────────────────────────────────────────────────
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingPost, setPublishingPost] = useState<AiGeneratedPost | null>(null);

  // ── History State ─────────────────────────────────────────────────────────
  const [myPosts, setMyPosts]         = useState<AiGeneratedPost[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Image Upload State ────────────────────────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const isTwitter = platform === 'twitter';
  const meta = PLATFORM_META[platform];

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const posts = await fetchMyPosts(userId);
    setMyPosts(posts);
    setLoadingHistory(false);
  }, [userId]);

  useEffect(() => {
    if (pageTab === 'history') {
      loadHistory();
    }
  }, [pageTab, loadHistory]);

  // ── Generate Post ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!inputData.trim()) return;
    setGenerating(true);
    setSaved(false);

    const input: GeneratePostInput = {
      platform,
      postType,
      tone,
      inputData: inputData.trim(),
      twitterFormat: isTwitter ? twitterFormat : undefined,
    };

    const post = await generateAiPost(userId, userName, input);
    setCurrentPost(post);
    setEditedContent(post.editedContent);
    setThreadPosts(post.threadPosts || []);
    // Reset images when regenerating
    setUploadedImages([]);
    setGenerating(false);
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const textToCopy =
      isTwitter && twitterFormat === 'thread'
        ? threadPosts.map((tp, i) => `${tp.content}`).join('\n\n---\n\n')
        : editedContent;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {/* ignore */}
  };

  // ── Save Draft ────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!currentPost) return;
    setSaving(true);
    await saveDraft(currentPost.id, editedContent, threadPosts.length > 0 ? threadPosts : undefined);
    setCurrentPost((p) => p ? { ...p, status: 'saved', editedContent } : p);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Shorten for X ─────────────────────────────────────────────────────────
  const handleShortenForX = () => {
    const shortened = editedContent
      .replace(/\n+/g, ' ')
      .replace(/#\w+/g, '')
      .trim()
      .substring(0, 270) + '… #AIApex';
    setEditedContent(shortened);
    if (currentPost) {
      setCurrentPost((p) => p ? { ...p, editedContent: shortened, status: 'edited' } : p);
    }
  };

  // ── Convert to Thread ─────────────────────────────────────────────────────
  const handleConvertToThread = () => {
    const words = editedContent.split(' ');
    const chunks: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 250) {
        chunks.push(current.trim());
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) chunks.push(current.trim());

    const newThreadPosts: ThreadPost[] = chunks
      .slice(0, 4)
      .map((content, i) => ({
        id: `thread-converted-${Date.now()}-${i}`,
        content: i === 0 ? `1/ ${content}` : `${i + 1}/ ${content}`,
      }));

    setTwitterFormat('thread');
    setThreadPosts(newThreadPosts);
    if (currentPost) {
      setCurrentPost((p) => p ? { ...p, twitterFormat: 'thread', threadPosts: newThreadPosts } : p);
    }
  };

  // ── Thread post update ────────────────────────────────────────────────────
  const handleThreadPostChange = (id: string, content: string) => {
    setThreadPosts((prev) => prev.map((tp) => (tp.id === id ? { ...tp, content } : tp)));
  };

  // ── Mark as Published (from editor) ──────────────────────────────────────
  const handleMarkPublished = (post: AiGeneratedPost) => {
    setPublishingPost(post);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = async (postId: string, url: string, date: string) => {
    await markAsPublished({ postId, platform, publishedAt: date, publishedUrl: url || undefined });
    if (currentPost && currentPost.id === postId) {
      setCurrentPost((p) => p ? { ...p, status: 'published', publishedUrl: url, publishedAt: date } : p);
    }
    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: 'published', publishedUrl: url, publishedAt: date } : p
      )
    );
    setShowPublishModal(false);
  };

  // ── Archive ───────────────────────────────────────────────────────────────
  const handleArchive = async (postId: string) => {
    await archivePost(postId);
    setMyPosts((prev) => prev.filter((p) => p.id !== postId));
    if (currentPost?.id === postId) {
      setCurrentPost(null);
      setUploadedImages([]);
    }
  };

  // ── Image Upload Handlers ─────────────────────────────────────────────────
  const handleAddFiles = useCallback(async (files: File[]) => {
    if (!currentPost) return;

    const newItems: UploadedImage[] = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      sizeBytes: file.size,
      uploadState: 'uploading',
      uploadProgress: 0,
    }));

    setUploadedImages((prev) => [...prev, ...newItems]);

    // Upload each file independently so one failure doesn't block others
    for (const item of newItems) {
      const result = await uploadPostImage(
        userId,
        currentPost.id,
        item.file!,
        (pct) => {
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === item.id ? { ...img, uploadProgress: pct } : img
            )
          );
        }
      );

      setUploadedImages((prev) => {
        const next = prev.map((img) =>
          img.id === item.id
            ? result
              ? { ...img, uploadState: 'done' as const, uploadProgress: 100, storedUrl: result.storedUrl, storagePath: result.storagePath }
              : { ...img, uploadState: 'error' as const, uploadProgress: 0, errorMessage: 'Upload failed. Click retry.' }
            : img
        );
        // Persist image URL list to DB
        const doneUrls = next.filter((i) => i.uploadState === 'done' && i.storedUrl).map((i) => i.storedUrl!);
        updatePostImageUrls(currentPost.id, doneUrls);
        return next;
      });
    }
  }, [currentPost, userId]);

  const handleRemoveImage = useCallback(async (id: string) => {
    const img = uploadedImages.find((i) => i.id === id);
    if (!img) return;
    // Remove from storage
    if (img.storagePath) {
      await removePostImage(img.storagePath);
    }
    // Revoke object URL to free memory
    if (img.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(img.previewUrl);
    }
    setUploadedImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (currentPost) {
        const doneUrls = next.filter((i) => i.uploadState === 'done' && i.storedUrl).map((i) => i.storedUrl!);
        updatePostImageUrls(currentPost.id, doneUrls);
      }
      return next;
    });
  }, [uploadedImages, currentPost]);

  const handleReorderImages = useCallback((newOrder: UploadedImage[]) => {
    setUploadedImages(newOrder);
    if (currentPost) {
      const doneUrls = newOrder.filter((i) => i.uploadState === 'done' && i.storedUrl).map((i) => i.storedUrl!);
      updatePostImageUrls(currentPost.id, doneUrls);
    }
  }, [currentPost]);

  const handleRetryUpload = useCallback(async (id: string) => {
    const img = uploadedImages.find((i) => i.id === id);
    if (!img || !img.file || !currentPost) return;

    setUploadedImages((prev) =>
      prev.map((i) => i.id === id ? { ...i, uploadState: 'uploading', uploadProgress: 0, errorMessage: undefined } : i)
    );

    const result = await uploadPostImage(
      userId,
      currentPost.id,
      img.file,
      (pct) => {
        setUploadedImages((prev) =>
          prev.map((i) => i.id === id ? { ...i, uploadProgress: pct } : i)
        );
      }
    );

    setUploadedImages((prev) => {
      const next = prev.map((i) =>
        i.id === id
          ? result
            ? { ...i, uploadState: 'done' as const, uploadProgress: 100, storedUrl: result.storedUrl, storagePath: result.storagePath }
            : { ...i, uploadState: 'error' as const, uploadProgress: 0, errorMessage: 'Upload failed again. Try a different image.' }
          : i
      );
      const doneUrls = next.filter((i) => i.uploadState === 'done' && i.storedUrl).map((i) => i.storedUrl!);
      updatePostImageUrls(currentPost.id, doneUrls);
      return next;
    });
  }, [uploadedImages, currentPost, userId]);

  // ── Char limit warning for Twitter single ────────────────────────────────
  const isOverLimit = isTwitter && twitterFormat === 'single' && editedContent.length > 280;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">AI Post Generation</h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Generate platform-optimised professional posts from your internship activity.
          </p>
        </div>

        {/* Page Tab Toggle */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-xl p-1 self-start sm:self-auto">
          <button
            id="ai-post-tab-generate"
            onClick={() => setPageTab('generate')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              pageTab === 'generate' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#737373]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </button>
          <button
            id="ai-post-tab-history"
            onClick={() => setPageTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              pageTab === 'history' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#737373]'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            My Posts
          </button>
        </div>
      </div>

      {/* ── GENERATE TAB ── */}
      {pageTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Generator Form */}
          <div className="lg:col-span-2 space-y-4">

            {/* Platform Selector */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                Platform
              </h2>
              <div className="bg-[#F5F5F5] rounded-xl p-1 grid grid-cols-2 gap-1">
                {PLATFORMS.map((p) => (
                  <PlatformTab
                    key={p}
                    platform={p}
                    isActive={platform === p}
                    onClick={() => {
                      setPlatform(p);
                      setCurrentPost(null);
                      setEditedContent('');
                      setThreadPosts([]);
                    }}
                  />
                ))}
              </div>

              {/* Platform description */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
                <PlatformIcon platform={platform} size={14} />
                <div>
                  <p className="text-[11px] font-bold text-[#171717]">{meta.label}</p>
                  <p className="text-[10px] text-[#737373] mt-0.5">
                    {meta.charLimit
                      ? `Max ${meta.charLimit} characters per post`
                      : `${meta.minWords}–${meta.maxWords} words suggested`}
                  </p>
                </div>
              </div>

              {/* Twitter Format (single vs thread) */}
              {isTwitter && (
                <div>
                  <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-2">
                    Format
                  </p>
                  <div className="flex items-center gap-2">
                    {(['single', 'thread'] as TwitterFormat[]).map((f) => (
                      <button
                        key={f}
                        id={`ai-post-twitter-format-${f}`}
                        onClick={() => setTwitterFormat(f)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          twitterFormat === f
                            ? 'bg-black text-white border-black'
                            : 'bg-[#FAFAFA] text-[#737373] border-[#EDEDED] hover:border-gray-300'
                        }`}
                      >
                        {f === 'single' ? 'Single Post' : 'Thread'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Post Settings */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                Post Settings
              </h2>

              <SelectField
                id="ai-post-type"
                label="Post Type"
                value={postType}
                onChange={setPostType}
                options={Object.entries(POST_TYPE_LABELS).map(([v, l]) => ({ value: v as PostType, label: l }))}
              />

              <SelectField
                id="ai-post-tone"
                label="Tone"
                value={tone}
                onChange={setTone}
                options={Object.entries(TONE_LABELS).map(([v, l]) => ({ value: v as Tone, label: l }))}
              />
            </div>

            {/* Input */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                What to Post About
              </h2>
              <textarea
                id="ai-post-input"
                rows={4}
                placeholder={`Describe what you worked on, learned, or achieved…\n\nExample: Completed the Community module with real-time post feed and category filters using React + Supabase.`}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs resize-none outline-none focus:ring-2 focus:ring-[#FF8A00] transition-all"
              />

              <button
                id="ai-post-generate-btn"
                onClick={handleGenerate}
                disabled={!inputData.trim() || generating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 disabled:opacity-50 hover:opacity-95 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Post
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Generated Post Editor */}
          <div className="lg:col-span-3">
            {!currentPost && !generating && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-dashed border-[#EDEDED] rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8A00]/10 to-[#FF3D00]/10 border border-orange-200 flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-[#FF8A00]" />
                </div>
                <p className="text-sm font-bold text-[#171717] mb-1">No Post Generated Yet</p>
                <p className="text-xs text-[#737373] max-w-xs">
                  Select a platform, set your post type and tone, describe what you worked on, then click Generate Post.
                </p>
              </div>
            )}

            {generating && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-[#EDEDED] rounded-2xl p-10 text-center">
                <Loader2 className="h-10 w-10 text-[#FF8A00] animate-spin mb-4" />
                <p className="text-sm font-bold text-[#171717]">Generating your {PLATFORM_META[platform].label} post…</p>
                <p className="text-xs text-[#737373] mt-1">Tailoring content to your platform and tone.</p>
              </div>
            )}

            {currentPost && !generating && (
              <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-4 overflow-hidden">
                {/* Editor Header */}
                <div className="p-4 border-b border-[#EDEDED] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={platform} size={18} />
                    <div>
                      <p className="text-xs font-bold text-[#171717]">
                        {PLATFORM_META[platform].label}
                        {isTwitter && ` — ${twitterFormat === 'thread' ? 'Thread' : 'Single Post'}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={currentPost.status} />
                        <ReviewBadge reviewStatus={currentPost.reviewStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Regenerate */}
                  <button
                    id="ai-post-regenerate-btn"
                    onClick={handleGenerate}
                    disabled={generating}
                    title="Regenerate"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                </div>

                {/* Editor Body */}
                <div className="p-4 space-y-4">

                  {/* Single post editor */}
                  {!(isTwitter && twitterFormat === 'thread') && (
                    <div className="space-y-2">
                      <textarea
                        id="ai-post-content-editor"
                        rows={10}
                        value={editedContent}
                        onChange={(e) => {
                          setEditedContent(e.target.value);
                          setCurrentPost((p) => p ? { ...p, editedContent: e.target.value, status: 'edited' } : p);
                        }}
                        className={`w-full p-4 bg-[#FAFAFA] border rounded-xl text-xs leading-relaxed resize-none outline-none transition-all ${
                          isOverLimit
                            ? 'border-red-300 focus:ring-2 focus:ring-red-400'
                            : 'border-[#EDEDED] focus:ring-2 focus:ring-[#FF8A00]'
                        }`}
                      />

                      {/* Twitter char counter */}
                      {isTwitter && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CharacterCounter content={editedContent} />
                            {isOverLimit && (
                              <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Exceeds 280 characters
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isOverLimit && (
                              <>
                                <button
                                  id="ai-post-shorten-btn"
                                  onClick={handleShortenForX}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <Scissors className="h-3.5 w-3.5" />
                                  Shorten for X
                                </button>
                                <button
                                  id="ai-post-convert-thread-btn"
                                  onClick={handleConvertToThread}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Convert to Thread
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Twitter thread editor */}
                  {isTwitter && twitterFormat === 'thread' && threadPosts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                          Thread — {threadPosts.length} posts
                        </p>
                        <button
                          id="ai-post-copy-full-thread-btn"
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-lg hover:bg-gray-100"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? 'Copied!' : 'Copy Full Thread'}
                        </button>
                      </div>
                      {threadPosts.map((tp, i) => (
                        <ThreadPostItem
                          key={tp.id}
                          post={tp}
                          index={i}
                          onChange={handleThreadPostChange}
                        />
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EDEDED]">
                    {/* Copy */}
                    {!(isTwitter && twitterFormat === 'thread') && (
                      <button
                        id="ai-post-copy-btn"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy Text'}
                      </button>
                    )}

                    {/* Save Draft */}
                    <button
                      id="ai-post-save-draft-btn"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : saved ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <BookmarkPlus className="h-3.5 w-3.5" />
                      )}
                      {saved ? 'Saved!' : 'Save Draft'}
                    </button>

                    {/* Mark as Published */}
                    <button
                      id="ai-post-mark-published-btn"
                      onClick={() => handleMarkPublished(currentPost)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl shadow-md"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Mark as Published
                    </button>
                  </div>

                  {/* No Approval Notice */}
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                    <span className="mt-0.5 shrink-0">✓</span>
                    <span>
                      <strong>No approval required.</strong> You can copy, save, or mark this post as published at any time. Admin and Super Admin feedback, if any, will be visible below and is optional.
                    </span>
                  </div>

                  {/* ── MEDIA SECTION ── */}
                  <div className="pt-2 border-t border-[#EDEDED] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#171717] uppercase tracking-wider">Media</p>
                        <p className="text-[10px] text-[#737373] mt-0.5">
                          Upload images to attach to this post (JPG, PNG, WEBP · 5 MB max each)
                        </p>
                      </div>
                      {uploadedImages.length > 0 && (
                        <span className="text-[10px] font-bold text-[#737373] bg-[#F5F5F5] px-2 py-1 rounded-lg">
                          {uploadedImages.length} image{uploadedImages.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <ImageUploader
                      platform={platform}
                      images={uploadedImages}
                      onFilesSelected={handleAddFiles}
                      disabled={!currentPost}
                    />

                    {uploadedImages.length > 0 && (
                      <ImagePreviewGrid
                        images={uploadedImages}
                        platform={platform}
                        onRemove={handleRemoveImage}
                        onReorder={handleReorderImages}
                        onRetry={handleRetryUpload}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {pageTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#737373]">
              Your generated and published posts. Only you can see these.
            </p>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#737373] bg-white border border-[#EDEDED] rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-[#FF8A00] animate-spin" />
            </div>
          ) : myPosts.length === 0 ? (
            <div className="bg-white border border-dashed border-[#EDEDED] rounded-2xl p-12 text-center">
              <Sparkles className="h-8 w-8 text-[#FF8A00] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#171717] mb-1">No posts yet</p>
              <p className="text-xs text-[#737373]">Generate your first post to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPosts.map((post) => (
                <PostHistoryCard
                  key={post.id}
                  post={post}
                  onMarkPublished={handleMarkPublished}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mark as Published Modal */}
      {showPublishModal && publishingPost && (
        <MarkPublishedModal
          platform={publishingPost.platform}
          postId={publishingPost.id}
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={handlePublishConfirm}
        />
      )}
    </div>
  );
}
