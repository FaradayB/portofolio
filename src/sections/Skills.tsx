import { cv } from "../data/cv";
import SkillBar from "../components/SkillBar";

export default function Skills() {
  return (
    <>
      {cv.skillGroups.map((g) => (
        <div key={g.category}>
          <div className="skill-group-head">{g.category}</div>
          {g.skills.map((s) => (
            <SkillBar key={s.name} name={s.name} pct={s.pct} color={g.color} />
          ))}
        </div>
      ))}
    </>
  );
}
