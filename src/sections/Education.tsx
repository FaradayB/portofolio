import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Education() {
  return <Card {...cv.education} />;
}
