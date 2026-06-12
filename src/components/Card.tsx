import { Entry } from "../data/cv";

export default function Card({ title, org, date, body }: Entry) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-sub">{org} · {date}</div>
      <div className="card-body">{body}</div>
    </div>
  );
}
