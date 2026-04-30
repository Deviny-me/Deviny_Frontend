'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Users,
  MessageCircle,
  Loader2,
  UserMinus,
  UserCheck,
} from 'lucide-react'
import { friendsApi, followsApi } from '@/lib/api/friendsApi'
import { FriendDto } from '@/types/friend'
import { useTranslations } from 'next-intl'
import { useAccentColors, getRoleRingClass } from '@/lib/theme/useAccentColors'
import { Toast } from '@/components/ui/Toast'
import { getMediaUrl } from '@/lib/config'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

interface FriendsContentProps {
  basePath: string
}

export function FriendsContent({ basePath }: FriendsContentProps) {
  const accent = useAccentColors()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('friends')
  const tc = useTranslations('common')
  const initialTab = (['all', 'following', 'followers'] as const).includes(searchParams.get('tab') as any)
    ? (searchParams.get('tab') as 'all' | 'following' | 'followers')
    : 'all'
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'followers'>(initialTab)
  const [friends, setFriends] = useState<FriendDto[]>([])
  const [following, setFollowing] = useState<FriendDto[]>([])
  const [followers, setFollowers] = useState<FriendDto[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Load badge counts on mount
  useEffect(() => {
    followsApi.getMyFollowing(1, 1).then(data => setFollowingCount(data.totalCount)).catch(() => {})
    followsApi.getMyFollowers(1, 1).then(data => setFollowersCount(data.totalCount)).catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'all') {
        const [friendsData, followingData, followersData] = await Promise.all([
          friendsApi.getMyFriends(1, 100),
          followsApi.getMyFollowing(1, 1),
          followsApi.getMyFollowers(1, 1),
        ])
        setFriends(friendsData.items)
        setFollowingCount(followingData.totalCount)
        setFollowersCount(followersData.totalCount)
      } else if (activeTab === 'following') {
        const data = await followsApi.getMyFollowing(1, 100)
        setFollowing(data.items)
        setFollowingCount(data.totalCount)
      } else if (activeTab === 'followers') {
        const data = await followsApi.getMyFollowers(1, 100)
        setFollowers(data.items)
        setFollowersCount(data.totalCount)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useRealtimeScopeRefresh(['friends', 'follows'], () => {
    loadData()
  })

  const handleRemoveFriend = async (friendId: string) => {
    setActionLoading(`remove-${friendId}`)
    try {
      await friendsApi.removeFriend(friendId)
      await loadData()
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnfollow = async (trainerId: string) => {
    setActionLoading(`unfollow-${trainerId}`)
    try {
      await followsApi.unfollowTrainer(trainerId)
      await loadData()
    } catch (error) {
      console.error('Error unfollowing:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMessage = (userId: string) => {
    router.push(`${basePath}/messages?userId=${userId}`)
  }

  const filteredFriends = friends.filter(friend =>
    (friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading && friends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-6">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">
            {friends.length} {t('friendsCount')}
          </p>
        </div>

        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-muted-foreground">{t('searchPlaceholder')}</div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-background border border-border-subtle rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none ${accent.focusBorder}`}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="-mx-1 overflow-x-auto border-b border-border-subtle pb-1">
            <div className="flex min-w-max items-center gap-2 px-1">
              {[
                { id: 'all' as const, label: t('allFriends'), count: friends.length },
                { id: 'followers' as const, label: t('tabs.followers'), count: followersCount },
                { id: 'following' as const, label: t('tabs.following'), count: followingCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? `${accent.bg} text-foreground`
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* All Friends */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 gap-4">
            {filteredFriends.length === 0 ? (
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-foreground font-semibold mb-2">{t('noFriends')}</h3>
                <p className="text-muted-foreground text-sm">{t('startConnecting')}</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-surface-2 rounded-xl border border-border-subtle p-5 hover:border-border transition-all"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
                      onClick={() => router.push(`${basePath}/profile/${friend.id}`)}
                    >
                      {friend.avatar ? (
                        <img
                          src={getMediaUrl(friend.avatar) || friend.avatar}
                          alt={friend.fullName || friend.email}
                          className={`w-16 h-16 rounded-full object-cover ${getRoleRingClass(friend.role)}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                          {friend.fullName?.[0] || friend.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">{friend.fullName || tc('user')}</h3>
                        <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                        <p className="text-xs text-faint-foreground mt-1">
                          {t('friendsSince')} {new Date(friend.friendsSince).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <button
                        onClick={() => handleMessage(friend.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-border-subtle hover:bg-white/10 border border-border-subtle text-foreground rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('message')}</span>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={actionLoading === `remove-${friend.id}`}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                        title={t('removeFriend')}
                      >
                        {actionLoading === `remove-${friend.id}` ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : (
                          <UserMinus className="w-5 h-5 text-muted-foreground group-hover:text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Followers */}
        {activeTab === 'followers' && (
          <div className="grid grid-cols-1 gap-4">
            {followers.length === 0 ? (
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-8 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-foreground font-semibold mb-2">{t('noFollowersYet')}</h3>
                <p className="text-muted-foreground text-sm">{t('startConnecting')}</p>
              </div>
            ) : (
              followers.map((follower) => (
                <div
                  key={follower.id}
                  className="bg-surface-2 rounded-xl border border-border-subtle p-5 hover:border-border transition-all"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
                      onClick={() => router.push(`${basePath}/profile/${follower.id}`)}
                    >
                      {follower.avatar ? (
                        <img
                          src={getMediaUrl(follower.avatar) || follower.avatar}
                          alt={follower.fullName || follower.email}
                          className={`w-16 h-16 rounded-full object-cover ${getRoleRingClass(follower.role)}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                          {follower.fullName?.[0] || follower.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">{follower.fullName || tc('user')}</h3>
                        <p className="text-sm text-muted-foreground truncate">{follower.email}</p>
                        {follower.role && (
                          <span className="text-xs text-muted-foreground">{follower.role}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Following */}
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 gap-4">
            {following.length === 0 ? (
              <div className="bg-surface-2 rounded-xl border border-border-subtle p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-foreground font-semibold mb-2">{t('notFollowingYet')}</h3>
                <p className="text-muted-foreground text-sm">{t('startConnecting')}</p>
              </div>
            ) : (
              following.map((trainer) => (
                <div
                  key={trainer.id}
                  className="bg-surface-2 rounded-xl border border-border-subtle p-5 hover:border-border transition-all"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
                      onClick={() => router.push(`${basePath}/profile/${trainer.id}`)}
                    >
                      {trainer.avatar ? (
                        <img
                          src={getMediaUrl(trainer.avatar) || trainer.avatar}
                          alt={trainer.fullName || trainer.email}
                          className={`w-16 h-16 rounded-full object-cover ${getRoleRingClass(trainer.role)}`}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                          {trainer.fullName?.[0] || trainer.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-foreground font-semibold text-base sm:text-lg truncate">{trainer.fullName || tc('user')}</h3>
                        <p className="text-sm text-muted-foreground truncate">{trainer.email}</p>
                        {trainer.role && (
                          <span className="text-xs text-green-500">{trainer.role}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnfollow(trainer.id)}
                      disabled={actionLoading === `unfollow-${trainer.id}`}
                      className="w-full sm:w-auto px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `unfollow-${trainer.id}` ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>{t('unfollow')}</>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
