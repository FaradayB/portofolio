interface Props { hint: string; }

export default function Footer({ hint }: Props) {
  return (
    <footer className="footer">
      <span className="hint">{hint}</span>
      <span className="footer-right">
        Telkom University · GPA 3.88 · Class of 2025
      </span>
    </footer>
  );
}
