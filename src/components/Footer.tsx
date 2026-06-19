interface Props { hint: string; }

export default function Footer({ hint }: Props) {
  return (
    <footer className="footer">
      <span className="hint">{hint}</span>
      <span className="footer-right">
        Faraday Barr Fatahillah.
      </span>
    </footer>
  );
}
