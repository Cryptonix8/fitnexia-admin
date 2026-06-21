import { useTheme } from '../contexts/ThemeContext'
import { IconMoon, IconSun } from './icons'

type ThemeToggleProps = {
  variant?: 'sidebar' | 'inline'
  collapsed?: boolean
}

export default function ThemeToggle({ variant = 'inline', collapsed = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  if (variant === 'sidebar') {
    if (collapsed) {
      return (
        <button
          type="button"
          className="sidebarThemeBtn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </button>
      )
    }

    return (
      <button
        type="button"
        className="themeToggle"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="sidebarLabel">{isDark ? 'Dark mode' : 'Light mode'}</span>
        <span className={`themeToggleTrack${isDark ? ' on' : ''}`}>
          <span className="themeToggleThumb">
            {isDark ? <IconMoon /> : <IconSun />}
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="loginThemeBtn"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  )
}
