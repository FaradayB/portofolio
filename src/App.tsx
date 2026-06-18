import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ArcWheelNav from "./components/ArcWheelNav";
import { sections, SectionId } from "./data/sections";
import Profile from "./sections/Profile";
import Education from "./sections/Education";
import Experience from "./sections/Experience";
import Records from "./sections/Records";
import Research from "./sections/Research";
import Leadership from "./sections/Leadership";
import Skills from "./sections/Skills";
import Certifications from "./sections/Certifications";
import Contact from "./sections/Contact";
import ChatPanel from "./chat/ChatPanel";

const views: Record<SectionId, JSX.Element> = {
  profile: <Profile />,
  education: <Education />,
  experience: <Experience />,
  records: <Records />,
  research: <Research />,
  leadership: <Leadership />,
  skills: <Skills />,
  certifications: <Certifications />,
  contact: <Contact />,
  companion: <ChatPanel />,
};

export default function App() {
  const [active, setActive] = useState<SectionId>("profile");
  const meta = sections.find((s) => s.id === active) ?? sections[0];

  // scroll-spy: whichever section crosses the viewport centre becomes active
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting);
        if (hit.length === 0) return;
        const top = hit.reduce((a, b) =>
          a.intersectionRatio >= b.intersectionRatio ? a : b
        );
        setActive(top.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // arc-wheel / nav target → scroll the page to that section
  const goTo = (id: SectionId, smooth: boolean) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });
  };

  return (
    <div className="shell">
      <Header />
      <div className="layout">
        <ArcWheelNav active={active} onSelect={goTo} />
        <main className="stage">
          {sections.map((s, i) => (
            <section id={s.id} key={s.id} className="view-section">
              {s.id !== "profile" && (
                <div className="section-head">
                  <div className="section-kicker">
                    {String(i + 1).padStart(2, "0")} — Section
                  </div>
                  <h1 className="section-title">{s.label}</h1>
                </div>
              )}
              {views[s.id]}
            </section>
          ))}
        </main>
      </div>
      <Footer hint={meta.hint} />
    </div>
  );
}
