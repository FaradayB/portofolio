import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Experience() {
  return (
    <div className="cards">
      {cv.experience.map((e) => <Card key={e.title} {...e} />)}
    </div>
  );
}
