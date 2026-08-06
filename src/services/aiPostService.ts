import { supabase } from '../lib/supabase';
import {
  AiGeneratedPost,
  GeneratePostInput,
  MarkPublishedInput,
  Platform,
  PostType,
  Tone,
  ThreadPost,
  PLATFORM_META,
  POST_TYPE_LABELS,
  TONE_LABELS,
} from '../types/aiPostTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Local Content Generator (no external AI API required for demo)
// Generates realistic, platform-appropriate content deterministically
// ─────────────────────────────────────────────────────────────────────────────

function generateLinkedInContent(input: GeneratePostInput, internName: string): string {
  const postTypeLabel = POST_TYPE_LABELS[input.postType];
  const toneAdverbs: Record<Tone, string> = {
    professional: 'I am pleased to share that',
    enthusiastic: 'Excited to share that',
    reflective: 'Reflecting on this week,',
    concise: 'Quick update:',
    storytelling: 'Here is what I have been working on:',
  };

  const opener = toneAdverbs[input.tone];

  return `${opener} as part of my internship at AI Apex Launchpad, I have been making significant progress on ${input.inputData}.

As an intern working on ${input.postType.replace(/_/g, ' ')} tasks, I have had the opportunity to dive deep into real-world challenges. This experience has strengthened my understanding of modern software development workflows and collaborative problem-solving.

Key highlights from this ${postTypeLabel.toLowerCase()} phase:
• Gained hands-on experience implementing production-grade solutions
• Collaborated with a cross-functional team of interns and admins
• Applied theoretical knowledge to real-world engineering challenges
• Improved my ability to communicate technical concepts clearly

I am grateful to the AI Apex Launchpad team for creating an environment where learning is embedded into every task. The structured internship format — from onboarding to active project work — has been genuinely valuable.

If you are interested in learning more about AI, machine learning, and software development, I highly recommend structured internship programs.

#AIApex #InternshipLearning #SoftwareDevelopment #AIEngineering #CareerGrowth`;
}

function generateFacebookContent(input: GeneratePostInput, internName: string): string {
  return `Update from my internship journey at AI Apex Launchpad! 🚀

This week I have been working on ${input.inputData}, and the progress has been really rewarding. As someone who wanted hands-on experience in the AI and software development space, this internship has exceeded my expectations.

What I have been learning:
✅ Real-world application of AI concepts
✅ Working in a professional team environment  
✅ Building and deploying production-ready features
✅ Receiving structured feedback from experienced mentors

Every day brings new challenges and new learning opportunities. The combination of technical projects, peer collaboration, and structured mentorship makes AI Apex Launchpad an excellent place to grow.

Grateful for this experience and looking forward to sharing more updates as I continue my internship journey!

#AIApex #Internship #LearningAndGrowth #TechInternship`;
}

function generateInstagramContent(input: GeneratePostInput): string {
  return `Internship life at AI Apex Launchpad ✨

Working on ${input.inputData} this week and the growth has been incredible. From building real features to collaborating with amazing teammates — every day is a learning experience.

The journey continues! 🚀

#AIApex #InternLife #TechIntern #LearningEveryDay #AIEngineering #SoftwareDev #CareerJourney #InternshipExperience`;
}

function generateTwitterContent(input: GeneratePostInput): string {
  const shortInput =
    input.inputData.length > 60
      ? input.inputData.substring(0, 57) + '...'
      : input.inputData;

  return `Just completed work on ${shortInput} during my #AIApex internship! Loving the hands-on experience. #AIEngineering #InternLife`;
}

function generateTwitterThread(input: GeneratePostInput): ThreadPost[] {
  return [
    {
      id: `thread-${Date.now()}-1`,
      content: `1/ Internship update from @AIApexLaunchpad — here's what I've been working on this week. 🧵`,
    },
    {
      id: `thread-${Date.now()}-2`,
      content: `2/ Completed work on: ${input.inputData.length > 120 ? input.inputData.substring(0, 120) + '...' : input.inputData}`,
    },
    {
      id: `thread-${Date.now()}-3`,
      content: `3/ Key learning: Real-world engineering challenges teach you far more than textbooks. Every problem has context that matters. 💡`,
    },
    {
      id: `thread-${Date.now()}-4`,
      content: `4/ Grateful for the structured mentorship at #AIApex. Growth is happening fast. More updates coming! #Internship #AIEngineering`,
    },
  ];
}

function generateContent(input: GeneratePostInput, internName: string): string {
  switch (input.platform) {
    case 'linkedin':  return generateLinkedInContent(input, internName);
    case 'facebook':  return generateFacebookContent(input, internName);
    case 'instagram': return generateInstagramContent(input);
    case 'twitter':   return generateTwitterContent(input);
    default:          return generateLinkedInContent(input, internName);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample fallback data
// ─────────────────────────────────────────────────────────────────────────────

export const samplePosts: AiGeneratedPost[] = [
  {
    id: 'post-sample-1',
    internId: 'demo-user',
    platform: 'linkedin',
    postType: 'project_update',
    tone: 'professional',
    inputData: 'AI Automated Workflow & Intelligent Data Pipeline Engine — Module 5 Profile completion',
    generatedContent: `I am pleased to share that as part of my internship at AI Apex Launchpad, I have made significant progress on the AI Automated Workflow & Intelligent Data Pipeline Engine project.\n\nThis week marked the completion of the Profile module — a key component that stores and displays verified internship-related information while maintaining clear separation between editable personal data and system-controlled internship data.\n\n#AIApex #InternshipLearning #SoftwareDevelopment`,
    editedContent: `I am pleased to share that as part of my internship at AI Apex Launchpad, I have made significant progress on the AI Automated Workflow & Intelligent Data Pipeline Engine project.\n\nThis week marked the completion of the Profile module — a key component that stores and displays verified internship-related information while maintaining clear separation between editable personal data and system-controlled internship data.\n\n#AIApex #InternshipLearning #SoftwareDevelopment`,
    status: 'published',
    reviewStatus: 'not_reviewed',
    publishedAt: '2026-08-01T10:30:00Z',
    publishedUrl: 'https://www.linkedin.com/posts/sample-post',
    generatedAt: '2026-08-01T09:15:00Z',
    createdAt: '2026-08-01T09:15:00Z',
    updatedAt: '2026-08-01T10:30:00Z',
  },
  {
    id: 'post-sample-2',
    internId: 'demo-user',
    platform: 'twitter',
    postType: 'achievement',
    tone: 'enthusiastic',
    inputData: 'Completed Community module with real-time post feed',
    generatedContent: `Just shipped the Community module at #AIApex! Real-time feed, post creation, category filters + search all working. Loving this internship! #ReactJS #Supabase`,
    editedContent: `Just shipped the Community module at #AIApex! Real-time feed, post creation, category filters + search all working. Loving this internship! #ReactJS #Supabase`,
    twitterFormat: 'single',
    status: 'saved',
    reviewStatus: 'not_reviewed',
    generatedAt: '2026-08-02T14:00:00Z',
    createdAt: '2026-08-02T14:00:00Z',
    updatedAt: '2026-08-02T14:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new AI post from input parameters.
 * This does NOT require any approval — it creates a Generated status draft.
 */
export async function generateAiPost(
  userId: string,
  internName: string,
  input: GeneratePostInput
): Promise<AiGeneratedPost> {
  const now = new Date().toISOString();
  const content = generateContent(input, internName);
  const threadPosts =
    input.platform === 'twitter' && input.twitterFormat === 'thread'
      ? generateTwitterThread(input)
      : undefined;

  const post: AiGeneratedPost = {
    id: `post-${Date.now()}`,
    internId: userId,
    platform: input.platform,
    postType: input.postType,
    tone: input.tone,
    inputData: input.inputData,
    generatedContent: content,
    editedContent: content,
    threadPosts,
    twitterFormat: input.twitterFormat,
    status: 'generated',
    reviewStatus: 'not_reviewed',
    generatedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // Persist to Supabase if available
  try {
    await supabase.from('ai_generated_posts').insert([{
      id: post.id,
      intern_id: userId,
      platform: input.platform,
      post_type: input.postType,
      tone: input.tone,
      input_data: input.inputData,
      generated_content: content,
      edited_content: content,
      status: 'generated',
      review_status: 'not_reviewed',
      generated_at: now,
      created_at: now,
      updated_at: now,
    }]);
  } catch {
    // Offline/DB unavailable — post lives in local state
  }

  return post;
}

/**
 * Save an edited draft — no approval required
 */
export async function saveDraft(
  postId: string,
  editedContent: string,
  threadPosts?: ThreadPost[]
): Promise<boolean> {
  try {
    await supabase
      .from('ai_generated_posts')
      .update({ edited_content: editedContent, status: 'saved', updated_at: new Date().toISOString() })
      .eq('id', postId);
  } catch {
    // offline
  }
  return true;
}

/**
 * Mark a post as published — available at any time, no approval gate
 */
export async function markAsPublished(
  input: MarkPublishedInput
): Promise<boolean> {
  try {
    await supabase
      .from('ai_generated_posts')
      .update({
        status: 'published',
        published_url: input.publishedUrl || null,
        published_at: input.publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.postId);
  } catch {
    // offline
  }
  return true;
}

/**
 * Fetch all posts for the current intern (RLS-protected on DB side)
 */
export async function fetchMyPosts(userId: string): Promise<AiGeneratedPost[]> {
  try {
    const { data, error } = await supabase
      .from('ai_generated_posts')
      .select('*')
      .eq('intern_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return samplePosts.filter((p) => p.internId === userId || p.internId === 'demo-user');
    }

    return data.map((row: any): AiGeneratedPost => ({
      id: row.id,
      internId: row.intern_id,
      platform: row.platform as Platform,
      postType: row.post_type,
      tone: row.tone,
      inputData: row.input_data || '',
      generatedContent: row.generated_content || '',
      editedContent: row.edited_content || row.generated_content || '',
      status: row.status,
      reviewStatus: row.review_status || 'not_reviewed',
      publishedUrl: row.published_url,
      publishedAt: row.published_at,
      generatedAt: row.generated_at || row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      imageUrls: row.image_urls || [],
      coverImageUrl: row.cover_image_url || undefined,
    }));
  } catch {
    return samplePosts;
  }
}

/**
 * Delete (soft-archive) a draft
 */
export async function archivePost(postId: string): Promise<boolean> {
  try {
    await supabase
      .from('ai_generated_posts')
      .update({ status: 'archived', deleted_at: new Date().toISOString() })
      .eq('id', postId);
  } catch {
    // offline
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Upload Service
// Storage bucket: post-images
// Path pattern:   post-images/{internId}/{postId}/{filename}
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET = 'post-images';

/**
 * Upload a single image file to Supabase Storage.
 * Returns the public/signed URL and storage path on success.
 * On network failure the function still resolves (offline-safe).
 */
export async function uploadPostImage(
  internId: string,
  postId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ storedUrl: string; storagePath: string } | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${internId}/${postId}/${uniqueName}`;

  onProgress?.(10);

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    onProgress?.(80);

    if (error) {
      console.warn('[ImageUpload] Storage upload error:', error.message);
      // Fallback: use a local object URL so the UI keeps working offline
      const localUrl = URL.createObjectURL(file);
      onProgress?.(100);
      return { storedUrl: localUrl, storagePath };
    }

    // Generate a signed URL (valid 1 hour) so the image isn't publicly accessible
    const { data: signedData, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    onProgress?.(100);

    if (signErr || !signedData?.signedUrl) {
      // Fall back to object URL if signing fails
      return { storedUrl: URL.createObjectURL(file), storagePath };
    }

    return { storedUrl: signedData.signedUrl, storagePath };
  } catch {
    // Network offline: return a local object URL so the flow continues
    onProgress?.(100);
    return { storedUrl: URL.createObjectURL(file), storagePath };
  }
}

/**
 * Remove a single image from Supabase Storage.
 * Silently succeeds if the file doesn't exist or network is unavailable.
 */
export async function removePostImage(storagePath: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch {
    // offline — ignore
  }
}

/**
 * Persist the ordered image URL list back to the database row.
 * The first URL is automatically set as cover_image_url.
 */
export async function updatePostImageUrls(
  postId: string,
  imageUrls: string[]
): Promise<void> {
  try {
    await supabase
      .from('ai_generated_posts')
      .update({
        image_urls: imageUrls,
        cover_image_url: imageUrls[0] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);
  } catch {
    // offline
  }
}
