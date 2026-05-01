'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RoleCardData } from '../types/role.types'
import { User, Dumbbell, Apple } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTranslations } from 'next-intl'

interface RoleCardProps {
  data: RoleCardData
  isSelected: boolean
  onSelect: () => void
  onAction: () => void
}

export const RoleCard = ({ data, isSelected, onSelect, onAction }: RoleCardProps) => {
  const t = useTranslations('auth')
  const tTags = useTranslations('auth.tags')
  const Icon = data.type === 'user' ? User : data.type === 'nutritionist' ? Apple : Dumbbell
  const buttonVariant = data.accentColor

  const loginLabel = data.type === 'user' 
    ? t('loginAsUser') 
    : data.type === 'nutritionist' 
      ? t('loginAsNutritionist') 
      : t('loginAsTrainer')

  return (
    <Card
      className={cn(
        'p-6 cursor-pointer hover:shadow-xl transition-all duration-300',
        isSelected && data.type === 'user' && 'ring-4 ring-user-500 shadow-xl',
        isSelected && data.type === 'trainer' && 'ring-4 ring-trainer-500 shadow-xl',
        isSelected && data.type === 'nutritionist' && 'ring-4 ring-nutritionist-500 shadow-xl'
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center',
            data.type === 'user' ? 'bg-user-100' : data.type === 'nutritionist' ? 'bg-nutritionist-100' : 'bg-trainer-100'
          )}
        >
          <Icon
            className={cn(
              'w-10 h-10',
              data.type === 'user' ? 'text-user-600' : data.type === 'nutritionist' ? 'text-nutritionist-600' : 'text-trainer-600'
            )}
          />
        </div>

        <h3 className="text-2xl font-bold text-gray-900">{t(data.title)}</h3>

        <p className="text-gray-600 text-sm leading-relaxed">{t(data.description)}</p>

        <div className="flex flex-wrap gap-2 justify-center">
          {data.tags.map((tagKey) => (
            <Badge key={tagKey} variant={buttonVariant}>
              {tTags(tagKey)}
            </Badge>
          ))}
        </div>

        <Button
          variant={buttonVariant}
          size="lg"
          fullWidth
          onClick={(e) => {
            e.stopPropagation()
            onAction()
          }}
        >
          {loginLabel}
        </Button>
      </div>
    </Card>
  )
}
