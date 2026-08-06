import { supabase } from '../lib/supabase';
import { CommunityPost, CreatePostPayload, CommunityComment } from '../types/communityTypes';

export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('*, community_post_likes(user_id), community_post_comments(id)')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) return [];

    const authorIds = Array.from(new Set(posts.map(p => p.author_id)));
    
    let profilesMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase.rpc('get_community_author_profiles', {
        p_user_ids: authorIds
      });
        
      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    return posts.map((item: any) => {
      const author = profilesMap[item.author_id] || {};
      const likesList = item.community_post_likes || [];
      return {
        id: item.id,
        authorId: item.author_id,
        authorName: author.full_name || 'Unknown User',
        authorPhotoUrl: author.profile_photo_url,
        authorRole: author.role || 'INTERN',
        problemStatementTitle: undefined,
        postType: 'General Discussion', // Fake required by UI types
        category: 'General', // Fake required by UI types
        title: item.title,
        content: item.content,
        isOfficial: false,
        isPinned: !!item.is_pinned,
        likesCount: likesList.length,
        isLiked: currentUserId ? likesList.some((l: any) => l.user_id === currentUserId) : false,
        commentsCount: (item.community_post_comments || []).length,
        createdAt: item.created_at
      };
    });
  } catch (err) {
    console.error('[CommunityService] Error fetching posts:', err);
    throw err;
  }
}

export async function createCommunityTextPost(userId: string, payload: CreatePostPayload): Promise<{ success: boolean; newPost: CommunityPost }> {
  try {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('full_name, profile_photo_url, problem_statement_id')
      .eq('id', userId)
      .single();

    if (profErr) throw profErr;

    const dbPayload = {
      author_id: userId,
      problem_statement_id: profile.problem_statement_id || null,
      title: payload.title || null,
      content: payload.content,
      attachment_path: null,
      is_pinned: false,
      is_hidden: false
    };

    const { data: inserted, error } = await supabase
      .from('community_posts')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const newPost: CommunityPost = {
      id: inserted.id,
      authorId: inserted.author_id,
      authorName: profile.full_name || 'Unknown User',
      authorPhotoUrl: profile.profile_photo_url,
      authorRole: 'INTERN',
      problemStatementTitle: profile.problem_statement_id ? 'Assigned' : undefined,
      postType: 'General Discussion',
      category: 'General',
      title: inserted.title,
      content: inserted.content,
      isOfficial: false,
      isPinned: !!inserted.is_pinned,
      likesCount: 0,
      commentsCount: 0,
      createdAt: inserted.created_at
    };

    return { success: true, newPost };
  } catch (err) {
    console.error('[CommunityService] Create post failed:', err);
    throw err;
  }
}

export async function likeCommunityPost(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('community_post_likes')
    .insert({ post_id: postId, user_id: user.id });

  if (error) {
    console.error('[CommunityService] Error liking post:', error);
    throw error;
  }
}

export async function unlikeCommunityPost(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('community_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[CommunityService] Error unliking post:', error);
    throw error;
  }
}

export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  const { data: comments, error } = await supabase
    .from('community_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[CommunityService] Error fetching comments:', error);
    throw error;
  }

  if (!comments || comments.length === 0) return [];

  const authorIds = Array.from(new Set(comments.map((c: any) => c.author_id)));
  let profilesMap: Record<string, any> = {};
  
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.rpc('get_community_author_profiles', {
      p_user_ids: authorIds
    });
      
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap[p.id] = p;
      });
    }
  }

  return comments.map((item: any) => {
    const author = profilesMap[item.author_id] || {};
    return {
      id: item.id,
      postId: item.post_id,
      authorId: item.author_id,
      authorName: author.full_name || 'Unknown User',
      authorPhotoUrl: author.profile_photo_url,
      comment: item.comment,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  });
}

export async function createComment(postId: string, comment: string): Promise<CommunityComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, profile_photo_url')
    .eq('id', user.id)
    .single();

  const { data: inserted, error } = await supabase
    .from('community_post_comments')
    .insert({ post_id: postId, author_id: user.id, comment })
    .select()
    .single();

  if (error) {
    console.error('[CommunityService] Error creating comment:', error);
    throw error;
  }

  return {
    id: inserted.id,
    postId: inserted.post_id,
    authorId: inserted.author_id,
    authorName: profile?.full_name || 'Unknown User',
    authorPhotoUrl: profile?.profile_photo_url,
    comment: inserted.comment,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at
  };
}

export async function updateComment(commentId: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from('community_post_comments')
    .update({ comment })
    .eq('id', commentId);

  if (error) {
    console.error('[CommunityService] Error updating comment:', error);
    throw error;
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('community_post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('[CommunityService] Error deleting comment:', error);
    throw error;
  }
}

export async function pinCommunityPost(postId: string, isPinned: boolean): Promise<void> {
  const { error } = await supabase.rpc('pin_community_post', {
    p_post_id: postId,
    p_is_pinned: isPinned
  });
  
  if (error) {
    console.error('[CommunityService] Error pinning post:', error);
    throw error;
  }
}

export async function hideCommunityPost(postId: string, isHidden: boolean): Promise<void> {
  const { error } = await supabase.rpc('hide_community_post', {
    p_post_id: postId,
    p_is_hidden: isHidden
  });
  
  if (error) {
    console.error('[CommunityService] Error hiding post:', error);
    throw error;
  }
}
