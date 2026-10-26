// Shared coordinates keep the DOM, animation and accessible description in sync.
export const galaxySystems = [
  { name: 'Estudos', list: 'Concurso público', x: 27, y: 32, z: 100, tilt: -18, scale: 1.08, mobileX: 42, mobileY: 12, ideas: [
    { text: 'Revisar Português', x: -65, y: 31, chaosX: 17, chaosY: 14, z: 90 },
    { text: 'Resolver questões', x: 68, y: 48, chaosX: 66, chaosY: 17, z: -100 },
    { text: 'Fazer simulado', x: -10, y: 78, chaosX: 78, chaosY: 83, z: 55 },
  ] },
  { name: 'Projetos', list: 'Reforma do quarto', x: 66, y: 16, z: -150, tilt: 24, scale: 0.94, mobileX: 60, mobileY: 36, ideas: [
    { text: 'Definir orçamento', x: -65, y: 31, chaosX: 82, chaosY: 12, z: 75 },
    { text: 'Comprar materiais', x: 68, y: 48, chaosX: 18, chaosY: 66, z: -110 },
    { text: 'Agendar serviço', x: -10, y: 78, chaosX: 40, chaosY: 10, z: 25 },
  ] },
  { name: 'Carreira', list: 'Nova oportunidade', x: 73, y: 59, z: 45, tilt: -30, scale: 1, mobileX: 41, mobileY: 60, ideas: [
    { text: 'Atualizar currículo', x: -65, y: 31, chaosX: 25, chaosY: 87, z: 65 },
    { text: 'Enviar candidatura', x: 68, y: 48, chaosX: 84, chaosY: 55, z: -85 },
    { text: 'Preparar entrevista', x: -10, y: 78, chaosX: 13, chaosY: 39, z: 100 },
  ] },
  { name: 'Pessoal', list: 'Casa e rotina', x: 33, y: 78, z: -90, tilt: 14, scale: 0.96, mobileX: 56, mobileY: 84, ideas: [
    { text: 'Pagar energia', x: -65, y: 31, chaosX: 53, chaosY: 88, z: 35 },
    { text: 'Marcar consulta', x: 68, y: 48, chaosX: 70, chaosY: 70, z: -75 },
    { text: 'Fazer compras', x: -10, y: 78, chaosX: 41, chaosY: 35, z: -100 },
  ] },
]

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
export const mix = (from: number, to: number, progress: number) => from + (to - from) * progress

/** Scroll attracts ideas into the shared space; time keeps every orbit alive.
 * Inclined orbits retain depth after settling; labels remain camera-facing. */
export function galaxyPosition(systemIndex: number, ideaIndex: number, disorder: number, phase: number,
  width: number, height: number, mobile: boolean) {
  const system = galaxySystems[systemIndex]
  const idea = system.ideas[ideaIndex]
  const t = phase * (0.82 + ideaIndex * 0.17) + systemIndex * 2.4 + ideaIndex * 1.9
  const centerX = width * (mobile ? system.mobileX : system.x) / 100
  const centerY = height * (mobile ? system.mobileY : system.y) / 100
  const inclination = (system.tilt + ideaIndex * 27) * Math.PI / 180
  const orbit = t + ideaIndex * 0.5
  const radius = width * (0.2 + ideaIndex * 0.065)
  // Narrow screens keep all twelve ideas readable within staggered orbital bands.
  const chaosX = mobile ? width * (ideaIndex === 0 ? 0.28 : ideaIndex === 1 ? 0.72 : 0.5)
    : width * 0.5 + Math.cos(orbit) * radius
  const chaosY = mobile ? centerY + 13 + ideaIndex * 23
    : height * 0.48 + Math.sin(orbit) * height * (0.23 + ideaIndex * 0.045) * Math.cos(inclination)
  const scale = mobile ? 1 : system.scale
  const driftX = Math.cos(phase * 0.45 + systemIndex * 1.7) * (mobile ? 1 : 5)
  const driftY = Math.sin(phase * 0.38 + systemIndex * 1.3) * (mobile ? 1 : 4)
  const orderedZ = mobile ? 0 : system.z + Math.sin(t) * 12
  return {
    x: mix(centerX + idea.x * (mobile ? 0.62 : scale), chaosX, disorder) + driftX,
    y: mix(centerY + (mobile ? 17 + ideaIndex * 24 : idea.y * scale), chaosY, disorder) + driftY,
    z: mix(orderedZ, idea.z + Math.sin(orbit) * Math.sin(inclination) * 240, disorder) * (mobile ? 0 : 1),
    scale,
    rotation: Math.sin(t * 0.7) * disorder * (mobile ? 1 : 3),
  }
}

// Deterministic textures are built once. Organic arm width comes from many
// individual stars, not from thick strokes or per-frame random generation.
const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

export const galaxyStarLayers = [42, 30, 18].map((count, depth) =>
  Array.from({ length: count }, (_, index) => ({
    x: noise(index * 7 + depth * 101) * 100,
    y: noise(index * 11 + depth * 131) * 100,
    radius: 0.07 + noise(index + depth * 71) * (0.1 + depth * 0.035),
    opacity: 0.25 + noise(index * 3 + depth * 97) * 0.55,
  })))

export const landingDemoDuration = 12200
export const landingDemoHold = 1800
export const landingDemoReset = 1800

export const spiralArms = Array.from({ length: 4 }, (_, arm) => {
  const centerline = Array.from({ length: 56 }, (_, index) => {
    const radius = 7 + index * 2.1
    const angle = arm * Math.PI / 2 + index * 0.089
    return { x: 150 + Math.cos(angle) * radius, y: 150 + Math.sin(angle) * radius }
  })
  const points = Array.from({ length: 156 }, (_, index) => {
    const seed = index + arm * 193
    const progress = (index + noise(seed)) / 156
    const radius = 6 + progress * 116
    const angle = arm * Math.PI / 2 + progress * 4.9 + (noise(seed * 3) - 0.5) * 0.22
    const spread = (noise(seed * 7) - 0.5) * (4 + progress * 21)
    return {
      x: 150 + Math.cos(angle) * (radius + spread),
      y: 150 + Math.sin(angle) * (radius + spread),
      radius: 0.28 + noise(seed * 13) ** 3 * 1.05,
      opacity: 0.35 + noise(seed * 17) * 0.6,
      depth: index % 3,
    }
  })
  return {
    path: centerline.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
    points,
  }
})
