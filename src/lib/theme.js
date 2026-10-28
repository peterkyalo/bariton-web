const HEX = /^#[0-9a-fA-F]{6}$/
const STORAGE_KEY = 'bariton_theme'

export const DEFAULT_THEME = {
  primary: '#c8913a',
  secondary: '#2f6fe4',
}

/**
 * Apply brand colors by setting the CSS variables that drive the
 * primary ("brass") and secondary ("blue/indigo/aria") palettes.
 * Invalid values fall back to defaults.
 */
export function applyTheme({ primary, secondary } = {}) {
  const p = HEX.test(primary || '') ? primary : DEFAULT_THEME.primary
  const s = HEX.test(secondary || '') ? secondary : DEFAULT_THEME.secondary
  const root = document.documentElement
  root.style.setProperty('--brand-primary', p)
  root.style.setProperty('--brand-secondary', s)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: p, secondary: s }))
  } catch {
    // storage unavailable; ignore
  }
  return { primary: p, secondary: s }
}

/** Apply the last known theme immediately (avoids a color flash before the API responds). */
export function applyCachedTheme() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (cached) applyTheme(cached)
  } catch {
    // ignore corrupt cache
  }
}

export function themeFromSettings(settings) {
  return {
    primary: settings?.brand_primary_color,
    secondary: settings?.brand_secondary_color,
  }
}
