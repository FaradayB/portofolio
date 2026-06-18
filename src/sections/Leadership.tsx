import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Leadership() {
  return (
    <div className="cards">
      {cv.leadership.map((e) => <Card key={e.title} {...e} />)}
    </div>
  );
}
