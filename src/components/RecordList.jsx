// Records as cards: title, mono kicker and serif summary. A card opens its record as a leaf.
// `onOpen(record, event)` receives the click event (event.detail > 0 means a pointer).
// `selectedId` marks the open record's card with the punched hole.
export default function RecordList({ records, onOpen, selectedId }) {
  return (
    <ul className="cards">
      {records.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            className="card"
            aria-haspopup="dialog"
            aria-pressed={r.id === selectedId}
            onClick={(e) => onOpen(r, e)}
          >
            <span className="card-title">{r.title}</span>
            <span className="card-open label" aria-hidden="true">Open →</span>
            {r.meta && <span className="card-meta data">{r.meta}</span>}
            {r.summary && <span className="card-sum">{r.summary}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
