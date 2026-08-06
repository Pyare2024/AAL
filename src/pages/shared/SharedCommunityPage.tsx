import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { fetchCommunityPosts, createCommunityTextPost } from '../../services/communityService';
import {
  CommunityCategoryFilterBar,
  CreatePostQuickComposer,
  CommunityPostCard,
  CreatePostModal,
  CommunityRightSidebar
} from '../../components/community/CommunityComponents';
import { CommunityPost, CategoryFilter, CreatePostPayload } from '../../types/communityTypes';
import { Search, RefreshCw } from 'lucide-react';

// ─── Feed Tab Types ────────────────────────────────────────────────────────────

type FeedTab = 'all' | 'my-feed' | 'my-posts' | 'saved' | 'pinned';

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'all',      label: 'All Posts' },
  { id: 'my-feed',  label: 'My Feed'   },
  { id: 'my-posts', label: 'My Posts'  },
  { id: 'saved',    label: 'Saved'     },
  { id: 'pinned',   label: 'Pinned'    },
];

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#EDEDED]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#EDEDED] rounded-full w-1/3" />
          <div className="h-2.5 bg-[#EDEDED] rounded-full w-1/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#EDEDED] rounded-full w-2/3" />
        <div className="h-2.5 bg-[#EDEDED] rounded-full w-full" />
        <div className="h-2.5 bg-[#EDEDED] rounded-full w-4/5" />
      </div>
      <div className="flex gap-6 pt-2 border-t border-[#EDEDED]">
        <div className="h-2.5 bg-[#EDEDED] rounded-full w-12" />
        <div className="h-2.5 bg-[#EDEDED] rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── Horizontal Feed Tab Bar ───────────────────────────────────────────────────

function FeedTabBar({
  activeTab,
  onSelect,
}: {
  activeTab: FeedTab;
  onSelect: (tab: FeedTab) => void;
}) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex items-center min-w-max border-b border-[#EDEDED]">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`community-tab-${tab.id}`}
              onClick={() => onSelect(tab.id)}
              className={`relative px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all
                ${isActive
                  ? 'text-[#FF8A00]'
                  : 'text-[#737373] hover:text-[#171717]'
                }`}
            >
              {tab.label}
              {/* Active bottom indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF8A00] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Community Page ────────────────────────────────────────────────────────────

export function SharedCommunityPage() {
  const { user } = useAuth();

  const [posts, setPosts]               = useState<CommunityPost[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeTab, setActiveTab]       = useState<FeedTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const userId      = (user as any)?.id                          || '';
  const userFullName = (user as any)?.user_metadata?.full_name   || 'User';
  const userRole    = (user as any)?.user_metadata?.role         || 'intern';

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadPosts = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchCommunityPosts();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  // ── Create post ───────────────────────────────────────────────────────────

  const handleCreatePost = async (payload: CreatePostPayload) => {
    try {
      if (!userId) throw new Error('Not authenticated');
      const { newPost } = await createCommunityTextPost(userId, payload);
      setPosts((prev) => [newPost, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create post. Please try again.');
    }
  };

  // ── Filter / search ───────────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Feed tab filter
    if (activeTab === 'my-posts') {
      result = result.filter((p) => p.authorId === userId);
    } else if (activeTab === 'pinned') {
      result = result.filter((p) => p.isPinned);
    } else if (activeTab === 'saved') {
      result = result.filter((p) => p.isSaved);
    }
    // 'all' and 'my-feed' show all posts

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Full-text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.problemStatementTitle?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [posts, activeTab, selectedCategory, searchQuery, userId]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Community</h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Collaborate, ask questions, share learning, and connect with your cohort.
          </p>
        </div>

        <button
          id="community-refresh-btn"
          onClick={() => loadPosts(true)}
          disabled={refreshing}
          title="Refresh feed"
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-[#EDEDED] text-xs font-bold text-[#737373] rounded-xl hover:bg-[#F5F5F5] hover:text-[#171717] transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="flex gap-5 items-start">

        {/* ─── Left / Main Content (70–75%) ─── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Feed Tab Bar — replaces the old left nav */}
          <FeedTabBar activeTab={activeTab} onSelect={setActiveTab} />

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
            <input
              id="community-search-input"
              type="text"
              placeholder="Search posts, topics, or members…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00] focus:border-[#FF8A00] transition-all shadow-sm"
            />
          </div>

          {/* Horizontally scrollable Category Filter Bar */}
          <CommunityCategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Quick Create Post Composer */}
          <CreatePostQuickComposer
            userFullName={userFullName}
            onOpenDialog={() => setShowCreateModal(true)}
          />

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-10 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-[#FF8A00]" />
              </div>
              <p className="text-sm font-bold text-[#171717] mb-1">No community posts yet.</p>
              {!searchQuery && activeTab === 'all' && (
                <button
                  id="community-create-first-post-btn"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <CommunityPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* ─── Right Panel — Community Guidelines (25–30%) ─── */}
        {/* Hidden on mobile, shown on lg+ */}
        <div className="hidden lg:block w-72 shrink-0">
          <CommunityRightSidebar />
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}
