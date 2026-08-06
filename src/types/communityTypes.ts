export type UserRole = 'INTERN' | 'ADMIN' | 'SUPER_ADMIN';

export type PostType = 
  | 'General Discussion'
  | 'Question'
  | 'Learning Update'
  | 'Technical Help'
  | 'Project Update'
  | 'Problem Statement Discussion'
  | 'Resource Sharing'
  | 'Internship Experience'
  | 'Achievement'
  | 'Official Guidance';

export type CategoryFilter = 
  | 'All'
  | 'General'
  | 'Technical Help'
  | 'Learning'
  | 'Project Updates'
  | 'Problem Statements'
  | 'Resources'
  | 'Internship Experience'
  | 'Achievements'
  | 'Official Posts';

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorPhotoUrl?: string;
  problemStatementTitle?: string;
  postType: PostType;
  category: CategoryFilter;
  title?: string;
  content: string;
  isOfficial?: boolean;
  isPinned?: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
}

export interface CreatePostPayload {
  postType: PostType;
  category: CategoryFilter;
  title?: string;
  content: string;
  targetAudience: 'Everyone' | 'My Problem Statement' | 'My Batch';
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
