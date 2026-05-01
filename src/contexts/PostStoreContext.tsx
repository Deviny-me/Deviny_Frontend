'use client'

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react'
import { PostDto } from '@/types/post'

// ─── State ───────────────────────────────────────────────────
interface PostStoreState {
  postsById: Record<string, PostDto>
}

const initialState: PostStoreState = {
  postsById: {},
}

// ─── Actions ─────────────────────────────────────────────────
type PostStoreAction =
  | { type: 'UPSERT_POSTS'; posts: PostDto[] }
  | { type: 'UPDATE_POST'; postId: string; partial: Partial<PostDto> }
  | { type: 'REMOVE_POST'; postId: string }

function postStoreReducer(
  state: PostStoreState,
  action: PostStoreAction
): PostStoreState {
  switch (action.type) {
    case 'UPSERT_POSTS': {
      const next = { ...state.postsById }
      for (const post of action.posts) {
        next[post.id] = post
        // Also upsert the embedded original post (if any)
        if (post.originalPost) {
          next[post.originalPost.id] = post.originalPost
        }
      }
      return { postsById: next }
    }
    case 'UPDATE_POST': {
      const existing = state.postsById[action.postId]
      if (!existing) return state
      
      // Always create new objects to guarantee React detects the change
      const updatedPost = { ...existing, ...action.partial }
      const newPostsById = { ...state.postsById, [action.postId]: updatedPost }
      
      return { postsById: newPostsById }
    }
    case 'REMOVE_POST': {
      const { [action.postId]: _, ...rest } = state.postsById
      return { postsById: rest }
    }
    default:
      return state
  }
}

// ─── Contexts ────────────────────────────────────────────────
const PostStoreStateCtx = createContext<PostStoreState>(initialState)
const PostStoreDispatchCtx = createContext<Dispatch<PostStoreAction>>(() => {})

// ─── Provider ────────────────────────────────────────────────
export function PostStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postStoreReducer, initialState)

  return (
    <PostStoreStateCtx.Provider value={state}>
      <PostStoreDispatchCtx.Provider value={dispatch}>
        {children}
      </PostStoreDispatchCtx.Provider>
    </PostStoreStateCtx.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────

/** Full store state (rarely needed directly). */
export function usePostStore() {
  return useContext(PostStoreStateCtx)
}

/** Read a single post from the store by ID. */
export function usePost(postId: string): PostDto | undefined {
  const { postsById } = useContext(PostStoreStateCtx)
  return postsById[postId]
}

/** Dispatch actions to the post store. */
export function usePostDispatch() {
  return useContext(PostStoreDispatchCtx)
}

/**
 * Helper: upsert a list of PostDtos and return their IDs.
 * Usage in pages that load paginated lists.
 */
export function useUpsertPosts() {
  const dispatch = usePostDispatch()
  return useCallback(
    (posts: PostDto[]): string[] => {
      dispatch({ type: 'UPSERT_POSTS', posts })
      return posts.map((p) => p.id)
    },
    [dispatch]
  )
}
