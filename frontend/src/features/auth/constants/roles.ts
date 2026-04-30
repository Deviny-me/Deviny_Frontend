import { RoleCardData } from '../types/role.types'

export const STORAGE_KEY = 'selectedRole'

export const ROLE_CARDS: RoleCardData[] = [
  {
    type: 'user',
    title: 'roles.user.title',
    description: 'roles.user.description',
    tags: ['workouts', 'nutrition', 'progress'],
    accentColor: 'user',
  },
  {
    type: 'trainer',
    title: 'roles.trainer.title',
    description: 'roles.trainer.description',
    tags: ['clients', 'programs', 'income'],
    accentColor: 'trainer',
  },
  {
    type: 'nutritionist',
    title: 'roles.nutritionist.title',
    description: 'roles.nutritionist.description',
    tags: ['clients', 'programs', 'income'],
    accentColor: 'nutritionist',
  },
]
