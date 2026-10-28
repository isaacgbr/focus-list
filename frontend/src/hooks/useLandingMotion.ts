import { useEffect, useLayoutEffect, type RefObject } from 'react'
import { clamp, smooth, mix, galaxyPosition, galaxySystems, landingDemoDuration, landingDemoHold, landingDemoReset } from '../components/landing/landingGalaxy'

/** One scheduler: time keeps the environment/demo alive, pointer adds depth,
 * scroll steers the camera and the reversible galaxy narrative. */
export function useLandingMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const restoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    // A fresh landing starts at Home; section links still work after mounting.
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    return () => { window.history.scrollRestoration = restoration }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('.lp-scene'))
    const galaxy = root.querySelector<HTMLElement>('.lp-galaxy-space')
    const orderScene = root.querySelector<HTMLElement>('#organizacao')
    const productScene = root.querySelector<HTMLElement>('#produto')
    const closingScene = root.querySelector<HTMLElement>('#comece')
    const spiral = root.querySelector<HTMLElement>('.lp-galaxy-spiral')
    const systems = Array.from(root.querySelectorAll<HTMLElement>('.lp-galaxy-system'))
    const connections = Array.from(root.querySelectorAll<HTMLElement>('.lp-task-connections > i'))
    const ideas = Array.from(root.querySelectorAll<HTMLElement>('.lp-idea-position')).map((element) => ({
      element, system: Number(element.dataset.system), idea: Number(element.dataset.idea), proximity: 0,
      width: 0, height: 0, offsetX: 0, offsetY: 0,
      connection: connections.find((line) => line.dataset.system === element.dataset.system && line.dataset.idea === element.dataset.idea),
    }))
    let geometry: { element: HTMLElement; stage: HTMLElement | null; top: number; height: number; stageHeight: number }[] = []
    let galaxyBox = { x: 0, y: 0, width: 1, height: 1 }
    let galaxyActive = false
    let productActive = false
    let orbitPhase = 0
    let targetGalaxyProgress = 0
    let galaxyProgress = 0
    let galaxyReveal = 0
    let galaxySupport = 0
    const organizedAt = 0.14 + 0.55 + (galaxySystems.length - 1) * 0.022
    let handoffProgress = 0
    let closingProgress = 0
    const demoDuration = landingDemoDuration
    productScene?.style.setProperty('--demo-duration', `${demoDuration}ms`)
    let demoAnimations: Animation[] = []
    // Visible-time clocks pause offscreen and survive effect reconnection.
    let demoElapsed = Number(productScene?.dataset.demoElapsed ?? 0)
    let pointerPresent = false
    let disposed = false
    let viewportHeight = window.innerHeight
    let viewportWidth = window.innerWidth
    let pageHeight = 1
    let frame = 0
    let lastTime = 0
    let targetScroll = window.scrollY
    let cameraScroll = targetScroll
    // Native scroll owns the destination; only rendered values are damped.
    const updateScrollTargets = (snap = false) => {
      const order = geometry.find((item) => item.element === orderScene)
      const travel = order ? Math.max(viewportHeight * 0.6, (order.height - order.stageHeight) * 0.72) : 1
      targetGalaxyProgress = reduced.matches ? 1.2 : order ? clamp((targetScroll - order.top) / travel, 0, 1.2) : 0
      if (snap) {
        galaxyProgress = targetGalaxyProgress
        galaxyReveal = smooth((targetGalaxyProgress - organizedAt) / 0.064)
        galaxySupport = smooth((targetGalaxyProgress - organizedAt) / 0.084)
      }
    }
    // Marks a browser-owned menu trip; never drives or retargets its scroll.
    let menuDestination: number | null = null
    let menuFromIndex = 0
    let menuToIndex = 0
    let pointerX = 0
    let pointerY = 0
    let currentX = 0
    let currentY = 0

    // Registered camera properties do not inherit through the large SVG/demo
    // trees. Bind them once to their actual consumers, preserving CSS formulas.
    const consumers = new WeakMap<HTMLElement, Map<string, HTMLElement[]>>()
    const bind = (source: HTMLElement, selectors: Record<string, string>) => {
      consumers.set(source, new Map(Object.entries(selectors).map(([name, selector]) =>
        [name, Array.from(source.querySelectorAll<HTMLElement>(selector))])))
    }
    const pointerTargets = '.lp-plane-main, .lp-hero-brand-plane, .lp-scene-depth, .lp-hero .lp-mark, .lp-star-depth, .lp-galaxy-camera, .lp-gravity-field, .lp-galaxy-dust, .lp-demo-camera'
    bind(root, {
      '--mouse-x': pointerTargets, '--mouse-y': pointerTargets,
      '--mouse-rx': pointerTargets, '--mouse-ry': pointerTargets,
      '--world-y': '.lp-atmosphere > img', '--world-exposure': '.lp-atmosphere > img',
      '--closing-handoff': '.lp-closing-sculpture, .lp-closing-invitation h2, .lp-closing-invitation .lp-access',
      '--closing-arrival': '.lp-closing-sculpture',
    })
    for (const scene of scenes) bind(scene, {
      '--far-y': '.lp-plane-far, .lp-scene-depth', '--mid-y': '.lp-plane-mid, .lp-hero-brand-plane',
      '--main-x': '.lp-plane-main', '--main-y': '.lp-plane-main', '--main-z': '.lp-plane-main',
      '--near-y': '.lp-plane-near', '--foreground-x': '.lp-plane-near', '--transition-light': '.lp-scene-veil',
      '--copy-y': '.lp-plane-copy', '--copy-z': '.lp-plane-copy', '--copy-presence': '.lp-plane-copy',
      '--scene-scale': '.lp-plane-main', '--scene-presence': '.lp-plane-main, .lp-hero-brand-plane',
      '--galaxy-disorder': '.lp-gravity-core, .lp-gravity-core > span, .lp-galaxy-spiral, .lp-gravity-ring, .lp-task-connections',
      '--areas-presence': '.lp-galaxy-category', '--lists-presence': '.lp-list-planet',
      '--list-label-presence': '.lp-galaxy-list',
      '--systems-presence': '.lp-system-orbit, .lp-task-orbit, .lp-task-connections',
      '--galaxy-reveal': '.lp-galaxy-reveal h2', '--galaxy-support': '.lp-galaxy-reveal p',
      '--galaxy-camera-z': '.lp-galaxy-camera', '--galaxy-entry': '.lp-galaxy-camera',
      '--galaxy-lift': '.lp-galaxy-camera',
      '--galaxy-handoff': '.lp-starfield, .lp-galaxy-camera, .lp-gravity-field, .lp-gravity-ring, .lp-galaxy-dust',
      '--galaxy-fade': '.lp-galaxy-layout',
      '--demo-entry': '.lp-product-figure, .lp-product-heading',
      '--demo-exit': '.lp-product-figure, .lp-product-heading, .lp-starfield, .lp-product-nebula',
      '--demo-dissolve': '.lp-product-figure', '--demo-tilt': '.lp-demo-camera',
    })
    const styleCache = new WeakMap<HTMLElement, Map<string, string>>()
    const writeStyle = (element: HTMLElement, name: string, value: string) => {
      let cache = styleCache.get(element)
      if (!cache) { cache = new Map(); styleCache.set(element, cache) }
      if (cache.get(name) === value) return
      cache.set(name, value)
      element.style.setProperty(name, value)
    }
    const setStyle = (element: HTMLElement, name: string, value: string) => {
      writeStyle(element, name, value)
      const targets = consumers.get(element)?.get(name)
      if (targets) for (const target of targets) writeStyle(target, name, value)
    }
    const paint = () => {
      const mobile = viewportWidth < 760
      const pointerStrength = mobile || reduced.matches ? 0 : 1
      setStyle(root, '--mouse-x', `${(currentX * 9 * pointerStrength).toFixed(2)}px`)
      setStyle(root, '--mouse-y', `${(currentY * 7 * pointerStrength).toFixed(2)}px`)
      setStyle(root, '--mouse-rx', `${(-currentY * 1.2 * pointerStrength).toFixed(2)}deg`)
      setStyle(root, '--mouse-ry', `${(currentX * 1.6 * pointerStrength).toFixed(2)}deg`)
      setStyle(root, '--world-y', `${(-clamp(cameraScroll / pageHeight) * 19).toFixed(3)}%`)
      let exposure = 0.58
      for (const [index, { element, stage, top, height, stageHeight }] of geometry.entries()) {
        const entering = clamp((top - cameraScroll) / viewportHeight)
        const leaving = clamp((cameraScroll - (top + height - viewportHeight)) / viewportHeight)
        const strength = mobile ? 0.35 : 1
        const moving = !reduced.matches
        const isHero = element.id === 'inicio'
        const isOrder = element.id === 'organizacao'
        const isProduct = element.id === 'produto'
        const set = (name: string, value: number, unit = 'px') => setStyle(element, name, `${value.toFixed(3)}${unit}`)
        const presence = clamp(1 - entering) * clamp(1 - leaving)
        if (isOrder || isProduct || element === closingScene) exposure -= presence * (isOrder ? 0.05 : isProduct ? 0.16 : 0.4)
        set('--far-y', moving ? (entering * 26 - leaving * (isOrder ? 22 : 45)) * strength : 0)
        set('--mid-y', moving ? (entering * 52 - leaving * (isProduct ? 65 : 95)) * strength : 0)
        set('--main-y', moving ? (entering * (isOrder ? 110 : 75) - leaving * (isProduct ? 75 : 160)) * strength : 0)
        set('--main-x', moving ? (isHero ? -leaving * 40 : isOrder ? entering * 70 - leaving * 95 : isProduct ? -entering * 35 + leaving * 45 : 0) * strength : 0)
        set('--main-z', moving && !mobile ? (isHero ? -leaving * 230 : isOrder ? -entering * 460 - leaving * 160 : 0) : 0)
        set('--near-y', moving ? (entering * 110 - leaving * (isProduct ? 140 : 245)) * strength : 0)
        set('--foreground-x', moving ? (isOrder ? (entering - leaving) * 230 : isProduct ? leaving * -150 : leaving * 80) * strength : 0)
        set('--transition-light', moving && element.id !== 'comece' ? 0.55 + leaving * 0.45 : 1, '')
        set('--copy-y', moving ? (entering * 40 - leaving * (isOrder ? 30 : 115)) * strength : 0)
        set('--copy-z', moving && !mobile && !isOrder && element.id !== 'comece' ? -leaving * 130 : 0)
        // Transition copy remains sharp, including tiny scroll reversals.
        setStyle(element, '--copy-filter', 'none')
        set('--scene-scale', moving && !isProduct ? 1 - (entering * 0.035 + leaving * 0.11) * strength : 1, '')
        set('--scene-presence', moving ? clamp(1 - leaving * 1.5) : 1, '')
        set('--copy-presence', moving && !isOrder ? clamp(1 - leaving * 2.1) : 1, '')
        // All intermediate stages pass through in either direction. The source,
        // destination and manual narrative retain their existing sticky framing.
        const passing = menuDestination !== null
          && index > Math.min(menuFromIndex, menuToIndex) && index < Math.max(menuFromIndex, menuToIndex)
        if (stage) {
          const pinnedY = Math.min(Math.max(top - cameraScroll, 0), top + height - stageHeight - cameraScroll)
          const passageY = cameraScroll < top ? top - cameraScroll
            : -(cameraScroll - top) * stageHeight / Math.max(1, height - stageHeight)
          setStyle(stage, 'translate', passing ? `0 ${(passageY - pinnedY).toFixed(3)}px` : 'none')
        }
        if (isOrder) {
          const ordered = smooth((galaxyProgress - 0.14) / 0.55)
          set('--galaxy-disorder', 1 - ordered, '')
          set('--areas-presence', smooth((galaxyProgress - 0.28) / 0.28), '')
          set('--lists-presence', smooth((galaxyProgress - 0.47) / 0.24), '')
          set('--list-label-presence', smooth((galaxyProgress - 0.39) / 0.32), '')
          set('--systems-presence', smooth((galaxyProgress - 0.32) / 0.4), '')
          set('--galaxy-camera-z', moving ? -entering * 180 * strength : 0)
          set('--galaxy-entry', moving ? entering : 0, '')
          set('--galaxy-lift', moving ? ordered * (mobile ? 12 : 18) : 0)
          const product = geometry.find((item) => item.element === productScene)
          const start = top + height - stageHeight + viewportHeight * 0.12
          const exitReady = menuDestination !== null ? 1 : smooth((galaxyProgress - 1) / 0.2)
          handoffProgress = moving && product ? Math.min(exitReady,
            smooth((cameraScroll - start) / Math.max(1, product.top + viewportHeight * 0.48 - start))) : 0
          set('--galaxy-handoff', handoffProgress, '')
          set('--galaxy-fade', smooth(1 - entering) * (1 - handoffProgress), '')
          // Damping the narrow reveal range itself avoids a near-instant fade
          // when a large scroll jump crosses it in a single visual frame.
          set('--galaxy-reveal', galaxyReveal, '')
          set('--galaxy-support', galaxySupport, '')
        }
        if (isProduct) {
          const closing = geometry.find((item) => item.element === closingScene)
          const start = top + height - stageHeight - viewportHeight * 0.12
          const end = Math.min(closing?.top ?? top + height, pageHeight)
          closingProgress = moving ? smooth((cameraScroll - start) / Math.max(1, end - start)) : 0
          setStyle(root, '--closing-handoff', closingProgress.toFixed(3))
          setStyle(root, '--closing-arrival', (moving ? clamp((closingProgress - 0.03) / 0.94) : 1).toFixed(3))
          set('--demo-entry', moving ? smooth(1 - entering) * (menuDestination !== null ? 1 : smooth((galaxyProgress - 1) / 0.2)) : 1, '')
          set('--demo-exit', closingProgress, '')
          set('--demo-dissolve', closingProgress, '')
          set('--demo-tilt', moving && !mobile ? entering * 1.8 : 0, 'deg')
        }
      }
      setStyle(root, '--world-exposure', Math.max(0.22, exposure).toFixed(3))
    }
    const stageY = (element: HTMLElement | null) => {
      const item = geometry.find((entry) => entry.element === element)
      return item ? Math.min(Math.max(item.top - targetScroll, 0), item.top + item.height - item.stageHeight - targetScroll) : 0
    }
    const paintGalaxy = (delta: number) => {
      if (!galaxy) return
      const mobile = viewportWidth < 760
      const moving = !reduced.matches
      const disorder = moving ? 1 - smooth((galaxyProgress - 0.14) / 0.55) : 0
      // Integrated speed avoids phase jumps while the galaxy settles.
      if (galaxyRunning()) orbitPhase += delta / 1000 * mix(0.12, 0.28, disorder)
      const originY = stageY(orderScene) + galaxyBox.y
      systems.forEach((element, index) => {
        const system = galaxySystems[index]
        const dx = Math.cos(orbitPhase * 0.45 + index * 1.7) * (mobile ? 1 : 5)
        const dy = Math.sin(orbitPhase * 0.38 + index * 1.3) * (mobile ? 1 : 4)
        setStyle(element, 'transform', `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${mobile ? 0 : system.z}px) scale(${mobile ? 1 : system.scale})`)
      })
      const placements = ideas.map((item) => {
        const localDisorder = moving ? 1 - smooth((galaxyProgress - 0.14 - item.system * 0.022) / 0.55) : 0
        const position = galaxyPosition(item.system, item.idea, localDisorder, moving ? orbitPhase : 0,
          galaxyBox.width, galaxyBox.height, mobile)
        const depth = 1000 / (1000 - position.z)
        return { item, position, depth,
          x: galaxyBox.width / 2 + (position.x - galaxyBox.width / 2) * depth,
          y: galaxyBox.height / 2 + (position.y - galaxyBox.height / 2) * depth,
          halfWidth: item.width * depth * position.scale / 2 + 6, halfHeight: item.height * depth * position.scale / 2 + 5,
        }
      })
      // A small projected-space separation prevents crossing trajectories from
      // making labels collide. Metrics are cached at resize, never read per frame.
      for (let pass = 0; pass < (disorder > 0.005 ? 5 : 1); pass++) {
        for (let i = 0; i < placements.length; i++) for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i], b = placements[j]
          const overlapX = a.halfWidth + b.halfWidth - Math.abs(a.x - b.x)
          const overlapY = a.halfHeight + b.halfHeight - Math.abs(a.y - b.y)
          if (overlapX <= 0 || overlapY <= 0) continue
          const direction = a.y <= b.y ? -1 : 1
          a.y += direction * (overlapY / 2 + 0.5)
          b.y -= direction * (overlapY / 2 + 0.5)
        }
        for (const place of placements) {
          place.x = clamp(place.x, place.halfWidth + 4, galaxyBox.width - place.halfWidth - 4)
          place.y = clamp(place.y, place.halfHeight + 4, galaxyBox.height - place.halfHeight - 4)
        }
      }
      for (const { item, position, depth, x, y } of placements) {
        const desiredX = (x - galaxyBox.width / 2) / depth + galaxyBox.width / 2 - position.x
        const desiredY = (y - galaxyBox.height / 2) / depth + galaxyBox.height / 2 - position.y
        const separationEasing = !moving || delta === 0 ? 1 : 1 - Math.exp(-delta / 75)
        item.offsetX += (desiredX - item.offsetX) * separationEasing
        item.offsetY += (desiredY - item.offsetY) * separationEasing
        const screenX = galaxyBox.x + x
        const screenY = originY + y
        const distance = Math.hypot(screenX - (currentX + 1) * viewportWidth / 2, screenY - (currentY + 1) * viewportHeight / 2)
        const proximity = moving && pointerPresent && !mobile ? smooth(1 - distance / 145) : 0
        item.proximity += (proximity - item.proximity) * (1 - Math.exp(-delta / 110))
        setStyle(item.element, 'transform', `translate3d(${(position.x + item.offsetX).toFixed(2)}px, ${(position.y + item.offsetY).toFixed(2)}px, ${position.z.toFixed(2)}px) rotate(${position.rotation.toFixed(2)}deg) scale(${position.scale})`)
        setStyle(item.element, '--idea-light', item.proximity.toFixed(3))
        setStyle(item.element, '--idea-depth', clamp(position.z / 350, -0.65, 1).toFixed(3))
        if (item.connection) {
          const system = galaxySystems[item.system]
          const systemDepth = mobile ? 1 : 1000 / (1000 - system.z)
          const dx = Math.cos(orbitPhase * 0.45 + item.system * 1.7) * (mobile ? 1 : 5)
          const dy = Math.sin(orbitPhase * 0.38 + item.system * 1.3) * (mobile ? 1 : 4)
          const x1 = galaxyBox.width / 2 + (galaxyBox.width * (mobile ? system.mobileX : system.x) / 100 + dx - galaxyBox.width / 2) * systemDepth
          const y1 = galaxyBox.height / 2 + (galaxyBox.height * (mobile ? system.mobileY : system.y) / 100 + dy - galaxyBox.height / 2) * systemDepth
          const x2 = galaxyBox.width / 2 + (position.x + item.offsetX - galaxyBox.width / 2) * depth
          const y2 = galaxyBox.height / 2 + (position.y + item.offsetY - galaxyBox.height / 2) * depth
          setStyle(item.connection, 'transform', `translate3d(${x1.toFixed(2)}px, ${y1.toFixed(2)}px, 0) rotate(${Math.atan2(y2 - y1, x2 - x1).toFixed(5)}rad) scaleX(${Math.hypot(x2 - x1, y2 - y1).toFixed(2)})`)
        }
      }
      if (spiral) setStyle(spiral, 'transform', `translate3d(-50%, -50%, -70px) rotateX(44deg) rotateZ(${(-24 + orbitPhase * 180 / Math.PI * 0.28).toFixed(3)}deg)`)
    }
    const sceneReady = (scene: HTMLElement | null) => {
      const item = geometry.find((entry) => entry.element === scene)
      return item && cameraScroll >= item.top - viewportHeight * 0.18
        && cameraScroll < item.top + item.height - viewportHeight * 0.35
    }
    const galaxyRunning = () => galaxyActive && !reduced.matches && handoffProgress < 0.98
    const demoRunning = () => productActive && !reduced.matches && !!sceneReady(productScene) && closingProgress < 0.12
    const collectDemoAnimations = () => {
      // Read once at scene activation/preference change, never in the frame loop.
      demoAnimations = productScene?.getAnimations({ subtree: true }).filter((animation) =>
        animation instanceof CSSAnimation && /^(lp-demo-|lp-narrative-)/.test(animation.animationName)) ?? []
    }
    const paintDemo = (delta: number) => {
      const cycle = demoDuration + landingDemoHold + landingDemoReset
      if (!reduced.matches && demoRunning()) demoElapsed = (demoElapsed + delta) % cycle
      const progress = reduced.matches ? 1 : clamp(demoElapsed / demoDuration)
      const resetTime = reduced.matches ? 0 : clamp((demoElapsed - demoDuration - landingDemoHold) / landingDemoReset)
      const reset = smooth((resetTime - 0.42) / 0.58)
      for (const animation of demoAnimations) animation.currentTime = progress * demoDuration
      if (productScene) {
        setStyle(productScene, '--demo-reset', reset.toFixed(6))
        setStyle(productScene, '--demo-reset-out', smooth(resetTime / 0.48).toFixed(6))
      }
      if (productScene) {
        productScene.dataset.demoElapsed = String(demoElapsed)
        productScene.dataset.demoState = reduced.matches ? 'complete' : demoRunning() ? 'playing' : 'paused'
      }
    }
    const tick = (time: number) => {
      frame = 0
      if (document.hidden) return
      const elapsed = lastTime ? Math.max(0, time - lastTime) : 0
      const delta = Math.min(elapsed, 64)
      lastTime = time
      const easing = 1 - Math.exp(-delta / (pointerPresent ? 140 : 650))
      const scrollEasing = reduced.matches ? 1 : 1 - Math.exp(-delta / 100)
      const approach = (value: number, target: number, tolerance: number) => {
        const next = value + (target - value) * scrollEasing
        return Math.abs(target - next) <= tolerance ? target : next
      }
      const nextProgress = approach(galaxyProgress, targetGalaxyProgress, 0.001)
      const targetReveal = smooth((targetGalaxyProgress - organizedAt) / 0.064)
      const targetSupport = smooth((targetGalaxyProgress - organizedAt) / 0.084)
      const nextReveal = approach(galaxyReveal, targetReveal, 0.001)
      const nextSupport = approach(galaxySupport, targetSupport, 0.001)
      const narrativeChanged = nextProgress !== galaxyProgress || nextReveal !== galaxyReveal || nextSupport !== galaxySupport
      galaxyProgress = nextProgress
      galaxyReveal = nextReveal
      galaxySupport = nextSupport
      const narrativeUnsettled = galaxyProgress !== targetGalaxyProgress || galaxyReveal !== targetReveal || galaxySupport !== targetSupport
      const changed = narrativeChanged || Math.abs(targetScroll - cameraScroll) > 0.001 || Math.abs(pointerX - currentX) > 0.0001 || Math.abs(pointerY - currentY) > 0.0001
      cameraScroll += (targetScroll - cameraScroll) * (reduced.matches || menuDestination !== null ? 1 : 1 - Math.exp(-delta / 135))
      if (Math.abs(targetScroll - cameraScroll) < 0.05) cameraScroll = targetScroll
      currentX += (pointerX - currentX) * easing
      currentY += (pointerY - currentY) * easing
      const cameraUnsettled = Math.abs(targetScroll - cameraScroll) > 0.05
      const unsettled = Math.abs(pointerX - currentX) > 0.002 || Math.abs(pointerY - currentY) > 0.002
      if (!unsettled) { currentX = pointerX; currentY = pointerY }
      const runningGalaxy = galaxyRunning()
      if (changed) paint()
      if (narrativeChanged || (galaxyActive && (runningGalaxy || changed))) paintGalaxy(delta)
      if (demoRunning()) paintDemo(delta)
      else if (productScene?.dataset.demoState === 'playing') productScene.dataset.demoState = 'paused'
      if ((unsettled || cameraUnsettled || narrativeUnsettled || runningGalaxy || demoRunning()) && !reduced.matches) frame = requestAnimationFrame(tick)
    }
    const schedule = () => {
      if (reduced.matches || document.hidden) return
      if (!frame) { lastTime = 0; frame = requestAnimationFrame(tick) }
    }
    // Offset chains are untransformed coordinates; read only when measuring.
    const relativePosition = (element: HTMLElement, ancestor: Element | null) => {
      let x = 0, y = 0
      let current: HTMLElement | null = element
      while (current && current !== ancestor) {
        x += current.offsetLeft; y += current.offsetTop
        current = current.offsetParent as HTMLElement | null
      }
      return { x, y }
    }
    const measure = () => {
      const breakpointChanged = viewportWidth !== window.innerWidth
      viewportHeight = window.innerHeight
      viewportWidth = window.innerWidth
      // A media query can cancel/recreate animations in the compact sidebar.
      if (breakpointChanged) collectDemoAnimations()
      // Batch layout reads before writes. No layout reads in the animation loop.
      geometry = scenes.map((element) => ({
        element, top: element.getBoundingClientRect().top + window.scrollY,
        stage: element.querySelector<HTMLElement>('.lp-stage'),
        height: element.offsetHeight,
        stageHeight: element.querySelector<HTMLElement>('.lp-stage')?.offsetHeight ?? viewportHeight,
      }))
      if (galaxy) galaxyBox = { ...relativePosition(galaxy, orderScene?.querySelector('.lp-stage') ?? null), width: galaxy.offsetWidth, height: galaxy.offsetHeight }
      for (const item of ideas) {
        const label = item.element.firstElementChild as HTMLElement | null
        item.width = label?.offsetWidth ?? 0
        item.height = label?.offsetHeight ?? 0
      }
      pageHeight = Math.max(1, root.offsetHeight - viewportHeight)
      targetScroll = window.scrollY
      cameraScroll = targetScroll
      updateScrollTargets(true)
      paint()
      paintGalaxy(0)
      paintDemo(0)
      schedule()
    }
    const onScroll = () => {
      targetScroll = window.scrollY
      updateScrollTargets(reduced.matches)
      // Reduced motion has no animation loop, but still needs scroll state.
      if (reduced.matches) paint()
      schedule()
    }
    const onAnchor = (smoothNavigation = false) => {
      const scene = scenes.find((element) => `#${element.id}` === window.location.hash)
      if (!scene) return
      const index = geometry.findIndex((item) => item.element === scene)
      const item = geometry[index]
      if (!item) return
      const previous = geometry[index - 1]
      // Links land beyond the prior scene's overlap, with the stage still pinned.
      // This offset is exclusive to anchors; manual scrolling is never adjusted.
      const framed = scene === orderScene || scene === productScene
      const top = framed && previous ? Math.max(item.top, previous.top + previous.height) : item.top
      if (smoothNavigation && !reduced.matches) {
        if (scene === productScene) demoElapsed = 0
        menuDestination = top
        menuFromIndex = geometry.reduce((current, entry, i) => entry.top <= window.scrollY + 1 ? i : current, 0)
        menuToIndex = index
        // One browser-owned trip to the final anchor, independent of scene clocks.
        window.scrollTo({ top, behavior: 'smooth' })
        return
      }
      menuDestination = null
      window.scrollTo({ top, behavior: 'instant' })
      targetScroll = cameraScroll = window.scrollY
      updateScrollTargets(true)
      if (scene === productScene) demoElapsed = 0
      paint()
      paintGalaxy(0)
      paintDemo(0)
      schedule()
    }
    const onHashChange = () => onAnchor()
    // Scene pacing resumes at arrival or before any native manual input.
    const endMenuTraversal = () => {
      menuDestination = null
      for (const { stage } of geometry) if (stage) setStyle(stage, 'translate', 'none')
    }
    const onNavigationKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) endMenuTraversal()
    }
    const onAnchorClick = (event: MouseEvent) => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (link?.closest('.lp-header') && ['#organizacao', '#produto', '#comece'].includes(link.hash)) {
        event.preventDefault()
        if (link.hash !== window.location.hash) window.history.pushState(window.history.state, '', link.hash)
        onAnchor(true)
        return
      }
      // A repeated hash does not dispatch hashchange, but must still frame the scene.
      if (link?.hash === window.location.hash && scenes.some((scene) => `#${scene.id}` === link.hash)) {
        event.preventDefault()
        onAnchor()
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== 'mouse' || reduced.matches) return
      pointerPresent = true
      pointerX = clamp(event.clientX / viewportWidth * 2 - 1, -1, 1)
      pointerY = clamp(event.clientY / viewportHeight * 2 - 1, -1, 1)
      schedule()
    }
    const resetPointer = () => { pointerPresent = false; pointerX = 0; pointerY = 0; schedule() }
    const onVisibility = () => {
      root.dataset.hidden = String(document.hidden)
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; if (productScene) productScene.dataset.demoState = 'paused' }
      else { targetScroll = window.scrollY; updateScrollTargets(reduced.matches); lastTime = 0; schedule() }
    }
    const onPreference = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (reduced.matches && menuDestination !== null) {
        window.scrollTo({ top: menuDestination, behavior: 'instant' })
        endMenuTraversal()
      }
      pointerPresent = false
      currentX = currentY = pointerX = pointerY = 0
      root.dataset.motion = reduced.matches ? 'reduced' : 'full'
      collectDemoAnimations()
      measure()
    }
    // CSS and orbit time pause offscreen and in hidden tabs.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const scene = entry.target.closest<HTMLElement>('.lp-scene')
        if (!scene) continue
        const active = entry.isIntersecting && entry.intersectionRatio >= 0.15
        scene.dataset.active = String(active)
        if (active) scene.dataset.entered = 'true'
        if (scene === orderScene) galaxyActive = active
        if (scene === productScene) {
          productActive = active
          if (active && !demoAnimations.length) collectDemoAnimations()
          paintDemo(0)
        }
        schedule()
      }
    }, { threshold: [0, 0.15, 0.3] })
    scenes.forEach((scene) => {
      // Track the galaxy itself: its sticky stage can still intersect after all
      // of its expensive content has already left the viewport.
      const surface = scene === orderScene ? galaxy : scene.querySelector('.lp-stage')
      if (surface) observer.observe(surface)
    })
    root.dataset.hidden = String(document.hidden)
    onPreference()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(root)
    // Font metrics can settle after the first layout without resizing the root.
    void document.fonts.ready.then(() => { if (!disposed) measure() })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', endMenuTraversal)
    window.addEventListener('wheel', endMenuTraversal, { passive: true })
    window.addEventListener('touchstart', endMenuTraversal, { passive: true })
    window.addEventListener('pointerdown', endMenuTraversal, { passive: true })
    window.addEventListener('keydown', onNavigationKey)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('resize', measure, { passive: true })
    root.addEventListener('click', onAnchorClick)
    root.addEventListener('pointermove', onPointerMove, { passive: true })
    root.addEventListener('pointerleave', resetPointer)
    window.addEventListener('blur', resetPointer)
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', onPreference)
    finePointer.addEventListener('change', resetPointer)
    return () => {
      disposed = true
      demoAnimations = []
      cancelAnimationFrame(frame)
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', endMenuTraversal)
      window.removeEventListener('wheel', endMenuTraversal)
      window.removeEventListener('touchstart', endMenuTraversal)
      window.removeEventListener('pointerdown', endMenuTraversal)
      window.removeEventListener('keydown', onNavigationKey)
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('resize', measure)
      root.removeEventListener('click', onAnchorClick)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', resetPointer)
      window.removeEventListener('blur', resetPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', onPreference)
      finePointer.removeEventListener('change', resetPointer)
    }
  }, [rootRef])
}
