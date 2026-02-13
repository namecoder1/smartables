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
    paperBg: isDark ? "#171511" : "#fef9ed",
    gridColor: isDark ? "#1A1813" : "#ddd",
    // Tables & Counters (Brown: Light for Dark Mode, Dark for Light Mode)
    tableFill: isDark ? "#A1887F" : "#5D4037", // Light Brown / Dark Brown
    tableStroke: isDark ? "#8D6E63" : "#3E2723",

    // Counter (Same as tables)
    counterFill: isDark ? "#A1887F" : "#5D4037",
    counterStroke: isDark ? "#8D6E63" : "#3E2723",

    // Controls
    selectedFill: isDark ? "#1e3a8a" : "#bfdbfe",
    selectedStroke: isDark ? "#60a5fa" : "#3b82f6",
    text: "#ffffff",

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

    // Booth (Greyer/Lighter than wall)
    boothFill: isDark ? "#52525b" : "#a1a1aa", // Zinc-600 / Zinc-400
    boothStroke: isDark ? "#3f3f46" : "#71717a",
  };
}
