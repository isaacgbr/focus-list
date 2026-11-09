export type DayPeriod = 'morning' | 'afternoon' | 'night'
export type HeroTheme = 'auto' | DayPeriod

const HERO_THEME_STORAGE_KEY = 'focuslist:dashboard-hero-theme'
export const heroThemeOptions: { value: HeroTheme; label: string }[] = [
  { value: 'auto', label: 'Automática' },
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
]

export function getStoredHeroTheme(): HeroTheme {
  try {
    const storedTheme = window.localStorage.getItem(HERO_THEME_STORAGE_KEY)
    return heroThemeOptions.some((option) => option.value === storedTheme) ? storedTheme as HeroTheme : 'auto'
  } catch { return 'auto' }
}

export function storeHeroTheme(theme: HeroTheme) {
  try { window.localStorage.setItem(HERO_THEME_STORAGE_KEY, theme) }
  catch { /* A preferência continua válida nesta sessão mesmo sem persistência. */ }
}
