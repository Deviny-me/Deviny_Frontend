export type RoleType = 'user' | 'trainer' | 'nutritionist'

export interface RoleCardData {
  type: RoleType
  title: string
  description: string
  tags: string[]
  accentColor: 'user' | 'trainer' | 'nutritionist'
}
