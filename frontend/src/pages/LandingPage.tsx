import { useRef } from 'react'

import { Brand } from '../components/Brand'
import { LandingHero } from '../components/landing/LandingHero'
import { LandingTransformation } from '../components/landing/LandingTransformation'
import { LandingProductDemo } from '../components/landing/LandingProductDemo'
import { LandingClosing } from '../components/landing/LandingClosing'
import { AccessLink } from '../components/landing/LandingScene'
import { useLandingMotion } from '../hooks/useLandingMotion'
import '../landing.css'

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useLandingMotion(rootRef)

  return (
    <div className="lp-page" ref={rootRef} data-motion="full">
      <a className="lp-skip" href="#landing-content">Pular para o conteúdo</a>
      <div className="lp-atmosphere" aria-hidden="true">
        <img src="/landing-atmosphere-23i.png" alt="" width="1024" height="1536" fetchPriority="high" />
        <div className="lp-atmosphere-shade" />
      </div>
      <header className="lp-header">
        <a href="#inicio" aria-label="FocusList — início"><Brand /></a>
        <nav aria-label="Navegação da apresentação">
          <a className="lp-product-link" href="#organizacao">Organização</a>
          <a className="lp-product-link" href="#produto">Demonstração</a>
          <a className="lp-product-link" href="#comece">Sobre</a>
          <AccessLink compact />
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
