import { cv } from "../data/cv";

export default function Contact() {
  return (
    <div className="contact">
      {cv.contact.map((c, i) => (
        <div className="contact-item" key={c.label}>
          {i > 0 && <span className="contact-div">◆</span>}
          <i className={"ti " + c.icon} />
          <span className="contact-label">{c.label}</span>
          {c.href
            ? <a className="contact-value" href={c.href} target="_blank" rel="noopener">{c.value}</a>
            : <span className="contact-value">{c.value}</span>}
        </div>
      ))}
    </div>
  );
}
