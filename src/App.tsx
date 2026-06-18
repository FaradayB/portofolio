import { useState } from "react";
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
  const index = sections.findIndex((s) => s.id === active);
  const meta = sections[index];

  return (
    <div className="shell">
      <Header />
      <div className="layout">
        <ArcWheelNav active={active} onSelect={setActive} />
        <main className="stage">
          <div
            className={"view" + (active === "companion" ? " view--fixed" : "")}
            key={active}
          >
            {active !== "profile" && (
              <div className="section-head">
                <div className="section-kicker">
                  {String(index + 1).padStart(2, "0")} — Section
                </div>
                <h1 className="section-title">{meta.label}</h1>
              </div>
            )}
            {views[active]}
          </div>
        </main>
      </div>
      <Footer hint={meta.hint} />
    </div>
  );
}
