import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useZoneColors() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = mounted && currentTheme === "dark";

  return {
    stageBg: isDark ? "#18181b" : "#f4f4f5",
    paperBg: isDark ? "#000000" : "#ffffff",
    gridColor: isDark ? "#333" : "#ddd",
    tableFill: isDark ? "#27272a" : "#e5e7eb",
    tableStroke: isDark ? "#52525b" : "#9ca3af",
    selectedFill: isDark ? "#1e3a8a" : "#bfdbfe",
    selectedStroke: isDark ? "#60a5fa" : "#3b82f6",
    text: isDark ? "#e4e4e7" : "#000000",
    // Deco
    wallFill: isDark ? "#3f3f46" : "#71717a",
    wallStroke: isDark ? "#27272a" : "#52525b",
    columnFill: isDark ? "#3f3f46" : "#71717a",
    columnStroke: isDark ? "#27272a" : "#52525b",
    plantFill: isDark ? "#166534" : "#bbf7d0",
    plantStroke: isDark ? "#14532d" : "#86efac",
    // New
    doorFill: isDark ? "#3f3f46" : "#71717a",
    doorStroke: isDark ? "#27272a" : "#52525b",
    counterFill: isDark ? "#27272a" : "#e5e7eb",
    counterStroke: isDark ? "#52525b" : "#9ca3af",
    boothFill: isDark ? "#3f3f46" : "#71717a",
    boothStroke: isDark ? "#27272a" : "#52525b",
  };
}
