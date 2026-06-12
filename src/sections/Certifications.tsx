import { cv } from "../data/cv";

export default function Certifications() {
  return (
    <>
      {cv.certifications.map((c) => (
        <div className="card cert" key={c.title}>
          <div className="card-title">{c.title}</div>
          <div className="card-sub">{c.sub}</div>
        </div>
      ))}
    </>
  );
}
