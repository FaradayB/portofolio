interface Props { name: string; pct: number; }

export default function SkillBar({ name, pct }: Props) {
  return (
    <div className="skill-row">
      <span className="skill-label">{name}</span>
      <span className="skill-track">
        <span className="skill-fill" style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </span>
    </div>
  );
}
