import { HUE_TEXT } from '../hues.js'

// Tabs down the right edge: CONTENTS on the neutral board, then one ply per section in its hue.
// `route` is the current page id ("contents" or a section id).
export default function Rail({ sections, route }) {
  const tabs = [{ id: 'contents', label: 'Contents', hue: 'neutral' }, ...sections]
  return (
    <nav className="rail" aria-label="Sections">
      {tabs.map((t) => (
        <a
          key={t.id}
          className="rail-link"
          href={t.id === 'contents' ? '#/' : `#/${t.id}`}
          aria-current={t.id === route ? 'page' : undefined}
          aria-label={t.label}
          style={{ '--tab-hue': `var(--board-${t.hue})`, '--tab-text': HUE_TEXT[t.hue] }}
        >
          {t.tab ?? t.label}
        </a>
      ))}
    </nav>
  )
}
