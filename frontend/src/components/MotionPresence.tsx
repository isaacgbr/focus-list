import { ReactNode, useEffect, useRef, useState } from 'react'

type MotionPresenceProps = {
  children: ReactNode
  present: boolean
}

const EXIT_DURATION_MS = 160

export function MotionPresence({ children, present }: MotionPresenceProps) {
  const [isRendered, setIsRendered] = useState(present)
  const [isExiting, setIsExiting] = useState(false)
  const lastChildren = useRef(children)

  if (present) lastChildren.current = children

  useEffect(() => {
    if (present) {
      setIsRendered(true)
      setIsExiting(false)
      return
    }

    if (!isRendered) return
    setIsExiting(true)
    const timeout = window.setTimeout(() => {
      setIsRendered(false)
      setIsExiting(false)
    }, EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isRendered, present])

  if (!present && !isRendered) return null

  return <div className={`motion-presence${!present && isExiting ? ' is-exiting' : ''}`}>{lastChildren.current}</div>
}
