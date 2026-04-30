'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { StoriesViewer } from './StoriesViewer'

interface Story {
  id: string
  userId: string
  userName: string
  userAvatar: string
  userLevel: number
  hasStory: boolean
  isViewed: boolean
  stories: StoryItem[]
}

interface StoryItem {
  id: string
  type: 'image' | 'workout'
  image: string
  timestamp: string
  duration: number
  workout?: {
    name: string
    xpEarned: number
  }
}

export function StoriesBar() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)

  const stories: Story[] = [
    {
      id: 'your-story',
      userId: 'me',
      userName: 'Your Story',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
      userLevel: 0,
      hasStory: false,
      isViewed: false,
      stories: [],
    },
    {
      id: 'story1',
      userId: 'user1',
      userName: 'Sarah M.',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      userLevel: 47,
      hasStory: true,
      isViewed: false,
      stories: [
        {
          id: 's1',
          type: 'workout',
          image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1920&fit=crop',
          timestamp: '2h ago',
          duration: 5000,
          workout: {
            name: 'Upper Body Blast',
            xpEarned: 150,
          },
        },
      ],
    },
    {
      id: 'story2',
      userId: 'user2',
      userName: 'Mike R.',
      userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
      userLevel: 28,
      hasStory: true,
      isViewed: false,
      stories: [
        {
          id: 's2',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&h=1920&fit=crop',
          timestamp: '4h ago',
          duration: 5000,
        },
      ],
    },
    {
      id: 'story3',
      userId: 'user3',
      userName: 'Jessica L.',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      userLevel: 42,
      hasStory: true,
      isViewed: true,
      stories: [
        {
          id: 's3',
          type: 'workout',
          image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1080&h=1920&fit=crop',
          timestamp: '6h ago',
          duration: 5000,
          workout: {
            name: 'HIIT Cardio',
            xpEarned: 200,
          },
        },
      ],
    },
    {
      id: 'story4',
      userId: 'user4',
      userName: 'Alex T.',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      userLevel: 22,
      hasStory: true,
      isViewed: true,
      stories: [
        {
          id: 's4',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1080&h=1920&fit=crop',
          timestamp: '8h ago',
          duration: 5000,
        },
      ],
    },
  ]

  return (
    <>
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {stories.map((story, index) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => story.hasStory ? setSelectedStory(story) : null}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              {/* Avatar with Ring */}
              <div className="relative">
                {story.hasStory ? (
                  <div className={`p-[3px] rounded-full ${
                    story.isViewed
                      ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                      : 'bg-gradient-to-br from-[#f07915] to-[#d4600b]'
                  }`}>
                    <div className="p-[2px] bg-surface-2 rounded-full">
                      <img
                        src={story.userAvatar}
                        alt={story.userName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#141414]"
                    />
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-br from-[#f07915] to-[#d4600b] flex items-center justify-center border-2 border-[#141414]">
                      <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                {story.hasStory && story.userLevel > 0 && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#141414]">
                    {story.userLevel}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground max-w-[70px] truncate">
                {story.userName}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stories Viewer Modal */}
      {selectedStory && (
        <StoriesViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </>
  )
}

export type { Story, StoryItem }
