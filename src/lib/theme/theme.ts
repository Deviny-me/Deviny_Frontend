export type Theme = 'light' | 'dark'

/**
 * Apply theme class to the root element
 */
export function applyThemeToRoot(theme: Theme): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

/**
 * Get theme label for UI display
 */
export function mapThemeLabel(theme: Theme): string {
  return theme === 'dark' ? 'Тёмная' : 'Светлая'
}

/**
 * Get opposite theme
 */
export function getOppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}
