import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
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
  const hint = sections.find((s) => s.id === active)!.hint;

  return (
    <>
      <Honeycomb />
      <div className="app">
        <Header />
        <div className="body">
          <Sidebar active={active} onSelect={setActive} />
          <main className="main">{views[active]}</main>
        </div>
        <Footer hint={hint} />
      </div>
    </>
  );
}

function Honeycomb() {
  return (
    <svg className="honeycomb" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hexA" width="18" height="20.8" patternUnits="userSpaceOnUse">
          <path d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z"
            fill="none" stroke="#2e3d4a" strokeWidth="0.8" />
        </pattern>
        <pattern id="hexB" width="18" height="20.8" patternUnits="userSpaceOnUse"
          patternTransform="translate(9 10.4)">
          <path d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z"
            fill="none" stroke="#2e3d4a" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexA)" />
      <rect width="100%" height="100%" fill="url(#hexB)" />
    </svg>
  );
}
