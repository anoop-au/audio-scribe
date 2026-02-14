import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl transition-all duration-300 backdrop-blur-xl hover:scale-105 active:scale-95"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-accent" />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}
