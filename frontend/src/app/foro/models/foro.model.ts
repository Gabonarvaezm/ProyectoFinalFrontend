export type UserRole = 'student' | 'professor' | 'admin';

export interface ForumAuthor {
  id: string;
  name: string;
  role: UserRole;
  roleTitle?: string;
  institution: string;
  avatar?: string;
  initials: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  author: ForumAuthor;
  content: string;
  createdAt: string;
  helpfulCount: number;
  userHasVotedHelpful?: boolean;
  isTeacherVerified?: boolean;
  academicReference?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: ForumAuthor;
  subject: string;
  createdAt: string;
  isTeacherVerified: boolean;
  isUnanswered: boolean;
  helpfulCount: number;
  userHasVotedHelpful?: boolean;
  viewsCount: number;
  repliesCount: number;
  replies: ForumReply[];
  academicReference?: string;
  tags?: string[];
}

export interface CommunityAiSuggestion {
  postId: string;
  postTitle: string;
  summary: string;
  draftResponse: string;
  referenceMnemonic?: string;
}

export interface RelatedTopic {
  id: string;
  title: string;
  subject: string;
  activeThreads: number;
}

