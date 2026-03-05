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
    stageBg: isDark ? "#18181b" : "#f4f4f5", // Zinc-900 / Zinc-100
    paperBg: isDark ? "#171511" : "#ffffff", // Dark bg / White
    gridColor: isDark ? "#27272a" : "#e4e4e7", // Zinc-800 / Zinc-200

    // Tables & Counters (Theme: Dark Orange / Green accents as seen in image)
    // The user requested dark orange as dominant. We'll use orange/amber shades.
    // In the image, tables are a light green with dark green outline. Let's make it orange since the user explicitly requested "dark orange" dominant color.
    tableFill: isDark ? "rgba(234, 88, 12, 0.1)" : "#ffedd5", // Orange-100
    tableStroke: isDark ? "#ea580c" : "#ea580c", // Orange-600

    // Counter
    counterFill: isDark ? "rgba(234, 88, 12, 0.15)" : "#fed7aa", // Orange-200
    counterStroke: isDark ? "#ea580c" : "#ea580c", // Orange-600

    // Controls
    selectedFill: isDark ? "rgba(249, 115, 22, 0.2)" : "#fdba74", // Orange-300
    selectedStroke: isDark ? "#f97316" : "#f97316", // Orange-500
    text: isDark ? "#ffffff" : "#ea580c",

    // Deco
    wallFill: isDark ? "#3f3f46" : "#71717a",
    wallStroke: isDark ? "#27272a" : "#52525b",

    columnFill: isDark ? "rgba(234, 88, 12, 0.2)" : "#71717a",
    columnStroke: isDark ? "#c2410c" : "#52525b",

    plantFill: isDark ? "#166534" : "#bbf7d0",
    plantStroke: isDark ? "#14532d" : "#86efac",

    // New
    doorFill: isDark ? "#52525b" : "#a1a1aa",
    doorStroke: isDark ? "#27272a" : "#71717a",

    // Booth
    boothFill: isDark ? "rgba(234, 88, 12, 0.1)" : "#ffedd5",
    boothStroke: isDark ? "#ea580c" : "#ea580c",

    // Cashier
    cashierFill: isDark ? "#7c2d12" : "#fdba74",
    cashierStroke: isDark ? "#c2410c" : "#f97316",

    restroomFill: isDark ? "#1e3a8a" : "#bfdbfe",
    restroomStroke: isDark ? "#1d4ed8" : "#3b82f6",

    // Container
    containerFill: isDark
      ? "rgba(234, 88, 12, 0.05)"
      : "rgba(234, 88, 12, 0.03)", // Subtle orange tint
    containerStroke: isDark ? "#ea580c" : "#fdba74", // Orange-600 / Orange-300
    containerText: isDark ? "#ea580c" : "#ea580c",
  };
}
