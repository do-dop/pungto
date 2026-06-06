import type { CSSProperties } from 'react'
import type { ShellBackgroundKey } from './types'
import { shellBackgroundOrder } from './constants'

export function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== 'object') return error

  const candidate = error as {
    code?: string
    message?: string
    details?: string
    hint?: string
  }

  return {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint,
  }
}

export function getShellBackgroundStyle(backgroundKey: ShellBackgroundKey): CSSProperties {
  if (backgroundKey === 'rolophus') {
    return {
      backgroundColor: '#efe8dc',
      backgroundImage: "linear-gradient(rgba(249, 245, 239, 0.3), rgba(249, 245, 239, 0.3)), url('/rolophus.webp')",
      backgroundSize: '180px 180px',
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center',
    }
  }

  return {
    backgroundImage: `
      radial-gradient(circle at top, rgba(83, 74, 183, 0.1), transparent 30%),
      linear-gradient(180deg, #f7f3ee 0%, #f5f5f3 100%)
    `,
  }
}

export function getNextShellBackground(backgroundKey: ShellBackgroundKey): ShellBackgroundKey {
  const currentIndex = shellBackgroundOrder.indexOf(backgroundKey)
  return shellBackgroundOrder[(currentIndex + 1) % shellBackgroundOrder.length]
}
