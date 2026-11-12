// Text colour that reads on each board hue: the light boards take ink, the dark ones take the sheet.
export const HUE_TEXT = {
  neutral: 'var(--ink)',
  orange: 'var(--ink)',
  yellow: 'var(--ink)',
  grass: 'var(--ink)',
  teal: 'var(--ink)',
  ultramarine: 'var(--sheet)',
  violet: 'var(--sheet)',
  sienna: 'var(--sheet)',
}

// CSS variables that put an element in a section's hue: --hue (the board) and --hue-text (text on it).
export const hueVars = (hue = 'neutral') => ({
  '--hue': `var(--board-${hue})`,
  '--hue-text': HUE_TEXT[hue] ?? 'var(--ink)',
})
