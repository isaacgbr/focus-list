import { createContext, useContext } from 'react'

export type Breadcrumb = {
  label: string
  to?: string
}

export const BreadcrumbContext = createContext<((items: Breadcrumb[]) => void) | null>(null)

export function useBreadcrumbs() {
  const setBreadcrumbs = useContext(BreadcrumbContext)

  if (!setBreadcrumbs) {
    throw new Error('useBreadcrumbs deve ser usado dentro do AppLayout.')
  }

  return setBreadcrumbs
}
