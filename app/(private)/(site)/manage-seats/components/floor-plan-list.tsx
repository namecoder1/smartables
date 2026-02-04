"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Pencil, Trash2 } from "lucide-react";
import { Stage, Layer, Rect, Circle, Group } from 'react-konva';
import { useTheme } from "next-themes";
import { useLocationStore } from "@/store/location-store";
import { Location } from "@/types/general";

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  updated_at?: string;
}

interface FloorPlanListProps {
  zones: Zone[];
  tables: any[]; // Changed to accept tables
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  location: Location;
}

export function FloorPlanList({ zones, tables, onEdit, onDelete, location }: FloorPlanListProps) {
  const {  } = useLocationStore()
  console.log(tables)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {zones.map((zone) => {
        const zoneTables = tables.filter(t => t.zone_id === zone.id);
        return (
          <Card key={zone.id} className="group relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="h-4 w-4 text-muted-foreground" />
                    {zone.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {zone.width}x{zone.height}px
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">{zoneTables.length} tavoli</p>
                <p className="text-sm">{zone.updated_at}</p>
              </div>
              <div className="h-32 w-full rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative border">
                <ZonePreview zone={zone} tables={zoneTables} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => onEdit(zone)}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifica
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                size="sm"
                onClick={() => onDelete(zone)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function ZonePreview({ zone, tables }: { zone: Zone, tables: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { theme, systemTheme } = useTheme();

  // Handle Hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Logic similar to ZoneEditor auto-fit
    // But we want to fit the whole zone into the small preview box
    const zWidth = zone.width || 1000;
    const zHeight = zone.height || 800;

    // Add robust padding and scale down to fit "more than possible"
    const padding = 10;
    const availableW = dimensions.width - padding * 2;
    const availableH = dimensions.height - padding * 2;

    const scaleX = availableW / zWidth;
    const scaleY = availableH / zHeight;

    // Use the smaller scale and multiply by 0.9 to ensure it floats nicely
    const newScale = Math.min(scaleX, scaleY) * 0.9;

    setScale(newScale);

    const centerX = (dimensions.width - zWidth * newScale) / 2;
    const centerY = (dimensions.height - zHeight * newScale) / 2;

    setPosition({ x: centerX, y: centerY });

  }, [dimensions, zone.width, zone.height]);

  if (!mounted) return null;
  if (dimensions.width === 0 || dimensions.height === 0) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const colors = {
    // Backgrounds handled by parent div
    tableFill: isDark ? '#27272a' : '#e5e7eb',
    tableStroke: isDark ? '#52525b' : '#9ca3af',
    wallFill: isDark ? '#3f3f46' : '#71717a',
    wallStroke: isDark ? '#27272a' : '#52525b',
    columnFill: isDark ? '#52525b' : '#d4d4d8',
    columnStroke: isDark ? '#3f3f46' : '#a1a1aa',
    plantFill: isDark ? '#166534' : '#bbf7d0',
    plantStroke: isDark ? '#14532d' : '#86efac',
  };

  const zWidth = zone.width || 1000;
  const zHeight = zone.height || 800;

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        listening={false} // Disable interaction
      >
        <Layer>
          {/* Zone Background Paper */}
          <Rect
            width={zWidth}
            height={zHeight}
            fill={isDark ? '#000000' : '#ffffff'}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.1}
            stroke={isDark ? '#333' : '#ddd'}
            strokeWidth={1 / scale} // Keep visible but thin regardless of scale
          />

          {tables.map(table => {
            // Rendering Logic (Simplified)
            // Check preset/shape type
            // Note: DB property might be 'shape' but let's assume 'type' or use logic.
            // In `reservations-floor-plan`, we saw `table.shape`.
            // Let's assume consistent data structure.

            const shape = table.shape || 'rect';
            const width = table.width || 60;
            const height = table.height || 60;
            const radius = table.radius || width / 2;

            switch (shape) {
              case 'wall':
                return (
                  <Rect
                    key={table.id}
                    x={table.position_x} y={table.position_y}
                    width={width} height={height}
                    rotation={table.rotation}
                    fill={colors.wallFill}
                    stroke={colors.wallStroke}
                    strokeWidth={1}
                    cornerRadius={2}
                    offsetX={width / 2}
                    offsetY={height / 2}
                  />
                );
              case 'column':
                return (
                  <Rect
                    key={table.id}
                    x={table.position_x} y={table.position_y}
                    width={width} height={height}
                    rotation={table.rotation}
                    fill={colors.columnFill}
                    stroke={colors.columnStroke}
                    strokeWidth={1}
                    offsetX={width / 2}
                    offsetY={height / 2}
                  />
                );
              case 'plant':
                return (
                  <Circle
                    key={table.id}
                    x={table.position_x} y={table.position_y}
                    radius={width / 2}
                    fill={colors.plantFill}
                    stroke={colors.plantStroke}
                    strokeWidth={1}
                    opacity={0.8}
                  />
                );
              case 'circle':
                return (
                  <Circle
                    key={table.id}
                    x={table.position_x} y={table.position_y}
                    radius={width / 2}
                    fill={colors.tableFill}
                    stroke={colors.tableStroke}
                    strokeWidth={2}
                  />
                );
              default:
                return (
                  <Rect
                    key={table.id}
                    x={table.position_x} y={table.position_y}
                    width={width} height={height}
                    rotation={table.rotation}
                    fill={colors.tableFill}
                    stroke={colors.tableStroke}
                    strokeWidth={2}
                    cornerRadius={4}
                    offsetX={width / 2}
                    offsetY={height / 2}
                  />
                );
            }
          })}
        </Layer>
      </Stage>
    </div>
  );
}
