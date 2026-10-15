import { useLayoutEffect, useRef } from 'react'

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const trapStack: symbol[] = []

function isVisible(element: HTMLElement) {
  if (element.hidden || element.closest('[hidden], [aria-hidden="true"]')) return false
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && isVisible(element))
}

function focusElement(element: HTMLElement | null) {
  if (!element || !element.isConnected || !isVisible(element) || element.matches(':disabled')) return
  element.focus({ preventScroll: true })
}

export function useModalFocusTrap<T extends HTMLElement>(isOpen: boolean) {
  const containerRef = useRef<T>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return

    const container = containerRef.current
    if (!restoreFocusRef.current && document.activeElement instanceof HTMLElement) {
      restoreFocusRef.current = document.activeElement
    }
    const trapId = Symbol('modal-focus-trap')
    trapStack.push(trapId)

    const isTopTrap = () => trapStack.at(-1) === trapId
    const focusFirst = () => {
      const preferred = container.querySelector<HTMLElement>('[data-modal-initial-focus]')
      focusElement(preferred && isVisible(preferred) && !preferred.matches(':disabled')
        ? preferred
        : getFocusableElements(container)[0] ?? container)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isTopTrap()) return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) {
        event.preventDefault()
        focusElement(container)
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && (activeElement === first || !container.contains(activeElement))) {
        event.preventDefault()
        focusElement(last)
      } else if (!event.shiftKey && (activeElement === last || !container.contains(activeElement))) {
        event.preventDefault()
        focusElement(first)
      }
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (isTopTrap() && !container.contains(event.target as Node)) focusFirst()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    focusFirst()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      const stackIndex = trapStack.lastIndexOf(trapId)
      if (stackIndex !== -1) trapStack.splice(stackIndex, 1)
      const focusToRestore = restoreFocusRef.current
      queueMicrotask(() => {
        // React StrictMode simulates an effect cleanup while the modal remains mounted.
        if (container.isConnected) return
        restoreFocusRef.current = null
        focusElement(focusToRestore)
      })
    }
  }, [isOpen])

  return containerRef
}
