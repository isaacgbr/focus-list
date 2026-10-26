import type { CSSProperties } from 'react'
import { LandingScene, LandingStarfield } from './LandingScene'
import { galaxySystems, spiralArms } from './landingGalaxy'

export function LandingTransformation() {
  return (
    <LandingScene id="organizacao" className="lp-transformation" titleId="lp-organization-title">
      <LandingStarfield />
      <div className="lp-galaxy-layout">
        <div className="lp-galaxy-space lp-plane-main" role="img" aria-describedby="lp-galaxy-description"
          aria-label="Ideias dispersas encontram seu lugar em uma galáxia organizada: Área, Lista e Tarefa.">
          <div className="lp-galaxy-camera" aria-hidden="true">
            <div className="lp-gravity-field" />
            <div className="lp-galaxy-spiral">
              <div className="lp-spiral-texture">
                <svg viewBox="0 0 300 300" fill="none">
                  {spiralArms.map((arm, index) => <g key={index}>
                    <path className="lp-spiral-haze" d={arm.path} />
                    <path className="lp-spiral-flow" d={arm.path} />
                    {[0, 1, 2].map((depth) => <g className={`lp-spiral-stars lp-spiral-stars-${depth}`} key={depth}>
                      {arm.points.filter((point) => point.depth === depth).map((point, particle) => (
                        <g key={particle}>
                          {point.radius > 0.85 ? <circle cx={point.x} cy={point.y} r={point.radius * 3.2} fill="#468cf5" opacity="0.12" /> : null}
                          <circle cx={point.x} cy={point.y} r={point.radius} fill={depth === 0 ? '#eff8ff' : '#93c5fd'} opacity={point.opacity} />
                        </g>
                      ))}
                    </g>)}
                  </g>)}
                </svg>
              </div>
            </div>
            <div className="lp-gravity-ring lp-gravity-ring-outer" />
            <div className="lp-gravity-ring lp-gravity-ring-inner" />
            <div className="lp-gravity-core"><span /></div>
            <div className="lp-galaxy-dust">
              {Array.from({ length: 14 }, (_, index) => <i key={index} style={{
                '--dust-x': `${(index * 37 + 11) % 100}%`, '--dust-y': `${(index * 23 + 9) % 100}%`,
                '--dust-delay': `${-index * 1.7}s`,
              } as CSSProperties} />)}
            </div>
            <div className="lp-task-connections">
              {galaxySystems.flatMap((system, systemIndex) => system.ideas.map((idea, ideaIndex) => (
                <i key={idea.text} data-system={systemIndex} data-idea={ideaIndex} className={`lp-connection-${ideaIndex}`} />
              )))}
            </div>
            {galaxySystems.map((system, systemIndex) => (
              <div className={`lp-galaxy-system lp-galaxy-system-${systemIndex}`} key={system.name}
                style={{ '--system-x': `${system.x}%`, '--system-y': `${system.y}%`,
                  '--system-z': `${system.z}px`, '--system-tilt': `${system.tilt}deg`, '--system-scale': system.scale,
                  '--mobile-system-x': `${system.mobileX}%`, '--mobile-system-y': `${system.mobileY}%`,
                } as CSSProperties}>
                <div className="lp-system-orbit" />
                {[0, 1, 2].map((orbit) => <span className={`lp-task-orbit lp-task-orbit-${orbit}`} key={orbit}><i /></span>)}
                <span className="lp-galaxy-category"><i /><small>Área</small>{system.name}</span>
                <span className="lp-list-planet" />
                <span className="lp-galaxy-list"><small>Lista</small>{system.list}</span>
              </div>
            ))}
            {galaxySystems.flatMap((system, systemIndex) => system.ideas.map((idea, ideaIndex) => (
              <div className={`lp-idea-position lp-idea-${ideaIndex}`}
                data-system={systemIndex} data-idea={ideaIndex} key={idea.text}
                style={{
                  '--rest-x': `${system.x}%`, '--rest-y': `${system.y}%`,
                  '--mobile-rest-y': `${system.mobileY}%`,
                  '--idea-x': `${idea.x}px`, '--idea-y': `${idea.y}px`,
                  '--mobile-idea-y': `${20 + ideaIndex * 23}px`,
                } as CSSProperties}>
                <span className="lp-idea-label"><i />{idea.text}</span>
              </div>
            )))}
          </div>
        </div>
        <p className="sr-only" id="lp-galaxy-description">
          {galaxySystems.map((system) => `Área ${system.name}, lista ${system.list}: ${system.ideas.map((idea) => idea.text).join(', ')}.`).join(' ')}
        </p>
        <div className="lp-galaxy-reveal lp-plane-copy">
          <h2 id="lp-organization-title">Tudo no seu lugar.</h2>
          <p>Do caos à clareza.</p>
        </div>
      </div>
    </LandingScene>
  )
}
