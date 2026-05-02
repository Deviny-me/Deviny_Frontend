'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type Dispatch,
} from 'react'
import { PostDto } from '@/types/post'

interface PostStoreState {
  postsById: Record<string, PostDto>
}

const initialState: PostStoreState = {
  postsById: {},
}

type PostStoreAction =
  | { type: 'UPSERT_POSTS'; posts: PostDto[] }
  | { type: 'UPDATE_POST'; postId: string; partial: Partial<PostDto> }
  | { type: 'REMOVE_POST'; postId: string }

type Listener = () => void

interface PostStoreApi {
  getState: () => PostStoreState
  getPost: (postId: string) => PostDto | undefined
  subscribeAll: (listener: Listener) => () => void
  subscribePost: (postId: string, listener: Listener) => () => void
  dispatch: Dispatch<PostStoreAction>
}

const PostStoreCtx = createContext<PostStoreApi | null>(null)

function sameAuthor(a: PostDto['author'], b: PostDto['author']) {
  if (a === b) return true
  if (!a || !b) return a === b
  return (
    a.id === b.id &&
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.avatarUrl === b.avatarUrl &&
    a.slug === b.slug &&
    a.fullName === b.fullName &&
    a.role === b.role
  )
}

function sameMedia(a: PostDto['media'], b: PostDto['media']) {
  if (a === b) return true
  if (a.length !== b.length) return false
  return a.every((item, index) => {
    const other = b[index]
    return (
      item.id === other.id &&
      item.mediaType === other.mediaType &&
      item.url === other.url &&
      item.thumbnailUrl === other.thumbnailUrl &&
      item.contentType === other.contentType &&
      item.sizeBytes === other.sizeBytes &&
      item.displayOrder === other.displayOrder
    )
  })
}

function samePost(a: PostDto | undefined, b: PostDto | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return a === b
  return (
    a.id === b.id &&
    a.userId === b.userId &&
    a.type === b.type &&
    a.caption === b.caption &&
    a.visibility === b.visibility &&
    a.createdAt === b.createdAt &&
    a.likeCount === b.likeCount &&
    a.commentCount === b.commentCount &&
    a.repostCount === b.repostCount &&
    a.isLikedByMe === b.isLikedByMe &&
    a.isRepostedByMe === b.isRepostedByMe &&
    a.isRepost === b.isRepost &&
    a.originalPostId === b.originalPostId &&
    a.repostQuote === b.repostQuote &&
    sameAuthor(a.author, b.author) &&
    sameMedia(a.media, b.media) &&
    samePost(a.originalPost ?? undefined, b.originalPost ?? undefined)
  )
}

function createPostStore(): PostStoreApi {
  let state = initialState
  const allListeners = new Set<Listener>()
  const postListeners = new Map<string, Set<Listener>>()

  const notifyAll = () => {
    allListeners.forEach(listener => listener())
  }

  const notifyPost = (postId: string) => {
    postListeners.get(postId)?.forEach(listener => listener())
  }

  const notifyChanged = (changedIds: Set<string>) => {
    if (changedIds.size === 0) return
    notifyAll()
    changedIds.forEach(notifyPost)
  }

  const upsertOne = (
    nextPostsById: Record<string, PostDto>,
    changedIds: Set<string>,
    post: PostDto,
  ) => {
    const existing = nextPostsById[post.id]
    if (!samePost(existing, post)) {
      nextPostsById[post.id] = post
      changedIds.add(post.id)
    }
  }

  const dispatch: Dispatch<PostStoreAction> = (action) => {
    switch (action.type) {
      case 'UPSERT_POSTS': {
        const nextPostsById = { ...state.postsById }
        const changedIds = new Set<string>()

        for (const post of action.posts) {
          upsertOne(nextPostsById, changedIds, post)
          if (post.originalPost) {
            upsertOne(nextPostsById, changedIds, post.originalPost)
          }
        }

        if (changedIds.size === 0) return
        state = { postsById: nextPostsById }
        notifyChanged(changedIds)
        return
      }
      case 'UPDATE_POST': {
        const existing = state.postsById[action.postId]
        if (!existing) return

        const updatedPost = { ...existing, ...action.partial }
        if (samePost(existing, updatedPost)) return

        state = {
          postsById: {
            ...state.postsById,
            [action.postId]: updatedPost,
          },
        }
        notifyChanged(new Set([action.postId]))
        return
      }
      case 'REMOVE_POST': {
        if (!state.postsById[action.postId]) return

        const { [action.postId]: _, ...rest } = state.postsById
        state = { postsById: rest }
        notifyChanged(new Set([action.postId]))
        return
      }
    }
  }

  return {
    getState: () => state,
    getPost: (postId) => state.postsById[postId],
    subscribeAll: (listener) => {
      allListeners.add(listener)
      return () => allListeners.delete(listener)
    },
    subscribePost: (postId, listener) => {
      let listeners = postListeners.get(postId)
      if (!listeners) {
        listeners = new Set()
        postListeners.set(postId, listeners)
      }
      listeners.add(listener)

      return () => {
        listeners?.delete(listener)
        if (listeners?.size === 0) {
          postListeners.delete(postId)
        }
      }
    },
    dispatch,
  }
}

export function PostStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<PostStoreApi | null>(null)
  if (!storeRef.current) {
    storeRef.current = createPostStore()
  }

  return (
    <PostStoreCtx.Provider value={storeRef.current}>
      {children}
    </PostStoreCtx.Provider>
  )
}

function usePostStoreApi() {
  const store = useContext(PostStoreCtx)
  if (!store) {
    throw new Error('PostStore hooks must be used within PostStoreProvider')
  }
  return store
}

/** Full store state. Prefer usePost(postId) for UI so unrelated posts do not rerender. */
export function usePostStore() {
  const store = usePostStoreApi()
  return useSyncExternalStore(
    store.subscribeAll,
    store.getState,
    store.getState,
  )
}

/** Read a single post from the store by ID; only this ID notifies this hook. */
export function usePost(postId: string): PostDto | undefined {
  const store = usePostStoreApi()
  const subscribe = useCallback(
    (listener: Listener) => store.subscribePost(postId, listener),
    [store, postId],
  )
  const getSnapshot = useCallback(
    () => store.getPost(postId),
    [store, postId],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Dispatch actions to the post store. */
export function usePostDispatch() {
  return usePostStoreApi().dispatch
}

export function useUpsertPosts() {
  const dispatch = usePostDispatch()
  return useCallback(
    (posts: PostDto[]): string[] => {
      dispatch({ type: 'UPSERT_POSTS', posts })
      return posts.map((p) => p.id)
    },
    [dispatch],
  )
}
