
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Line as KonvaLine } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

import { Grid as GridComponent } from '../grid';

import { TableInstance, Zone, Guide, DrawingWallState } from './types';
import { CanvasItem } from './canvas-item';
import { useZoneColors } from './use-zone-colors';
import { snapToGrid, getLineGuideStops, getGuides } from './snapping-utils';

interface ZoneLayoutProps {
  currentZone: Zone | null;
  tables: TableInstance[];
  guides: Guide[];
  selectedId: string | null;
  drawingWall: DrawingWallState | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: any, params: { x: number, y: number, scale: number }) => void;
  onSelect: (id: string | null) => void;
  onDragMove: (e: any, table: TableInstance) => void;
  onDragEnd: (e: any, table: TableInstance) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onUpdateTables: (tables: TableInstance[]) => void;
  setDrawingWall: (val: any) => void;
  stageParams: { scale: number, x: number, y: number, setScale: any, setPosition: any, setStageDimensions: any, stageDimensions: any };
}

const DEFAULT_ZONE_WIDTH = 1000;
const DEFAULT_ZONE_HEIGHT = 800;

export const ZoneLayout: React.FC<ZoneLayoutProps> = ({
  currentZone,
  tables,
  guides,
  selectedId,
  drawingWall,
  isSidebarOpen,
  onToggleSidebar,
  onDrop,
  onSelect,
  onDragMove,
  onDragEnd,
  onDelete,
  onRotate,
  onUpdateTables,
  setDrawingWall,
  stageParams
}) => {
  const colors = useZoneColors();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [localGuides, setLocalGuides] = useState<Guide[]>([]);

  const { scale, setScale, x: positionX, y: positionY, setPosition, setStageDimensions, stageDimensions } = stageParams;

  // -- Resize Observer --
  const observerRef = useRef<ResizeObserver | null>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      containerRef.current = node;
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setStageDimensions({ width, height });
          }
        }
      });
      resizeObserver.observe(node);
      observerRef.current = resizeObserver;
    }
  }, [setStageDimensions]);

  // -- Panning Logic --
  const isPanning = useRef(false);
  const lastPointerPosition = useRef<{ x: number, y: number } | null>(null);

  const handleStageMouseDown = (e: any) => {
    // 0. Finalize Wall Drawing
    if (drawingWall) {
      const { startX, startY, currentX, currentY, originalId } = drawingWall;
      const dX = Math.abs(currentX - startX);
      const dY = Math.abs(currentY - startY);

      const isHorizontal = dX >= dY;
      const thickness = 10;
      const length = Math.max(isHorizontal ? dX : dY, 20);

      const centerX = isHorizontal ? (startX + currentX) / 2 : startX;
      const centerY = isHorizontal ? startY : (startY + currentY) / 2;

      const geometry = {
        width: isHorizontal ? length : thickness,
        height: isHorizontal ? thickness : length,
        x: centerX,
        y: centerY,
      };

      if (originalId) {
        // Update existing wall
        onUpdateTables(tables.map(t => t.uniqueId === originalId ? { ...t, ...geometry } : t));
      } else {
        // Create new wall
        const newWall: TableInstance = {
          id: 'wall-custom',
          type: 'wall',
          label: 'Muro',
          seats: 0,
          uniqueId: uuidv4(),
          zone_id: currentZone!.id,
          rotation: 0,
          ...geometry
        };
        onUpdateTables([...tables, newWall]);
      }

      setDrawingWall(null);
      setLocalGuides([]); // Clear guides
      return;
    }

    const stage = e.target.getStage();
    let node = e.target;
    let clickedDraggable = false;

    while (node && node.parent && node.className !== 'Layer') {
      if (node.attrs.draggable) {
        clickedDraggable = true;
        break;
      }
      node = node.parent;
    }

    if (clickedDraggable) return;

    isPanning.current = true;
    lastPointerPosition.current = stage.getPointerPosition();
    onSelect(null);
  };

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (drawingWall && pos) {
      const localX = (pos.x - positionX) / scale;
      const localY = (pos.y - positionY) / scale;

      // Guide Calculation
      const zoneW = currentZone?.width || DEFAULT_ZONE_WIDTH;
      const zoneH = currentZone?.height || DEFAULT_ZONE_HEIGHT;
      // Skip nothing when drawing fresh, but if we were extending maybe skip original?
      // Actually we want to align to everything else.
      const guideStops = getLineGuideStops(tables, drawingWall.originalId || '', zoneW, zoneH);

      // Current "Item Bounds" is just the point we are dragging
      // We create a pseudo-bound of 0x0 size at localX, localY
      const itemBounds = {
        vertical: [
          { guide: localX, offset: 0, snap: 'center' },
        ],
        horizontal: [
          { guide: localY, offset: 0, snap: 'center' },
        ],
      };

      const newGuides = getGuides(guideStops, itemBounds);
      let snappedX = localX;
      let snappedY = localY;

      if (newGuides.length > 0) {
        setLocalGuides(newGuides);
        newGuides.forEach((guide) => {
          if (guide.orientation === 'V') {
            snappedX = guide.lineGuide - guide.offset;
          } else {
            snappedY = guide.lineGuide - guide.offset;
          }
        });
      } else {
        setLocalGuides([]);
        snappedX = snapToGrid(localX);
        snappedY = snapToGrid(localY);
      }

      setDrawingWall((prev: any) => prev ? ({ ...prev, currentX: snappedX, currentY: snappedY }) : null);
      return;
    }

    if (!isPanning.current) return;

    if (pos && lastPointerPosition.current) {
      const dx = pos.x - lastPointerPosition.current.x;
      const dy = pos.y - lastPointerPosition.current.y;
      setPosition((prev: any) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPointerPosition.current = pos;
    }
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = scale;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - positionX) / oldScale,
      y: (pointer.y - positionY) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.2, Math.min(newScale, 3));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setPosition(newPos);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (stageRef.current) {
      onDrop(e, stageRef.current.getStage(), { x: positionX, y: positionY, scale });
    }
  };

  // Wall Extension Logic
  const handleWallExtendStart = (e: any, table: TableInstance, side: 'start' | 'end') => {
    // Calculate start point based on side
    const isHorizontal = table.width! > table.height!;
    const halfW = table.width! / 2;
    const halfH = table.height! / 2;

    let startX, startY;

    if (side === 'start') {
      startX = table.x + (isHorizontal ? -halfW : 0);
      startY = table.y + (isHorizontal ? 0 : -halfH);
    } else {
      startX = table.x + (isHorizontal ? halfW : 0);
      startY = table.y + (isHorizontal ? 0 : halfH);
    }

    setDrawingWall({ startX, startY, currentX: startX, currentY: startY });
    onSelect(null); // Deselect to hide controls
  }

  // Render Helpers
  const renderGuides = () => {
    const allGuides = [...guides, ...localGuides];
    return allGuides.map((guide, i) => {
      if (guide.orientation === 'V') {
        return (
          <KonvaLine
            key={`guide-${i}`}
            points={[guide.lineGuide, 0, guide.lineGuide, currentZone?.height || DEFAULT_ZONE_HEIGHT]}
            stroke="red" strokeWidth={1} dash={[4, 6]}
          />
        );
      } else {
        return (
          <KonvaLine
            key={`guide-${i}`}
            points={[0, guide.lineGuide, currentZone?.width || DEFAULT_ZONE_WIDTH, guide.lineGuide]}
            stroke="red" strokeWidth={1} dash={[4, 6]}
          />
        );
      }
    });
  }

  return (
    <div
      ref={setContainerRef}
      className="relative bg-[#fdf0d2] dark:bg-[#232119] w-full h-full shadow-inner overflow-hidden cursor-crosshair"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Button variant="outline" size="icon" className="bg-card! h-8 w-8 absolute top-2 right-2 z-20" onClick={onToggleSidebar}>
        <Menu className="w-4 h-4" />
      </Button>

      {stageDimensions.width > 0 && stageDimensions.height > 0 && (
        <Stage
          ref={stageRef}
          width={stageDimensions.width}
          height={stageDimensions.height}
          x={positionX} y={positionY}
          scaleX={scale} scaleY={scale}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
          onWheel={handleWheel}
        >
          <Layer>
            {/* Backgrounds */}
            <Group>
              <Rect
                x={-2} y={-2}
                width={(currentZone?.width || DEFAULT_ZONE_WIDTH) + 4}
                height={(currentZone?.height || DEFAULT_ZONE_HEIGHT) + 4}
                stroke={colors.gridColor} strokeWidth={1}
                fill={colors.stageBg === '#18181b' ? '#000' : '#fff'} // Simplified dark/light check for shadow
                shadowColor="black" shadowBlur={20} shadowOpacity={0.1}
              />
              <Rect
                width={currentZone?.width || DEFAULT_ZONE_WIDTH}
                height={currentZone?.height || DEFAULT_ZONE_HEIGHT}
                fill={colors.paperBg}
              />
              <GridComponent
                width={currentZone?.width || DEFAULT_ZONE_WIDTH}
                height={currentZone?.height || DEFAULT_ZONE_HEIGHT}
                gridSize={20}
                stroke={colors.gridColor}
              />

              {renderGuides()}

              {/* Drawing Wall Ghost */}

              {[...tables].sort((a, b) => {
                // Priority: Wall (0) < Others (1) < Door (2)
                const getPriority = (type: string) => {
                  if (type === 'wall') return 0;
                  if (type === 'door') return 2;
                  return 1;
                };
                return getPriority(a.type) - getPriority(b.type);
              }).filter(t => t.uniqueId !== drawingWall?.originalId).map((table) => (
                <CanvasItem
                  key={table.uniqueId}
                  table={table}
                  isSelected={selectedId === table.uniqueId}
                  colors={colors}
                  onSelect={onSelect}
                  onDragStart={() => { }} // We might not need this if we don't track drag start specifically for logic
                  onDragMove={onDragMove}
                  onDragEnd={onDragEnd}
                  onDelete={onDelete}
                  onRotate={onRotate}
                  onWallExtendStart={handleWallExtendStart}
                />
              ))}

              {/* Drawing Wall Ghost */}
              {drawingWall && (() => {
                const { startX, startY, currentX, currentY } = drawingWall;
                const dX = Math.abs(currentX - startX);
                const dY = Math.abs(currentY - startY);
                const isHorizontal = dX >= dY;
                const thickness = 10;
                const length = Math.max(isHorizontal ? dX : dY, 20);

                const centerX = isHorizontal ? (startX + currentX) / 2 : startX;
                const centerY = isHorizontal ? startY : (startY + currentY) / 2;
                const width = isHorizontal ? length : thickness;
                const height = isHorizontal ? thickness : length;

                return (
                  <Rect
                    x={centerX - width / 2}
                    y={centerY - height / 2}
                    width={width} height={height}
                    fill={colors.wallFill} opacity={0.5}
                    stroke={colors.selectedStroke} strokeWidth={1} dash={[5, 5]}
                  />
                );
              })()}
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
};
