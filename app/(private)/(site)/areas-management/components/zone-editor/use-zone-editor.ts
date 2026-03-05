import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useLocationStore } from "@/store/location-store";
import { getFloorPlan, saveFloorPlan } from "@/app/actions/floor-plan";
import { TablePreset } from "../table-presets";
import { TableInstance, Zone, Guide, DrawingWallState } from "./types";
import {
  getLineGuideStops,
  getObjectSnappingEdges,
  getGuides,
  snapToGrid,
} from "./snapping-utils";

const DEFAULT_ZONE_WIDTH = 1000;
const DEFAULT_ZONE_HEIGHT = 800;

import { useHistory } from "@/hooks/use-history";

export function useZoneEditor(
  initialZoneId?: string,
  onSaveSuccess?: () => void,
) {
  const { selectedLocationId } = useLocationStore();
  const router = useRouter();

  // -- State --
  const {
    state: tables,
    set: setTables,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory,
  } = useHistory<TableInstance[]>([]);

  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null);

  // -- Refs --
  const dragItemRef = useRef<TablePreset | null>(null);

  // -- Load Data --
  useEffect(() => {
    if (!selectedLocationId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getFloorPlan(selectedLocationId);
        let zone = initialZoneId
          ? data.zones.find((z: any) => z.id === initialZoneId)
          : data.zones[0];

        if (!zone) {
          zone = {
            id: uuidv4(),
            name: "Nuova Sala",
            width: DEFAULT_ZONE_WIDTH,
            height: DEFAULT_ZONE_HEIGHT,
          };
        } else {
          if (!zone.width || zone.width < 100) zone.width = DEFAULT_ZONE_WIDTH;
          if (!zone.height || zone.height < 100)
            zone.height = DEFAULT_ZONE_HEIGHT;
        }

        setCurrentZone(zone);

        const zoneTables = data.tables.filter(
          (t: any) => t.zone_id === zone.id,
        );
        const loadedTables = zoneTables.map((t: any) => ({
          id: t.id,
          uniqueId: t.id,
          type: t.shape,
          category: "Tavoli" as const,
          label: String(t.table_number ?? ""),
          seats: t.seats ?? 0,
          x: t.position_x,
          y: t.position_y,
          rotation: t.rotation,
          width: t.width,
          height: t.height,
          radius:
            t.shape === "circle" || t.shape === "plant"
              ? t.width
                ? t.width / 2
                : 0
              : 0,
          zone_id: t.zone_id,
          min_capacity: t.min_capacity,
          max_capacity: t.max_capacity,
        }));
        setTables(loadedTables);
        // We need to clear history after initial load so "Undo" isn't active immediately
        // However, useHistory's set updates the present state and adds to history if not initial.
        // We need a way to reset history. Let's use the new clear function.
        clearHistory(loadedTables);
      } catch (error) {
        console.error("Failed to load floor plan:", error);
        toast.error("Errore nel caricamento della sala");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedLocationId, initialZoneId]);

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))
        return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      }

      // Delete table with Backspace or Delete key
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        deleteTable(selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo, selectedId, tables]);

  // -- Save Data --
  const handleSave = async () => {
    if (!selectedLocationId || !currentZone) return;
    setLoading(true);
    try {
      const tablesToSave = tables.map((t) => ({
        ...t,
        zone_id: currentZone.id,
      }));

      const zoneToSave = {
        ...currentZone,
        width: Number(currentZone.width),
        height: Number(currentZone.height),
      };

      await saveFloorPlan(selectedLocationId, [zoneToSave], tablesToSave);
      setCurrentZone(zoneToSave);
      toast.success("Configurazione salvata con successo");
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  };

  // -- Event Handlers --

  const handleDragMove = (e: any, table: TableInstance) => {
    const node = e.target;

    const zoneW = currentZone?.width || DEFAULT_ZONE_WIDTH;
    const zoneH = currentZone?.height || DEFAULT_ZONE_HEIGHT;

    const guideStops = getLineGuideStops(tables, table.uniqueId, zoneW, zoneH);
    const itemBounds = getObjectSnappingEdges(node, table);
    const newGuides = getGuides(guideStops, itemBounds);

    if (newGuides.length > 0) {
      setGuides(newGuides);
      newGuides.forEach((guide) => {
        if (guide.orientation === "V") {
          node.x(guide.lineGuide - guide.offset);
        } else {
          node.y(guide.lineGuide - guide.offset);
        }
      });
    } else {
      setGuides([]);
    }
  };

  const handleDragEnd = (e: any, table: TableInstance) => {
    const node = e.target;
    setGuides([]);

    const zoneW = currentZone?.width || DEFAULT_ZONE_WIDTH;
    const zoneH = currentZone?.height || DEFAULT_ZONE_HEIGHT;
    const guideStops = getLineGuideStops(tables, table.uniqueId, zoneW, zoneH);
    const itemBounds = getObjectSnappingEdges(node, table);
    const currentGuides = getGuides(guideStops, itemBounds);

    let finalX = node.x();
    let finalY = node.y();

    if (!currentGuides.some((g) => g.orientation === "V")) {
      finalX = snapToGrid(finalX);
    }
    if (!currentGuides.some((g) => g.orientation === "H")) {
      finalY = snapToGrid(finalY);
    }

    node.x(finalX);
    node.y(finalY);

    setTables((prev) =>
      prev.map((t) =>
        t.uniqueId === table.uniqueId ? { ...t, x: finalX, y: finalY } : t,
      ),
    );
  };

  const handleSidebarDragStart = (preset: TablePreset) => {
    dragItemRef.current = preset;
  };

  const handleCanvasDrop = (
    e: React.DragEvent<HTMLDivElement>,
    stage: any,
    stageParams: { x: number; y: number; scale: number },
  ) => {
    e.preventDefault();
    if (!dragItemRef.current || !currentZone) return;

    stage.setPointersPositions(e);
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const localX = (pointer.x - stageParams.x) / stageParams.scale;
    const localY = (pointer.y - stageParams.y) / stageParams.scale;

    const snappedX = snapToGrid(localX);
    const snappedY = snapToGrid(localY);

    if (dragItemRef.current.type === "wall") {
      setDrawingWall({
        startX: snappedX,
        startY: snappedY,
        currentX: snappedX,
        currentY: snappedY,
      });
      dragItemRef.current = null;
      return;
    }

    // Auto-naming logic for tables
    let label = dragItemRef.current.label;
    if (dragItemRef.current.category === "Tavoli") {
      const tableNumbers = tables
        .filter((t) => t.category === "Tavoli" && /^Tavolo \d+$/i.test(t.label))
        .map((t) => {
          const match = t.label.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });

      const nextNumber =
        tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1;
      label = `Tavolo ${nextNumber}`;
    }

    const newTable: TableInstance = {
      ...dragItemRef.current,
      uniqueId: uuidv4(),
      x: snappedX,
      y: snappedY,
      label,
      rotation: 0,
      zone_id: currentZone.id,
    };

    setTables([...tables, newTable]);
    dragItemRef.current = null;
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.uniqueId !== id));
    setSelectedId(null);
  };

  const rotateTable = (id: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.uniqueId !== id) return t;
        return { ...t, rotation: (t.rotation + 90) % 360 };
      }),
    );
  };

  return {
    tables,
    setTables,
    currentZone,
    setCurrentZone,
    selectedId,
    setSelectedId,
    loading,
    guides,
    setGuides,
    drawingWall,
    setDrawingWall,
    handleSave,
    handleDragMove,
    handleDragEnd,
    handleSidebarDragStart,
    handleCanvasDrop,
    deleteTable,
    rotateTable,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
