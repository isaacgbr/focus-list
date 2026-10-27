import { Github, Linkedin, ExternalLink } from 'lucide-react'
import { AccessLink, LandingMark, LandingScene } from './LandingScene'

export function LandingClosing() {
  return (
    <LandingScene id="comece" className="lp-closing" titleId="lp-closing-title">
      <div className="lp-closing-content">
        <div className="lp-closing-invitation lp-plane-copy">
          <h2 id="lp-closing-title">Comece a organizar o que importa.</h2>
          <AccessLink register />
        </div>
        <div className="lp-closing-sculpture lp-plane-main"><LandingMark /></div>
      </div>
      <footer className="lp-footer lp-plane-copy">
        <div><p>Desenvolvido por <strong>Isaac Gabriel</strong></p><span>Estudante de Análise e Desenvolvimento de Sistemas</span></div>
        <nav aria-label="Redes de Isaac Gabriel">
          <a href="https://github.com/isaacgbr" target="_blank" rel="noreferrer"><Github size={17} aria-hidden="true" />GitHub<ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></a>
          <a href="https://www.linkedin.com/in/isaacgbr" target="_blank" rel="noreferrer"><Linkedin size={17} aria-hidden="true" />LinkedIn<ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></a>
        </nav>
      </footer>
    </LandingScene>
  )
}
