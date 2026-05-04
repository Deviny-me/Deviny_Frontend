import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type SkeletonShape = 'rect' | 'circle' | 'pill' | 'text'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape
}

const SHAPE_STYLES: Record<SkeletonShape, string> = {
  rect:   'rounded-lg',
  circle: 'rounded-full aspect-square',
  pill:   'rounded-full',
  text:   'rounded h-3.5',
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = 'rect', ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden
        className={cn(
          // Theme-aware shimmer using the global .skeleton utility from globals.css
          'skeleton block w-full',
          SHAPE_STYLES[shape],
          className,
        )}
        {...props}
      />
    )
  },
)

Skeleton.displayName = 'Skeleton'

export { Skeleton }
export type { SkeletonProps, SkeletonShape }
