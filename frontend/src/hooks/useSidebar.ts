import { useState } from 'react'
import { useLocation } from 'react-router-dom'

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return {
    close,
    isOpen,
    locationKey: location.pathname,
    open,
  }
}
