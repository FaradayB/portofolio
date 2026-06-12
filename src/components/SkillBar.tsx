interface Props { name: string; pct: number; color: string; }

export default function SkillBar({ name, pct, color }: Props) {
  return (
    <div className="skill-row">
      <span className="skill-label">{name}</span>
      <span className="skill-track">
        <span className="skill-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
    </div>
  );
}
