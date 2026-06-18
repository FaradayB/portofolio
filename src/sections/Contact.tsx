import { cv } from "../data/cv";
import Icon from "../components/Icon";

export default function Contact() {
  return (
    <div className="contact">
      {cv.contact.map((c) => {
        const inner = (
          <>
            <span className="contact-ico"><Icon name={c.icon} size={20} /></span>
            <span className="contact-label">{c.label}</span>
            <span className="contact-value">{c.value}</span>
          </>
        );
        return c.href ? (
          <a className="contact-item" key={c.label} href={c.href} target="_blank" rel="noopener">
            {inner}
          </a>
        ) : (
          <div className="contact-item" key={c.label}>{inner}</div>
        );
      })}
    </div>
  );
}
