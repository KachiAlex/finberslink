// Forum TypeScript Types

export interface ForumUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  handle?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  courseId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  tags: string[];
  author?: ForumUser;
  course?: {
    id: string;
    title: string;
  };
  _count?: {
    posts: number;
    subscriptions: number;
  };
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  lessonId?: string | null;
  parentId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  author?: ForumUser;
  thread?: ForumThread;
  lesson?: {
    id: string;
    title: string;
  };
  parent?: ForumPost;
  replies?: ForumPost[];
  reactions?: ForumPostReaction[];
  _count?: {
    reactions: number;
    replies: number;
  };
}

export interface ForumPostReaction {
  id: string;
  postId: string;
  userId: string;
  type: string;
  createdAt: Date;
  user?: ForumUser;
  post?: ForumPost;
}

export interface ForumThreadSubscription {
  id: string;
  threadId: string;
  userId: string;
  createdAt: Date;
  thread?: ForumThread;
  user?: ForumUser;
}

export interface ThreadCreateData {
  title: string;
  courseId: string;
  tags?: string[];
  content?: string;
}

export interface PostCreateData {
  content: string;
  threadId: string;
  authorId: string;
  mentions?: string[];
  parentId?: string;
}

export interface ThreadListParams {
  courseId?: string;
  tag?: string;
  query?: string;
  limit?: number;
  cursor?: string;
  includeUnread?: boolean;
  userId?: string;
}

export interface ThreadListResponse {
  threads: ForumThread[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
  unreadCount?: number;
}

export interface PostListParams {
  threadId: string;
  limit?: number;
  cursor?: string;
  includeDeleted?: boolean;
}

export interface PostListResponse {
  posts: ForumPost[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

export interface UserMention {
  id: string;
  handle: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
}

export interface MentionSuggestion {
  id: string;
  handle: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ReactionType {
  type: string;
  label: string;
  icon: string;
}

export const REACTION_TYPES: ReactionType[] = [
  { type: 'like', label: 'Like', icon: '👍' },
  { type: 'love', label: 'Love', icon: '❤️' },
  { type: 'laugh', label: 'Laugh', icon: '😄' },
  { type: 'wow', label: 'Wow', icon: '😮' },
  { type: 'sad', label: 'Sad', icon: '😢' },
  { type: 'angry', label: 'Angry', icon: '😠' },
];
