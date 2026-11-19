import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type CardProps<T extends ElementType = 'section'> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

export function Card<T extends ElementType = 'section'>({ as, children, className = '', ...props }: CardProps<T>) {
  const Element = as ?? 'section'
  return <Element className={`ui-card ${className}`.trim()} {...props}>{children}</Element>
}
