import { SKILL_ICONS } from '../skillIcons.js'

// A wrapping row of compact chips, one per name: the brand icon in brand colour, or a punched
// hole in the current section hue when the name has no logo, followed by the name.
// Used for the Skills page groups and for the tools listed in a leaf.
export default function SkillChips({ names, label }) {
  return (
    <ul className="skills" aria-label={label}>
      {names.map((name) => {
        const icon = SKILL_ICONS[name]
        return (
          <li className="skill" key={name}>
            {icon
              ? <svg className="skill-icon" viewBox="0 0 24 24" aria-hidden="true" fill={`#${icon.hex}`}><path d={icon.path} /></svg>
              : <span className="skill-hole" aria-hidden="true" />}
            <span>{name}</span>
          </li>
        )
      })}
    </ul>
  )
}
