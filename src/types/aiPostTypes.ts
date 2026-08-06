// ─────────────────────────────────────────────────────────────────────────────
// AI Post Generation — Type Definitions
// Core principle: No blocking approval. Review is optional and post-publishing.
// ─────────────────────────────────────────────────────────────────────────────

export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'twitter';

/** Max images per platform before publishing */
export const PLATFORM_IMAGE_LIMITS: Record<Platform, number> = {
  linkedin: 10,
  facebook: 10,
  instagram: 10,
  twitter: 4,
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Tracks a single uploaded image in the UI */
export interface UploadedImage {
  /** Unique UI key (not the Supabase path) */
  id: string;
  file?: File;
  /** Object URL for immediate preview — only available before page reload */
  previewUrl: string;
  /** Persisted Supabase Storage signed URL */
  storedUrl?: string;
  /** Storage path, e.g. post-images/{internId}/{postId}/image.jpg */
  storagePath?: string;
  name: string;
  sizeBytes: number;
  /** Upload lifecycle */
  uploadState: 'pending' | 'uploading' | 'done' | 'error';
  uploadProgress: number;
  errorMessage?: string;
}

export const PLATFORM_META: Record<
  Platform,
  {
    label: string;
    description: string;
    minWords: number;
    maxWords: number;
    charLimit: number | null;
    supportsThread: boolean;
    color: string;
  }
> = {
  linkedin: {
    label: 'LinkedIn',
    description: 'Professional network post',
    minWords: 150,
    maxWords: 350,
    charLimit: null,
    supportsThread: false,
    color: '#0A66C2',
  },
  facebook: {
    label: 'Facebook',
    description: 'Social update post',
    minWords: 80,
    maxWords: 220,
    charLimit: null,
    supportsThread: false,
    color: '#1877F2',
  },
  instagram: {
    label: 'Instagram',
    description: 'Visual-led caption post',
    minWords: 50,
    maxWords: 150,
    charLimit: null,
    supportsThread: false,
    color: '#E1306C',
  },
  twitter: {
    label: 'Twitter / X',
    description: 'Short-form post (≤280 chars)',
    minWords: 0,
    maxWords: 0,
    charLimit: 280,
    supportsThread: true,
    color: '#000000',
  },
};

export type PostType =
  | 'learning_update'
  | 'project_update'
  | 'achievement'
  | 'technical_insight'
  | 'problem_statement_progress'
  | 'internship_experience'
  | 'resource_sharing';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  learning_update: 'Learning Update',
  project_update: 'Project Update',
  achievement: 'Achievement',
  technical_insight: 'Technical Insight',
  problem_statement_progress: 'Problem Statement Progress',
  internship_experience: 'Internship Experience',
  resource_sharing: 'Resource Sharing',
};

export type Tone =
  | 'professional'
  | 'enthusiastic'
  | 'reflective'
  | 'concise'
  | 'storytelling';

export const TONE_LABELS: Record<Tone, string> = {
  professional: 'Professional',
  enthusiastic: 'Enthusiastic',
  reflective: 'Reflective',
  concise: 'Concise',
  storytelling: 'Storytelling',
};

/** Publishing status — never blocked by review state */
export type PostStatus =
  | 'draft'
  | 'generated'
  | 'edited'
  | 'saved'
  | 'published'
  | 'flagged'
  | 'archived';

/** Optional review metadata — separate from publishing status */
export type ReviewStatus = 'not_reviewed' | 'reviewed' | 'feedback_added';

export type TwitterFormat = 'single' | 'thread';

export interface ThreadPost {
  id: string;
  content: string;
}

export interface AiGeneratedPost {
  id: string;
  internId: string;
  platform: Platform;
  postType: PostType;
  tone: Tone;
  /** Raw input the user typed to drive generation */
  inputData: string;
  /** AI-generated text */
  generatedContent: string;
  /** Intern-edited text (starts equal to generatedContent) */
  editedContent: string;
  /** Thread posts — only populated when platform=twitter && format=thread */
  threadPosts?: ThreadPost[];
  twitterFormat?: TwitterFormat;
  status: PostStatus;
  reviewStatus: ReviewStatus;
  publishedUrl?: string;
  publishedAt?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Ordered list of persisted Supabase Storage signed/public URLs */
  imageUrls?: string[];
  /** First image in the ordered list — set automatically */
  coverImageUrl?: string;
}

export interface GeneratePostInput {
  platform: Platform;
  postType: PostType;
  tone: Tone;
  inputData: string;
  twitterFormat?: TwitterFormat;
}

export interface MarkPublishedInput {
  postId: string;
  platform: Platform;
  publishedAt: string;
  publishedUrl?: string;
}
