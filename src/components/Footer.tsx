interface Props { hint: string; }

export default function Footer({ hint }: Props) {
  return (
    <footer className="footer">
      <span className="hint"><i className="ti ti-shield" />{hint}</span>
      <span className="footer-right">
        Telkom University · GPA 3.88<br />Class of 2025
      </span>
    </footer>
  );
}
