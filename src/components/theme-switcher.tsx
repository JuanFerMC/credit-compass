import { Eye, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "colorblind";
const themes: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "colorblind", label: "Daltonismo", Icon: Eye },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("veridica-theme");
    const next = saved === "dark" || saved === "colorblind" ? saved : "light";
    setTheme(next);
    document.documentElement.dataset["theme"] = next;
  }, []);

  function updateTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset["theme"] = next;
    window.localStorage.setItem("veridica-theme", next);
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="Apariencia">
      {themes.map(({ value, label, Icon }) => (
        <Button key={value} type="button" size="icon" variant={theme === value ? "primary" : "ghost"} className="size-8 rounded-md" aria-pressed={theme === value} aria-label={`Usar modo ${label.toLowerCase()}`} title={label} onClick={() => updateTheme(value)}>
          <Icon aria-hidden="true" className="size-4" />
        </Button>
      ))}
    </div>
  );
}