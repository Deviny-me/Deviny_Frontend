'use client'

import { useRouter } from 'next/navigation'
import { 
  Star,
  X,
  Users,
  ShoppingCart,
  Dumbbell
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PublicProgramDto } from '@/types/program'
import { useTranslations } from 'next-intl'

// Program Detail Modal Component
function ProgramDetailModal({ 
  program, 
  onClose 
}: { 
  program: PublicProgramDto
  onClose: () => void 
}) {
  const router = useRouter()
  const tp = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
  }

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface-2 rounded-xl border border-border-subtle max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Cover */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={program.coverImageUrl}
              alt={program.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-background flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-foreground">{program.title}</h2>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-2xl font-bold ${
                program.price === 0 ? 'text-green-400' : 'text-[#0c8de6]'
              }`}>
                {formatPrice(program.price)}
              </span>
              {program.proPrice != null && (
                <span className="text-sm font-semibold text-purple-400">
                  PRO {formatPrice(program.proPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Trainer */}
          <div 
            className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-surface-2 transition-colors"
            onClick={() => {
              console.log('Navigating to trainer profile:', {
                trainerSlug: program.trainerSlug,
                trainerId: program.trainerId,
                navigateTo: program.trainerSlug || program.trainerId
              })
              onClose()
              router.push(`/user/profile/${program.trainerId}`)
            }}
          >
            {program.trainerAvatarUrl ? (
              <img
                src={program.trainerAvatarUrl}
                alt={program.trainerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0c8de6] to-[#0070c4] flex items-center justify-center">
                <span className="text-white font-bold">
                  {program.trainerName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="text-foreground font-medium">{program.trainerName}</p>
              <p className="text-xs text-muted-foreground">{tp('viewTrainerProfile')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-foreground font-medium">
                {program.averageRating > 0 ? program.averageRating.toFixed(1) : tc('noRating')}
              </span>
              <span className="text-faint-foreground">({program.totalReviews} {tc('reviews')})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>{program.totalPurchases} {tc('purchases')}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{tp('aboutProgram')}</h3>
            <p className="text-foreground leading-relaxed">{program.description}</p>
          </div>

          {/* Purchase Buttons */}
          <div className="space-y-2">
            <button
              className="w-full py-3 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              onClick={() => {
                // TODO: Implement purchase flow
                alert(tp('purchaseComingSoon'))
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              {program.price === 0 ? tp('getForFree') : tp('purchaseStandard', { price: formatPrice(program.price) })}
            </button>
            {program.proPrice != null && (
              <button
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                onClick={() => {
                  // TODO: Implement purchase flow
                  alert(tp('purchaseComingSoon'))
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                {tp('purchasePro', { price: formatPrice(program.proPrice) })}
              </button>
            )}
          </div>

          {/* Program Code */}
          <p className="text-center text-xs text-faint-foreground">
            {tp('programCode')} <span className="text-muted-foreground font-mono">{program.code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export function UserRightSidebar() {
  const ts = useTranslations('userRightSidebar')
  const [selectedProgram, setSelectedProgram] = useState<PublicProgramDto | null>(null)

  return (
    <div className="w-72 flex-shrink-0 space-y-2 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto pb-6">
      {/* Program Detail Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  )
}
