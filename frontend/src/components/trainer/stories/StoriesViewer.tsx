'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Send, MoreHorizontal, Flame, Zap } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

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

interface StoriesViewerProps {
  story: Story
  onClose: () => void
}

export function StoriesViewer({ story, onClose }: StoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStory = story.stories[currentIndex]
  const duration = currentStory?.duration || 5000

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < story.stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            return 0
          } else {
            handleClose()
            return 100
          }
        }
        return prev + (100 / (duration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [currentIndex, isPaused, duration, story.stories.length, handleClose])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < story.stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md h-[80vh] bg-background rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
            {story.stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: index === currentIndex 
                      ? `${progress}%` 
                      : index < currentIndex 
                      ? '100%' 
                      : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={story.userAvatar}
                    alt={story.userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-black">
                    {story.userLevel}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{story.userName}</p>
                  <p className="text-xs text-foreground/70">{currentStory?.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full">
            <img
              src={currentStory?.image}
              alt="Story"
              className="w-full h-full object-cover"
            />

            {/* Click Areas for Navigation */}
            <div className="absolute inset-0 flex">
              <button
                onClick={handlePrevious}
                className="flex-1"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onMouseLeave={() => setIsPaused(false)}
              />
              <button
                onClick={handleNext}
                className="flex-1"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onMouseLeave={() => setIsPaused(false)}
              />
            </div>

            {/* Workout Badge for workout stories */}
            {currentStory?.type === 'workout' && currentStory.workout && (
              <div className="absolute bottom-24 left-4 right-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-border-subtle"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f07915] to-[#d4600b] flex items-center justify-center">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/70">Completed Workout</p>
                        <p className="text-sm font-bold text-foreground">{currentStory.workout.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[#f07915]">
                        <Zap className="w-4 h-4" fill="currentColor" />
                        <span className="text-lg font-bold">+{currentStory.workout.xpEarned}</span>
                      </div>
                      <p className="text-xs text-foreground/70">XP Earned</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Reply Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={`Reply to ${story.userName}...`}
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-[#f07915]"
                onClick={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
              />
              <button className="p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-colors">
                <Heart className="w-5 h-5 text-foreground" />
              </button>
              <button className="p-3 bg-gradient-to-r from-[#f07915] to-[#d4600b] rounded-full hover:opacity-90 transition-opacity">
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
