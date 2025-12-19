import { FC } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const Loading: FC<LoadingProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-current', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  text?: string
  className?: string
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Loading...',
  className
}) => {
  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-gray-900 dark:text-white">{text}</span>
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export const LoadingButton: FC<LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  disabled,
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={isLoading || disabled}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}