import { useRef } from 'react'
import { Menu } from 'lucide-react'

import { Brand } from '../components/Brand'
import { LandingHero } from '../components/landing/LandingHero'
import { LandingTransformation } from '../components/landing/LandingTransformation'
import { LandingProductDemo } from '../components/landing/LandingProductDemo'
import { LandingClosing } from '../components/landing/LandingClosing'
import { AccessLink } from '../components/landing/LandingScene'
import { useLandingMotion } from '../hooks/useLandingMotion'
import '../landing.css'

const sectionLinks = [
  ['#organizacao', 'Organização'],
  ['#produto', 'Demonstração'],
  ['#comece', 'Sobre'],
]

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDetailsElement>(null)
  useLandingMotion(rootRef)

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false
  }

  return (
    <div className="lp-page" ref={rootRef} data-motion="full">
      <a className="lp-skip" href="#landing-content">Pular para o conteúdo</a>
      <div className="lp-atmosphere" aria-hidden="true">
        <img src="/landing-atmosphere-23i.webp" alt="" width="1024" height="1536" fetchPriority="high" />
        <div className="lp-atmosphere-shade" />
      </div>
      <header className="lp-header">
        <a href="#inicio" aria-label="FocusList — início"><Brand /></a>
        <nav aria-label="Navegação da apresentação">
          {sectionLinks.map(([href, label]) => <a key={href} className="lp-product-link" href={href}>{label}</a>)}
          <AccessLink compact />
          <details className="lp-mobile-menu" ref={menuRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) closeMenu()
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !event.currentTarget.open) return
              event.preventDefault()
              event.currentTarget.querySelector('summary')?.focus()
              closeMenu()
            }}>
            <summary aria-label="Menu da apresentação"><Menu size={20} aria-hidden="true" /></summary>
            <div className="lp-mobile-menu-panel">
              {sectionLinks.map(([href, label]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
            </div>
          </details>
        </nav>
      </header>
      <main id="landing-content" tabIndex={-1}>
        <LandingHero />
        <LandingTransformation />
        <LandingProductDemo />
        <LandingClosing />
      </main>
    </div>
  )
}
