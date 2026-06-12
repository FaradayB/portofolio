import { sections, SectionId } from "../data/sections";

interface Props {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <nav className="sidebar" aria-label="Sections">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={"navbtn" + (s.id === active ? " active" : "")}
          aria-pressed={s.id === active}
          onClick={() => onSelect(s.id)}
        >
          <span className="badge"><i className={"ti " + s.icon} /></span>
          <span className="label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
