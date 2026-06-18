import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Research() {
  return (
    <div className="cards">
      {cv.research.map((e) => <Card key={e.title} {...e} />)}
    </div>
  );
}
