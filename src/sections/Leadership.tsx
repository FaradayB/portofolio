import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Leadership() {
  return <>{cv.leadership.map((e) => <Card key={e.title} {...e} />)}</>;
}
