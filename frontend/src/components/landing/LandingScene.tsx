import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { galaxyStarLayers } from './landingGalaxy'

export function LandingStarfield() {
  return (
    <div className="lp-starfield" aria-hidden="true">
      {galaxyStarLayers.map((stars, depth) => (
        <div className={`lp-star-depth lp-star-depth-${depth}`} key={depth}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {stars.map((star, index) => <circle key={index} cx={star.x} cy={star.y}
              r={star.radius} opacity={star.opacity} />)}
          </svg>
        </div>
      ))}
    </div>
  )
}

export function AccessLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`lp-access${compact ? ' lp-access-compact' : ''}`} to="/app">
      Acessar FocusList <ArrowRight size={compact ? 16 : 18} aria-hidden="true" />
    </Link>
  )
}

export function LandingMark({ assemble = false, sculpture = false }: { assemble?: boolean; sculpture?: boolean }) {
  return (
    <div className={`lp-mark${assemble ? ' lp-mark-assemble' : ''}${sculpture ? ' lp-mark-sculpture' : ''}`} aria-hidden="true">
      <div className="lp-mark-breath">
        {assemble ? (
          <>
            <span className="lp-mark-seed" />
            <div className="lp-mark-fold">
              <img className="lp-mark-whole" src="/focuslist-mark.png" alt="" width="256" height="256" />
              {[0, 1, 2].map((layer) => (
                <img key={layer} className={`lp-mark-layer lp-mark-layer-${layer}`} src="/focuslist-mark.png" alt="" width="256" height="256" />
              ))}
            </div>
          </>
        ) : sculpture ? (
          <>
            {[0, 1, 2].map((layer) => (
              <img key={layer} className={`lp-mark-layer lp-mark-layer-${layer}`} src="/focuslist-mark.png" alt="" width="256" height="256" />
            ))}
          </>
        ) : <img className="lp-mark-whole" src="/focuslist-mark.png" alt="" width="256" height="256" />}
      </div>
      {assemble ? <span className="lp-mark-sweep" /> : null}
    </div>
  )
}

export function LandingScene({ id, className, titleId, children }: {
  id: string
  className: string
  titleId: string
  children: ReactNode
}) {
  return (
    <section className={`lp-scene ${className}`} id={id} aria-labelledby={titleId}>
      <div className="lp-stage">
        <div className="lp-scene-depth" aria-hidden="true" />
        <div className="lp-scene-light lp-plane-far" aria-hidden="true" />
        <div className="lp-scene-ground lp-plane-mid" aria-hidden="true" />
        {children}
        <div className="lp-scene-veil lp-plane-near" aria-hidden="true" />
      </div>
    </section>
  )
}
