import { useCallback, useEffect, useRef, useState } from 'react'
import { profile, sections } from './content.js'
import { hueVars } from './hues.js'
import Rail from './components/Rail.jsx'
import Page from './components/Page.jsx'
import Leaf from './components/Leaf.jsx'

const ORDER = ['contents', ...sections.map((s) => s.id)]
const CLOSE_TURN_MS = 140

// The page id from the address: "#/experience" → "experience"; anything unknown → "contents".
const readRoute = () => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return ORDER.includes(id) ? id : 'contents'
}
const hrefFor = (id) => (id === 'contents' ? '#/' : `#/${id}`)
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

let nextKey = 1

export default function App() {
  const [route, setRoute] = useState(readRoute)
  // Open leaves, bottom to top: { key, record, motion, opener }.
  const [stack, setStack] = useState([])
  const stackRef = useRef(stack)
  stackRef.current = stack
  const pageRef = useRef(null)
  const headingRef = useRef(null)
  const firstRoute = useRef(true)

  const section = sections.find((s) => s.id === route)
  const hue = section?.hue ?? 'neutral'

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // A new page closes every leaf, returns to the top and moves focus to the page heading.
  useEffect(() => {
    setStack([])
    if (firstRoute.current) { firstRoute.current = false; return }
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [route])

  // Opens `record` at `depth`, replacing any leaves from there up. Only a pointer open turns
  // the hinge (event.detail > 0); swapping the first leaf for another row has no motion.
  const openAt = useCallback((depth) => (record, event) => {
    const pointer = event.detail > 0
    const opener = event.currentTarget
    setStack((s) => {
      const swap = depth === 0 && s.length > 0
      const motion = pointer && !swap ? 'turn-in' : null
      return [...s.slice(0, depth), { key: nextKey++, record, motion, opener }]
    })
  }, [])

  // Closes the leaves at `depth` and above. A pointer close turns them out first; a key closes at once.
  // Focus returns to the control that opened the lowest closed leaf.
  const closeFrom = useCallback((depth, event) => {
    const s = stackRef.current
    if (depth >= s.length) return
    const opener = s[depth].opener
    // Back to the opener; if it is gone, to the title of the leaf that is now on top.
    const refocus = () => requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      else document.querySelector('[data-leaf-top] .leaf-title')?.focus({ preventScroll: true })
    })
    if ((event?.detail ?? 0) === 0) {
      setStack((cur) => cur.slice(0, depth))
      refocus()
      return
    }
    setStack((cur) => cur.map((e, i) => (i >= depth ? { ...e, motion: 'turn-out' } : e)))
    setTimeout(() => {
      setStack((cur) => cur.slice(0, depth))
      refocus()
    }, prefersReducedMotion() ? 90 : CLOSE_TURN_MS)
  }, [])

  const leavesOpen = stack.length > 0

  useEffect(() => {
    pageRef.current?.toggleAttribute('inert', leavesOpen)
  }, [leavesOpen])

  // A click anywhere but the leaves, their crumbs, the rail or the top bar closes every leaf.
  useEffect(() => {
    if (!leavesOpen) return
    const onClick = (e) => {
      if (e.target.closest?.('.leaf, .leaf-crumbs, .rail, .topbar')) return
      closeFrom(0, e)
    }
    // Attached after the opening click has finished bubbling, so that click cannot close the leaf.
    const timer = setTimeout(() => document.addEventListener('click', onClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onClick)
    }
  }, [leavesOpen, closeFrom])

  // Esc closes the top leaf and Tab stays inside it; [ and ] step through the pages.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && stack.length) { e.preventDefault(); closeFrom(stack.length - 1); return }
      if (e.key === 'Tab' && stack.length) {
        const top = document.querySelector('[data-leaf-top]')
        const items = top ? [...top.querySelectorAll('button, a[href]')] : []
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || !top.contains(document.activeElement))) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        return
      }
      if ((e.key === '[' || e.key === ']') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const i = ORDER.indexOf(route) + (e.key === ']' ? 1 : -1)
        if (i >= 0 && i < ORDER.length) window.location.hash = hrefFor(ORDER[i])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [stack.length, route, closeFrom])

  const crumbs = section
    ? [{ label: section.label, depth: 0 }, ...stack.map((e, i) => ({ label: e.record.title, depth: i + 1 }))]
    : []

  return (
    <div style={hueVars(hue)}>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="topbar">
        <a className="topbar-title" href="#/">{profile.name}</a>
        <nav className="topbar-links label" aria-label="Profiles">
          <a className="topbar-more" href={`mailto:${profile.email}`}>Email</a>
          {profile.links.map((l) => <a key={l.href} className="topbar-more" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
          <a className="topbar-resume" href={profile.resume} target="_blank" rel="noreferrer">Resume ↗</a>
        </nav>
      </header>

      <div className="shell">
        <main id="main" ref={pageRef} className={`page${leavesOpen ? ' is-under' : ''}`}>
          <Page
            ref={headingRef}
            route={route}
            sections={sections}
            onOpen={openAt(0)}
            selectedId={stack[0]?.record.id}
          />
        </main>
        <Rail sections={sections} route={route} />
      </div>

      {leavesOpen && (
        <div className="leaf-layer">
          <nav className="leaf-crumbs" aria-label="Trail">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1
              return (
                <span key={c.depth}>
                  {i > 0 && ' › '}
                  {last
                    ? <span aria-current="page">{c.label}</span>
                    : <button type="button" className="crumb-link" onClick={(e) => closeFrom(c.depth, e)}>{c.label}</button>}
                </span>
              )
            })}
          </nav>
          {stack[0].motion === 'turn-in' && <div className="leaf-wedge" aria-hidden="true" />}
          {stack.map((entry, depth) => (
            <Leaf
              key={entry.key}
              entry={entry}
              depth={depth}
              isTop={depth === stack.length - 1}
              onBack={depth > 0 ? (e) => closeFrom(depth, e) : undefined}
              onClose={(e) => closeFrom(0, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
