import { useEffect, useRef } from 'react'

// One acetate leaf in the stack. `entry.motion` is "turn-in" when a pointer opened it,
// "turn-out" while a pointer closes it, or null (keyboard: no motion).
// `isTop` marks the leaf that owns focus; leaves under it stay drawn but inert.
// A record's `children` render inline as headed detail sections; the leaf scrolls.
// `onBack` (nested leaves only) closes this leaf; `onClose` closes the whole stack.
// A row of external links ({ label, href }), such as a repository or a live demo.
function Links({ links }) {
  if (!links?.length) return null
  return (
    <p className="leaf-related label">
      {links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>
      ))}
    </p>
  )
}

export default function Leaf({ entry, depth, isTop, onBack, onClose }) {
  const { record } = entry
  const ref = useRef(null)
  const titleId = `leaf-${entry.key}-title`

  useEffect(() => {
    if (isTop) ref.current?.querySelector('.leaf-title')?.focus({ preventScroll: true })
    ref.current?.toggleAttribute('inert', !isTop)
  }, [isTop])

  return (
    <article
      ref={ref}
      className={`leaf${entry.motion ? ` ${entry.motion}` : ''}`}
      style={{ '--depth': depth }}
      role="dialog"
      aria-modal={isTop ? 'true' : undefined}
      aria-labelledby={titleId}
      data-leaf-top={isTop ? '' : undefined}
    >
      <span className="leaf-hole leaf-hole-1" aria-hidden="true" />
      <span className="leaf-hole leaf-hole-2" aria-hidden="true" />
      <header className="leaf-head">
        <div className="leaf-titlebar">
          <h2 id={titleId} className="leaf-title" tabIndex={-1}>{record.title}</h2>
          <div className="leaf-actions">
            {onBack && <button type="button" className="btn" onClick={onBack}>Back</button>}
            <button type="button" className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
        {record.meta && <p className="leaf-kicker">{record.meta}</p>}
        <Links links={record.links} />
      </header>
      <div className="leaf-body">
        {record.summary && <p className="summary">{record.summary}</p>}
        {record.points?.length > 0 && (
          <ul className="points">{record.points.map((p) => <li key={p}>{p}</li>)}</ul>
        )}
        {record.tags?.length > 0 && (
          <ul className="chips" aria-label="Tools">{record.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        )}
        {record.children?.map((c) => (
          <section className="detail" key={c.id} aria-labelledby={`detail-${c.id}`}>
            <h3 id={`detail-${c.id}`} className="detail-title">{c.title}</h3>
            {c.meta && <p className="leaf-kicker">{c.meta}</p>}
            <Links links={c.links} />
            {c.summary && <p className="summary">{c.summary}</p>}
            {c.points?.length > 0 && (
              <ul className="points">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
            )}
            {c.tags?.length > 0 && (
              <ul className="chips" aria-label="Tools">{c.tags.map((t) => <li key={t}>{t}</li>)}</ul>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
