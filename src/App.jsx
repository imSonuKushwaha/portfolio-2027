import { useCallback, useEffect, useRef, useState } from 'react'
import { profile, sections } from './content.js'
import { hueVars } from './hues.js'
import Rail from './components/Rail.jsx'
import Page from './components/Page.jsx'
import Leaf from './components/Leaf.jsx'

const ORDER = ['contents', ...sections.map((s) => s.id)]
// Matches the slide-out duration in styles.css; reduced motion uses its shorter fade.
const SLIDE_OUT_MS = 220
const FADE_OUT_MS = 90

// The page and open leaf from the address: "#/experience/ripik" → page "experience", leaf "ripik".
// An unknown page reads as "contents"; a leaf id only counts on a page with records.
const readHash = () => {
  const [id = '', leafId = null] = window.location.hash.replace(/^#\/?/, '').split('/')
  const route = ORDER.includes(id) ? id : 'contents'
  return { route, leafId: route === 'contents' ? null : leafId || null }
}
const hrefFor = (id) => (id === 'contents' ? '#/' : `#/${id}`)
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

let nextKey = 1

export default function App() {
  const [{ route, leafId }, setLocation] = useState(readHash)
  // Open leaves, bottom to top: { key, record, motion, opener }.
  const [stack, setStack] = useState([])
  const stackRef = useRef(stack)
  stackRef.current = stack
  const pageRef = useRef(null)
  const headingRef = useRef(null)
  const firstRoute = useRef(true)
  // The card that asked for the next leaf, so focus can return to it on close.
  const openerRef = useRef(null)
  // True while the open leaf's history entry was pushed by this tab, so closing can go back.
  const pushedRef = useRef(false)

  const section = sections.find((s) => s.id === route)
  const hue = section?.hue ?? 'neutral'

  useEffect(() => {
    const onHash = () => setLocation(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // A new page closes every leaf, returns to the top and moves focus to the page heading.
  useEffect(() => {
    setStack([])
    pushedRef.current = false
    if (firstRoute.current) { firstRoute.current = false; return }
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [route])

  // Opening a card adds its leaf to the address ("#/experience/ripik"), as a new history entry,
  // so the browser or phone Back button closes the leaf. The address change opens it below.
  const openAt = useCallback((depth) => (record, event) => {
    openerRef.current = event.currentTarget
    pushedRef.current = true
    window.location.hash = `#/${route}/${record.id}`
  }, [route])

  // Closes the leaves at `depth` and above: they slide back into the band, then unmount.
  // Focus returns to the control that opened the lowest closed leaf.
  const animateClose = useCallback((depth) => {
    const s = stackRef.current
    if (depth >= s.length || s[depth].motion === 'slide-out') return
    const opener = s[depth].opener
    // Back to the opener; if it is gone, to the title of the leaf that is now on top.
    const refocus = () => requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      else document.querySelector('[data-leaf-top] .leaf-title')?.focus({ preventScroll: true })
    })
    setStack((cur) => cur.map((e, i) => (i >= depth ? { ...e, motion: 'slide-out' } : e)))
    setTimeout(() => {
      setStack((cur) => cur.slice(0, depth))
      refocus()
    }, prefersReducedMotion() ? FADE_OUT_MS : SLIDE_OUT_MS)
  }, [])

  // The address decides which leaf is open: a leaf id slides its record's leaf out; no leaf id
  // slides any open leaf back. Back, Forward, a shared link and a reload all go through here.
  useEffect(() => {
    const record = leafId ? section?.records?.find((r) => r.id === leafId) : null
    const top = stackRef.current[0]
    if (record) {
      if (top?.record.id === record.id && top.motion !== 'slide-out') return
      setStack([{ key: nextKey++, record, motion: 'slide-in', opener: openerRef.current }])
      openerRef.current = null
    } else if (top) {
      pushedRef.current = false
      animateClose(0)
    }
  }, [leafId, section, animateClose])

  // Close, Esc, a click outside or the section crumb: step back off the leaf's history entry when
  // this tab added it, otherwise (a shared link or reload) drop the leaf id from the address.
  const closeFrom = useCallback(() => {
    if (!leafId) return
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, '', `#/${route}`)
      setLocation({ route, leafId: null })
    }
  }, [leafId, route])

  const leavesOpen = stack.length > 0
  // The whole stack is on its way back into the band: the page un-dims alongside it.
  const leavesClosing = leavesOpen && stack[0].motion === 'slide-out'

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
        <main id="main" ref={pageRef} className={`page${leavesOpen && !leavesClosing ? ' is-under' : ''}`}>
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
        <div className={`leaf-layer${stack[0].motion ? ` ${stack[0].motion}` : ''}`}>
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
