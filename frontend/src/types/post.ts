/**
 * Post-related types for the frontend.
 * Mirrors backend DTOs for type safety.
 */

export enum PostType {
  Photo = 'Photo',
  Video = 'Video',
  Achievement = 'Achievement',
  Repost = 'Repost'
}

export enum MediaType {
  Image = 'Image',
  Video = 'Video'
}

export enum PostVisibility {
  Public = 'Public',
  Private = 'Private'
}

/**
 * Profile tab filter for publications section.
 */
export type ProfilePostTab = 'all' | 'videos' | 'reposts'

/**
 * Basic author information for posts and comments.
 */
export interface PostAuthorDto {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  slug?: string | null
  fullName?: string
  role?: string | number
}

export interface PostMediaDto {
  id: string
  mediaType: MediaType
  url: string
  thumbnailUrl?: string | null
  contentType: string
  sizeBytes: number
  displayOrder: number
}

export interface PostDto {
  id: string
  userId: string
  author?: PostAuthorDto | null
  type: PostType
  caption?: string | null
  visibility: PostVisibility
  createdAt: string
  media: PostMediaDto[]
  
  // Social interaction counts
  likeCount: number
  commentCount: number
  repostCount: number
  
  // Current user's interaction state
  isLikedByMe: boolean
  isRepostedByMe: boolean
  
  // Repost fields
  isRepost?: boolean
  originalPostId?: string | null
  repostQuote?: string | null
  originalPost?: PostDto | null
}

export interface UserPostsResponse {
  posts: PostDto[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Comment on a post.
 */
export interface PostCommentDto {
  id: string
  postId: string
  author: PostAuthorDto
  content: string
  createdAt: string
  parentCommentId?: string | null
  canDelete: boolean
}

/**
 * Paginated comments response.
 */
export interface PostCommentsResponse {
  comments: PostCommentDto[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Stats + viewer flags returned by mutation endpoints (like, repost).
 * Used for reconciling optimistic UI with server state.
 */
export interface PostStatsDto {
  likeCount: number
  commentCount: number
  repostCount: number
  isLikedByMe: boolean
  isRepostedByMe: boolean
}

export interface CreateMediaPostRequest {
  file: File
  type: PostType
  caption?: string
}

export interface CreateCommentRequest {
  content: string
  parentCommentId?: string
}

export interface CreateRepostRequest {
  quote?: string
}

export interface CreateMediaPostError {
  type: string
  title: string
  status: number
  errors?: { field: string; message: string }[]
  detail?: string
}
