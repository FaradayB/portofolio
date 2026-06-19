import { useEffect, useState, type CSSProperties } from "react";

type Energy = "orokin" | "arc" | "solar" | "void" | "stasis";

const ENERGIES: { id: Energy; label: string; swatch: string }[] = [
  { id: "orokin", label: "Orokin", swatch: "#e7c873" },
  { id: "arc", label: "Arc", swatch: "#3ba9ff" },
  { id: "solar", label: "Solar", swatch: "#ff9d3b" },
  { id: "void", label: "Void", swatch: "#9a6bff" },
  { id: "stasis", label: "Stasis", swatch: "#62d0ff" },
];

function initialEnergy(): Energy {
  if (typeof window === "undefined") return "orokin";
  const saved = window.localStorage?.getItem("energy");
  if (saved && ENERGIES.some((e) => e.id === saved)) return saved as Energy;
  return "orokin";
}

export default function EnergyPicker() {
  const [energy, setEnergy] = useState<Energy>(initialEnergy);

  useEffect(() => {
    document.documentElement.setAttribute("data-energy", energy);
    window.localStorage?.setItem("energy", energy);
  }, [energy]);

  return (
    <div className="energy-picker" role="radiogroup" aria-label="Energy color">
      {ENERGIES.map((e) => (
        <button
          key={e.id}
          type="button"
          className={"energy-swatch" + (energy === e.id ? " is-active" : "")}
          style={{ ["--swatch" as string]: e.swatch } as CSSProperties}
          role="radio"
          aria-checked={energy === e.id}
          aria-label={e.label}
          title={e.label}
          onClick={() => setEnergy(e.id)}
        />
      ))}
    </div>
  );
}
