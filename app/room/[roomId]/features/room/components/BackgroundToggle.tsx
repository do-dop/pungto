import type { ShellBackgroundKey } from '../types'
import { shellBackgroundLabels } from '../constants'

type BackgroundToggleProps = {
  shellBackground: ShellBackgroundKey
  onToggle: () => void
}

export function BackgroundToggle({ shellBackground, onToggle }: BackgroundToggleProps) {
  return (
    <button
      className="shell-fab"
      onClick={onToggle}
      type="button"
      title={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
      aria-label={`배경 전환: 현재 ${shellBackgroundLabels[shellBackground]}`}
    >
      BG
    </button>
  )
}
