"use client"

import { ComponentProps, ComponentVariant } from '@/types/design-system'
import React from 'react'

interface ComponentConfig {
  type: string
  props?: ComponentProps & ComponentVariant
  children?: ComponentConfig[]
  condition?: boolean
}

interface ComponentFactoryProps {
  config: ComponentConfig
  context?: Record<string, any>
}

export function ComponentFactory({ config, context }: ComponentFactoryProps) {
  if (config.condition === false) {
    return null
  }

  const { type, props = {}, children = [] } = config

  // Map component types to actual components
  const componentMap: Record<string, React.ComponentType<any>> = {
    // This will be populated as we create the actual components
    'div': 'div' as any,
    'span': 'span' as any,
    'button': 'button' as any,
    // Add more as we build the component library
  }

  const Component = componentMap[type] || 'div'

  const resolvedProps = {
    ...props,
    // Resolve any dynamic values from context
    ...Object.keys(props).reduce((acc, key) => {
      const value = props[key as keyof typeof props]
      if (typeof value === 'string' && value.startsWith('$')) {
        const contextKey = value.slice(1)
        acc[key] = context?.[contextKey] || value
      } else {
        acc[key] = value
      }
      return acc
    }, {} as any)
  }

  return (
    <Component {...resolvedProps}>
      {children.map((childConfig, index) => (
        <ComponentFactory
          key={index}
          config={childConfig}
          context={context}
        />
      ))}
    </Component>
  )
}

// Helper function to create component configurations
export function createComponentConfig(
  type: string,
  props?: ComponentProps & ComponentVariant,
  children?: ComponentConfig[]
): ComponentConfig {
  return {
    type,
    props,
    children
  }
}
