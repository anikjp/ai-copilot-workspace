"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
}

export function Avatar({ 
  src, 
  alt = 'Avatar',
  size = 'md',
  fallback = 'A',
  className,
  ...props 
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}
