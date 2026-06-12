import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Research() {
  return <>{cv.research.map((e) => <Card key={e.title} {...e} />)}</>;
}
