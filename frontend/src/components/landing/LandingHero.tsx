import { AccessLink, LandingMark, LandingScene } from './LandingScene'
import { DemoStartButton } from '../DemoStartButton'
import '../../demo.css'

export function LandingHero() {
  return (
    <LandingScene id="inicio" className="lp-hero" titleId="lp-title">
      <div className="lp-hero-darkness" aria-hidden="true" />
      <div className="lp-hero-content">
        <div className="lp-hero-emblem lp-plane-main"><LandingMark assemble /></div>
        <div className="lp-hero-brand-plane">
          <h1 className="lp-hero-name lp-reveal" id="lp-title">Focus<span>List</span></h1>
        </div>
        <div className="lp-hero-message lp-plane-copy">
          <h2 className="lp-reveal">Organize tudo em um único lugar.</h2>
          <p className="lp-reveal">Transforme prioridades em progresso com clareza, foco e simplicidade.</p>
          <div className="lp-hero-action lp-reveal"><AccessLink register /><DemoStartButton className="lp-access lp-demo-access" /></div>
        </div>
      </div>
    </LandingScene>
  )
}
