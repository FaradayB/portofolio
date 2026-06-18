import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Education() {
  return (
    <div className="cards">
      <Card {...cv.education} />
    </div>
  );
}
