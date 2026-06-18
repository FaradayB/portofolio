import { cv } from "../data/cv";
import SkillBar from "../components/SkillBar";

export default function Skills() {
  return (
    <div>
      {cv.skillGroups.map((g) => (
        <div className="skill-group" key={g.category}>
          <div className="skill-group-head">{g.category}</div>
          {g.skills.map((s) => (
            <SkillBar key={s.name} name={s.name} pct={s.pct} />
          ))}
        </div>
      ))}
    </div>
  );
}
