import { API_URL, fetchWithAuth } from '@/lib/config'
import { 
  PostDto, 
  UserPostsResponse, 
  CreateMediaPostRequest, 
  PostType,
  PostCommentsResponse,
  PostCommentDto,
  CreateCommentRequest,
  CreateRepostRequest,
  PostStatsDto
} from '@/types/post'

/**
 * API client for user posts operations.
 * Handles media uploads and post retrieval.
 */
export const postsApi = {
  /**
   * Create a new media post (photo or video).
   * Uses multipart/form-data for file upload.
   */
  async createMediaPost(request: CreateMediaPostRequest): Promise<PostDto> {
    const formData = new FormData()
    formData.append('file', request.file)
    formData.append('type', request.type.toString())
    if (request.caption) {
      formData.append('caption', request.caption)
    }

    const response = await fetchWithAuth(`${API_URL}/me/posts/media`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        title: 'Upload failed',
        detail: 'Failed to upload media',
        status: response.status
      }))
      throw new Error(error.detail || error.title || 'Failed to upload media')
    }

    return response.json()
  },

  /**
   * Get current user's posts with pagination and optional tab filter.
   */
  async getMyPosts(page: number = 1, pageSize: number = 20, tab: string = 'all', signal?: AbortSignal): Promise<UserPostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (tab && tab !== 'all') {
      params.set('tab', tab)
    }

    const response = await fetchWithAuth(`${API_URL}/me/posts?${params}`, {
      method: 'GET',
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }

    return response.json()
  },

  /**
   * Delete a post by ID.
   * Uses fetchWithAuth for automatic token refresh on 401.
   */
  async deletePost(postId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/me/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 204 = success
    if (response.ok) {
      return
    }

    // 404 = post not found or not owned — do NOT treat as success
    const error = await response.json().catch(() => ({
      title: 'Delete failed',
      detail: response.status === 404
        ? 'Post not found or you don\'t have permission to delete it'
        : 'Failed to delete post',
      status: response.status
    }))
    throw new Error(error.detail || error.title || 'Failed to delete post')
  },

  /**
   * Helper to get post type from file MIME type.
   */
  getPostTypeFromFile(file: File): PostType {
    if (file.type.startsWith('image/')) {
      return PostType.Photo
    }
    if (file.type.startsWith('video/')) {
      return PostType.Video
    }
    throw new Error('Unsupported file type')
  },

  /**
   * Validate file before upload.
   */
  validateFile(file: File, type: PostType): { valid: boolean; error?: string } {
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
    
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

    if (type === PostType.Photo) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid image format. Allowed: JPG, PNG, GIF, WebP' }
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return { valid: false, error: 'Image size exceeds 10MB limit' }
      }
    } else if (type === PostType.Video) {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid video format. Allowed: MP4, MOV, WebM' }
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return { valid: false, error: 'Video size exceeds 100MB limit' }
      }
    }

    return { valid: true }
  },

  // ============================================
  // Feed & Post Details
  // ============================================

  /**
   * Get the public feed of posts.
   */
  async getFeed(page: number = 1, pageSize: number = 20): Promise<UserPostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })

    const response = await fetchWithAuth(`${API_URL}/feed?${params}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch feed')
    }

    return response.json()
  },

  /**
   * Get posts for a specific user by their ID.
   * Returns public posts for other users, all posts for the authenticated user.
   */
  async getUserPosts(userId: string, page: number = 1, pageSize: number = 20, tab: string = 'all', signal?: AbortSignal): Promise<UserPostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (tab && tab !== 'all') {
      params.set('tab', tab)
    }

    const response = await fetchWithAuth(`${API_URL}/users/${userId}/posts?${params}`, {
      method: 'GET',
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user posts')
    }

    return response.json()
  },

  /**
   * Get a single post by ID.
   */
  async getPostById(postId: string): Promise<PostDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}`, {
      method: 'GET',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post not found')
      }
      throw new Error('Failed to fetch post')
    }

    return response.json()
  },

  // ============================================
  // Likes
  // ============================================

  /**
   * Like a post.
   * @returns updated PostStatsDto with fresh counts + viewer flags
   */
  async likePost(postId: string): Promise<PostStatsDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/likes`, {
      method: 'POST',
    })

    if (!response.ok) {
      if (response.status === 409) {
        // Already liked — return current stats
        return response.json()
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to like post' }))
      throw new Error(error.detail || 'Failed to like post')
    }

    return response.json()
  },

  /**
   * Unlike a post.
   * @returns updated PostStatsDto with fresh counts + viewer flags
   */
  async unlikePost(postId: string): Promise<PostStatsDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/likes`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Not liked — return current stats
        return response.json()
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to unlike post' }))
      throw new Error(error.detail || 'Failed to unlike post')
    }

    return response.json()
  },

  // ============================================
  // Comments
  // ============================================

  /**
   * Get comments for a post.
   */
  async getComments(postId: string, page: number = 1, pageSize: number = 20): Promise<PostCommentsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })

    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/comments?${params}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }

    return response.json()
  },

  /**
   * Add a comment to a post.
   */
  async addComment(postId: string, request: CreateCommentRequest): Promise<PostCommentDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to add comment' }))
      throw new Error(error.detail || 'Failed to add comment')
    }

    return response.json()
  },

  /**
   * Delete a comment (soft delete).
   */
  async deleteComment(commentId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete comment' }))
      throw new Error(error.detail || 'Failed to delete comment')
    }
  },

  // ============================================
  // Reposts
  // ============================================

  /**
   * Repost (share) another user's post.
   */
  async repost(postId: string, request?: CreateRepostRequest): Promise<PostDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/repost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request || {}),
    })

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('You have already reposted this post')
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to repost' }))
      if (error?.title === 'Repost.CannotRepostRepost') {
        throw new Error('Нельзя репостить репост')
      }
      throw new Error(error.detail || 'Failed to repost')
    }

    return response.json()
  },

  /**
   * Remove a repost of a post.
   * @returns updated PostStatsDto for the original post.
   */
  async removeRepost(postId: string): Promise<PostStatsDto> {
    const response = await fetchWithAuth(`${API_URL}/posts/${postId}/repost`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to remove repost' }))
      throw new Error(error.detail || 'Failed to remove repost')
    }

    // Защита от пустого тела (204 NoContent)
    if (response.status === 204) {
      return {} as PostStatsDto
    }

    return response.json()
  }
}
