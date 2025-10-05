"use client"

import { cn } from '@/lib/utils'
import React from 'react'

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'small'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive'
  className?: string
  children: React.ReactNode
}

const variantClasses = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-semibold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-medium',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',
  body: 'text-base',
  caption: 'text-sm',
  small: 'text-xs'
}

const weightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
}

const colorClasses = {
  primary: 'text-slate-900',
  secondary: 'text-slate-600',
  muted: 'text-slate-500',
  accent: 'text-blue-600',
  destructive: 'text-red-600'
}

export function Text({ 
  variant = 'body', 
  weight = 'normal', 
  color = 'primary',
  className,
  children,
  ...props 
}: TextProps) {
  const baseClasses = cn(
    variantClasses[variant],
    weightClasses[weight],
    colorClasses[color],
    className
  )

  if (variant.startsWith('h')) {
    const HeadingComponent = variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <HeadingComponent
        className={baseClasses}
        {...props}
      >
        {children}
      </HeadingComponent>
    )
  }

  return (
    <p
      className={baseClasses}
      {...props}
    >
      {children}
    </p>
  )
}
