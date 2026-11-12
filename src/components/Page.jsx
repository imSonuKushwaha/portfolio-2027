import { forwardRef } from 'react'
import { profile } from '../content.js'
import { hueVars } from '../hues.js'
import RecordList from './RecordList.jsx'

// The page for the current route: the Contents page, or one section.
// The forwarded ref lands on the page heading so navigation can move focus to it.
const Page = forwardRef(function Page({ route, sections, onOpen, selectedId }, headingRef) {
  if (route === 'contents') return <Contents sections={sections} headingRef={headingRef} />
  const section = sections.find((s) => s.id === route)
  const index = sections.indexOf(section) + 1
  return (
    <article className="page-body" key={section.id}>
      <header className="page-head">
        <p className="label">Chapter {index} · {section.label}</p>
        <h1 className="display" ref={headingRef} tabIndex={-1}>{section.heading}</h1>
        <p className="lede">{section.blurb}</p>
      </header>
      <SectionBody section={section} onOpen={onOpen} selectedId={selectedId} />
    </article>
  )
})

export default Page

function Contents({ sections, headingRef }) {
  return (
    <article className="page-body" key="contents">
      <header className="page-head">
        <p className="label">Reference manual · 2027 edition</p>
        <h1 className="display" ref={headingRef} tabIndex={-1}>Contents</h1>
        <p className="identity data">
          <span>{profile.role}</span>
          <span>{profile.location}</span>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.resume} target="_blank" rel="noreferrer">Resume ↗</a>
        </p>
      </header>
      <nav className="swatches" aria-label="Chapters">
        {sections.map((s, i) => (
          <a key={s.id} className="swatch" href={`#/${s.id}`} style={hueVars(s.hue)}>
            <span className="label">Chapter {i + 1}</span>
            <h2>{s.label}</h2>
            <p>{s.blurb}</p>
          </a>
        ))}
      </nav>
      <NameMark />
    </article>
  )
}

function SectionBody({ section, onOpen, selectedId }) {
  switch (section.kind) {
    case 'prose':
      return (
        <div className="prose">
          {section.body.map((p) => <p key={p}>{p}</p>)}
          {section.facts && <Facts facts={section.facts} />}
          {section.showContact && <Contact />}
        </div>
      )
    case 'records':
      return <RecordList records={section.records} onOpen={onOpen} selectedId={selectedId} />
    case 'entries':
      return (
        <ul className="cards">
          {section.entries.map((e) => (
            <li key={e.title} className="card is-static">
              <span className="card-title">{e.title}</span>
              {e.score && <span className="card-score data">{e.score}</span>}
              <span className="card-meta data">{e.meta}</span>
              {e.detail && <span className="card-sum">{e.detail}</span>}
            </li>
          ))}
        </ul>
      )
    case 'groups':
      return (
        <div className="groups">
          {section.groups.map(([name, items]) => (
            <section className="group" key={name}>
              <h2 className="label">{name}</h2>
              <ul className="chips">{items.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          ))}
        </div>
      )
    default:
      return null
  }
}

// Email, profile links and location under a "Contact" label.
function Contact() {
  return (
    <section className="contact" aria-labelledby="contact-h">
      <h2 id="contact-h" className="label">Contact</h2>
      <dl className="facts">
        <div><dt className="label">Email</dt><dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd></div>
        {profile.links.map((l) => (
          <div key={l.href}>
            <dt className="label">{l.label}</dt>
            <dd><a href={l.href} target="_blank" rel="noreferrer">{new URL(l.href).pathname.replace(/\/$/, '').slice(1)} ↗</a></dd>
          </div>
        ))}
        <div><dt className="label">Location</dt><dd>{profile.location}</dd></div>
        <div><dt className="label">Resume</dt><dd><a href={profile.resume} target="_blank" rel="noreferrer">View PDF ↗</a></dd></div>
      </dl>
    </section>
  )
}

// The name in large condensed type. Its ink outline draws in and fills, then reverses, on a
// continuous loop; under reduced motion it is drawn filled and still. The viewBox width fits
// "SONU" exactly at this font size, so CSS alone places it (right on desktop, centred on phones).
function NameMark() {
  return (
    <div className="namemark" aria-hidden="true">
      <svg viewBox="0 0 258 100">
        <text x="0" y="88">{profile.mark}</text>
      </svg>
    </div>
  )
}

function Facts({ facts }) {
  return (
    <dl className="facts">
      {facts.map(([k, v]) => (
        <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  )
}
