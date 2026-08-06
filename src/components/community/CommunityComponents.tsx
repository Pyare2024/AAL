import React, { useState } from 'react';
import { 
  Users, 
  Rss, 
  User, 
  Bookmark, 
  Pin, 
  Search, 
  Plus, 
  Image, 
  FileText, 
  Link as LinkIcon, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  MoreVertical,
  ShieldCheck,
  CheckCircle2,
  X,
  Send
} from 'lucide-react';
import { CommunityPost, CategoryFilter, PostType, CreatePostPayload, CommunityComment } from '../../types/communityTypes';
import { likeCommunityPost, unlikeCommunityPost, fetchComments, createComment, updateComment, deleteComment, pinCommunityPost, hideCommunityPost } from '../../services/communityService';
import { useAuth } from '../../features/auth/context/AuthContext';

/**
 * Left Sidebar Area Navigation
 */
export function CommunityLeftNav({ 
  activeFilter, 
  onSelectFilter 
}: { 
  activeFilter: string; 
  onSelectFilter: (filter: string) => void; 
}) {
  const navItems = [
    { id: 'all', label: 'All Posts', icon: Rss },
    { id: 'my-feed', label: 'My Feed', icon: Users },
    { id: 'my-posts', label: 'My Posts', icon: User },
    { id: 'saved', label: 'Saved Posts', icon: Bookmark },
    { id: 'pinned', label: 'Pinned Posts', icon: Pin }
  ];

  return (
    <div className="w-full md:w-56 shrink-0 bg-white border border-[#EDEDED] rounded-2xl p-3 shadow-sm space-y-1">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#737373]">
        Feeds & Streams
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectFilter(item.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isActive 
                ? 'bg-orange-50 text-[#171717] border border-orange-200/60 shadow-2xs' 
                : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA]'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-[#FF8A00]' : 'text-[#737373]'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Center Area: Category Filters Horizontal Bar
 */
export function CommunityCategoryFilterBar({ 
  selectedCategory, 
  onSelectCategory 
}: { 
  selectedCategory: CategoryFilter; 
  onSelectCategory: (cat: CategoryFilter) => void; 
}) {
  const categories: CategoryFilter[] = [
    'All',
    'General',
    'Technical Help',
    'Learning',
    'Project Updates',
    'Problem Statements',
    'Resources',
    'Internship Experience',
    'Achievements',
    'Official Posts'
  ];

  return (
    <div className="overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isActive 
                  ? 'bg-[#FF8A00] text-white border-[#FF8A00] shadow-2xs' 
                  : 'bg-white text-[#737373] border-[#EDEDED] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Center Area: Quick Post Trigger Composer Card
 */
export function CreatePostQuickComposer({ 
  userFullName, 
  userPhotoUrl, 
  onOpenDialog 
}: { 
  userFullName: string; 
  userPhotoUrl?: string; 
  onOpenDialog: () => void; 
}) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-300 text-[#FF8A00] font-bold flex items-center justify-center overflow-hidden shrink-0">
          {userPhotoUrl ? (
            <img src={userPhotoUrl} alt={userFullName} className="w-full h-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <button
          onClick={onOpenDialog}
          className="flex-1 text-left py-2.5 px-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs text-[#737373] hover:border-gray-300 transition-colors"
        >
          Share an update, ask a question, or post a useful resource…
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-[#EDEDED] pt-3 text-xs font-bold text-[#737373]">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onOpenDialog} className="flex items-center gap-1.5 hover:text-[#FF8A00] transition-colors">
            <Image className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Image</span>
          </button>
          <button onClick={onOpenDialog} className="flex items-center gap-1.5 hover:text-[#FF8A00] transition-colors">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">Document</span>
          </button>
          <button onClick={onOpenDialog} className="flex items-center gap-1.5 hover:text-[#FF8A00] transition-colors">
            <LinkIcon className="h-4 w-4 text-purple-600" />
            <span className="hidden sm:inline">Link</span>
          </button>
        </div>

        <button
          onClick={onOpenDialog}
          className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          <span>Create Post</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Center Area: Single Community Post Card Component
 */
export function CommunityPostCard({ post }: { post: CommunityPost }) {
  const { user, role } = useAuth() as any;
  const isSuperAdmin = role === 'super_admin';
  const [localIsPinned, setLocalIsPinned] = useState(post.isPinned);
  const [localIsHidden, setLocalIsHidden] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleLikeToggle = async () => {
    if (isLiking) return;
    
    const previousLikes = likes;
    const previousIsLiked = isLiked;
    
    setIsLiking(true);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(prev => !prev);

    try {
      if (previousIsLiked) {
        await unlikeCommunityPost(post.id);
      } else {
        await likeCommunityPost(post.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setLikes(previousLikes);
      setIsLiked(previousIsLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setShowComments(true);
      setCommentsLoading(true);
      try {
        const fetched = await fetchComments(post.id);
        setComments(fetched);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setCommentsLoading(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createComment(post.id, newComment);
      setComments(prev => [...prev, created]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const startEditing = (comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.comment);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(commentId, editContent);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: editContent } : c));
      setEditingCommentId(null);
    } catch (err) {
      console.error('Failed to update comment', err);
    }
  };

  const handlePinToggle = async () => {
    if (isPinning) return;
    setIsPinning(true);
    try {
      await pinCommunityPost(post.id, !localIsPinned);
      setLocalIsPinned(!localIsPinned);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPinning(false);
    }
  };

  const handleHideToggle = async () => {
    if (isHiding) return;
    if (!window.confirm('Hide this post from the community?')) return;
    setIsHiding(true);
    try {
      await hideCommunityPost(post.id, true);
      setLocalIsHidden(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHiding(false);
    }
  };

  if (localIsHidden) return null;

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-4 hover:border-gray-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-300 text-[#FF8A00] font-bold flex items-center justify-center overflow-hidden shrink-0">
            {post.authorPhotoUrl ? (
              <img src={post.authorPhotoUrl} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-xs text-[#171717]">{post.authorName}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                post.authorRole === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                post.authorRole === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-orange-50 text-[#FF8A00] border-orange-200'
              }`}>
                {post.authorRole}
              </span>
              {post.isOfficial && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Official
                </span>
              )}
              {localIsPinned && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Pin className="h-3 w-3 text-amber-700" /> Pinned
                </span>
              )}
            </div>
            {post.problemStatementTitle && (
              <p className="text-[11px] text-[#737373] mt-0.5 truncate max-w-md">{post.problemStatementTitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isSuperAdmin && (
            <>
              <button
                onClick={handlePinToggle}
                disabled={isPinning}
                className={`p-1.5 rounded-lg font-bold transition-all ${localIsPinned ? 'text-amber-600 bg-amber-50' : 'text-[#737373] hover:bg-[#F5F5F5]'}`}
                title={localIsPinned ? "Unpin Post" : "Pin Post"}
              >
                <Pin className="h-4 w-4" />
              </button>
              <button
                onClick={handleHideToggle}
                disabled={isHiding}
                className="p-1.5 rounded-lg font-bold text-[#737373] hover:bg-red-50 hover:text-red-600 transition-all"
                title="Hide Post"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          <button className="text-[#737373] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#F5F5F5]">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="space-y-2">
        {post.title && <h4 className="text-sm font-bold text-[#171717]">{post.title}</h4>}
        <p className="text-xs text-[#171717] leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* Footer Meta & Actions */}
      <div className="flex items-center justify-between border-t border-[#EDEDED] pt-3 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center gap-1.5 font-bold transition-colors ${
              isLiking ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isLiked ? 'text-[#FF8A00]' : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{likes}</span>
          </button>

          <button 
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 font-bold transition-colors ${
              showComments ? 'text-[#FF8A00]' : 'text-[#737373] hover:text-[#171717]'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{commentsCount} Comments</span>
          </button>
        </div>

        <span className="text-[11px] text-[#737373]">
          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[#EDEDED] pt-4 mt-4 space-y-4">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF8A00]"
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !newComment.trim()}
              className="bg-[#FF8A00] text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? '...' : <Send className="h-3 w-3" />}
            </button>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center text-xs text-[#737373] py-2">Loading comments...</div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-[#FF8A00] font-bold flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    {comment.authorPhotoUrl ? (
                      <img src={comment.authorPhotoUrl} alt={comment.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-3 relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-[#171717]">{comment.authorName}</span>
                      <span className="text-[10px] text-[#737373]">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    {editingCommentId === comment.id ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full bg-white border border-[#EDEDED] rounded-lg px-2 py-1 text-xs outline-none focus:border-[#FF8A00]"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingCommentId(null)} className="text-[10px] text-[#737373] font-bold">Cancel</button>
                          <button onClick={() => handleUpdateComment(comment.id)} className="text-[10px] text-[#FF8A00] font-bold">Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#171717] whitespace-pre-line leading-relaxed">{comment.comment}</p>
                    )}

                    {user?.id === comment.authorId && editingCommentId !== comment.id && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEditing(comment)} className="text-[10px] text-[#737373] hover:text-[#FF8A00] font-bold">Edit</button>
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-[10px] text-[#737373] hover:text-red-500 font-bold">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-xs text-[#737373] py-2">No comments yet. Be the first to share your thoughts!</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Create Post Dialog Component
 */
export function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (payload: CreatePostPayload) => void; 
}) {
  const [postType, setPostType] = useState<PostType>('General Discussion');
  const [category, setCategory] = useState<CategoryFilter>('General');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'Everyone' | 'My Problem Statement' | 'My Batch'>('Everyone');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      postType,
      category,
      title: title.trim() || undefined,
      content,
      targetAudience
    });

    // Reset and close
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#EDEDED] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#171717]">Create Community Post</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#737373] hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#171717] block mb-1">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as any)}
                className="w-full p-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00]"
              >
                <option value="General Discussion">General Discussion</option>
                <option value="Question">Question</option>
                <option value="Learning Update">Learning Update</option>
                <option value="Technical Help">Technical Help</option>
                <option value="Project Update">Project Update</option>
                <option value="Problem Statement Discussion">Problem Statement Discussion</option>
                <option value="Resource Sharing">Resource Sharing</option>
                <option value="Internship Experience">Internship Experience</option>
                <option value="Achievement">Achievement</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00]"
              >
                <option value="General">General</option>
                <option value="Technical Help">Technical Help</option>
                <option value="Learning">Learning</option>
                <option value="Project Updates">Project Updates</option>
                <option value="Problem Statements">Problem Statements</option>
                <option value="Resources">Resources</option>
                <option value="Internship Experience">Internship Experience</option>
                <option value="Achievements">Achievements</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Title (Optional)</label>
            <input
              type="text"
              placeholder="Give your post a descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Post Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Write your update, technical question, or message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEDED]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] text-[#737373] font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Publish Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Right Sidebar Area: Guidelines & Resources Panel
 */
export function CommunityRightSidebar() {
  return (
    <div className="w-full lg:w-72 shrink-0 space-y-4">
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm space-y-3 text-xs">
        <h4 className="font-bold text-[#171717] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#FF8A00]" />
          <span>Community Guidelines</span>
        </h4>
        <ul className="space-y-2 text-[#737373] list-disc pl-4 leading-relaxed">
          <li>Maintain professional tone at all times.</li>
          <li>Be constructive when asking and giving technical help.</li>
          <li>Do not post confidential credentials or secrets.</li>
        </ul>
      </div>
    </div>
  );
}
