import React from 'react';
import { Group, Rect, Circle, Text, Path, Arc } from 'react-konva';
import { TableInstance } from './types';


interface CanvasItemProps {
  table: TableInstance;
  isSelected: boolean;
  colors: any;
  onSelect: (id: string) => void;
  onDragStart: (e: any, table: TableInstance) => void;
  onDragMove: (e: any, table: TableInstance) => void;
  onDragEnd: (e: any, table: TableInstance) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onWallExtendStart?: (e: any, table: TableInstance, side: 'start' | 'end') => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = ({
  table,
  isSelected,
  colors,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDelete,
  onRotate,
  onWallExtendStart
}) => {
  const shadowBlur = isSelected ? 10 : 0;
  const shadowOpacity = 0.1;

  const handleDragStart = (e: any) => {
    e.cancelBubble = true;
    onDragStart(e, table);
  };
  const handleDragMove = (e: any) => onDragMove(e, table);
  const handleDragEnd = (e: any) => onDragEnd(e, table);
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    onSelect(table.uniqueId);
  };

  const renderChairs = () => {
    if (!table.seats || table.seats <= 0) return null;
    if (table.type !== 'rect' && table.type !== 'circle') return null;

    const chairRadius = 10;
    const chairs = [];
    const offset = chairRadius + 2;

    if (table.type === 'circle') {
      const tableRadius = table.radius || 35;
      const distance = tableRadius + offset;
      for (let i = 0; i < table.seats; i++) {
        const angle = (i * 2 * Math.PI) / table.seats;
        chairs.push(
          <Arc
            key={`c-${table.uniqueId}-${i}`}
            x={distance * Math.cos(angle)}
            y={distance * Math.sin(angle)}
            innerRadius={0}
            outerRadius={chairRadius}
            angle={180}
            rotation={(angle * 180) / Math.PI + 90}
            fill={colors.paperBg}
            stroke={isSelected ? colors.selectedStroke : colors.tableStroke}
            strokeWidth={1}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      }
    } else if (table.type === 'rect') {
      const w = table.width || 70;
      const h = table.height || 70;

      let topSeats = 0, bottomSeats = 0, leftSeats = 0, rightSeats = 0;
      let remaining = table.seats;

      if (w >= h) {
        topSeats = Math.ceil(remaining / 2);
        bottomSeats = remaining - topSeats;
        if (table.seats >= 6 && remaining >= 4) {
          leftSeats = 1; rightSeats = 1;
          remaining -= 2;
          topSeats = Math.ceil(remaining / 2);
          bottomSeats = remaining - topSeats;
        }
      } else {
        leftSeats = Math.ceil(remaining / 2);
        rightSeats = remaining - leftSeats;
        if (table.seats >= 6 && remaining >= 4) {
          topSeats = 1; bottomSeats = 1;
          remaining -= 2;
          leftSeats = Math.ceil(remaining / 2);
          rightSeats = remaining - leftSeats;
        }
      }

      const drawLineOfChairs = (count: number, side: 'top' | 'bottom' | 'left' | 'right') => {
        if (count === 0) return [];
        const lineChairs = [];
        for (let i = 0; i < count; i++) {
          let cx = 0, cy = 0, rot = 0;
          if (side === 'top' || side === 'bottom') {
            const spacing = w / (count + 1);
            cx = -w / 2 + spacing * (i + 1);
            cy = side === 'top' ? -h / 2 - offset : h / 2 + offset;
            rot = side === 'top' ? 180 : 0;
          } else {
            const spacing = h / (count + 1);
            cy = -h / 2 + spacing * (i + 1);
            cx = side === 'left' ? -w / 2 - offset : w / 2 + offset;
            rot = side === 'left' ? 270 : 90;
          }
          lineChairs.push(
            <Arc
              key={`c-${table.uniqueId}-${side}-${i}`}
              x={cx} y={cy}
              innerRadius={0}
              outerRadius={chairRadius}
              angle={180}
              rotation={rot}
              fill={colors.paperBg}
              stroke={isSelected ? colors.selectedStroke : colors.tableStroke}
              strokeWidth={1}
              listening={false}
              perfectDrawEnabled={false}
            />
          );
        }
        return lineChairs;
      };

      chairs.push(...drawLineOfChairs(topSeats, 'top'));
      chairs.push(...drawLineOfChairs(bottomSeats, 'bottom'));
      chairs.push(...drawLineOfChairs(leftSeats, 'left'));
      chairs.push(...drawLineOfChairs(rightSeats, 'right'));
    }

    return <Group listening={false}>{chairs}</Group>;
  };

  const renderTableBadges = () => {
    if (table.type !== 'rect' && table.type !== 'circle' && table.type !== 'counter') return null;

    const isCircle = table.type === 'circle';
    const w = isCircle ? (table.radius || 35) * 2 : (table.width || 70);
    const h = isCircle ? (table.radius || 35) * 2 : (table.height || 70);

    const shortLabel = String(table.label || '?').replace(/\D/g, '') || String(table.label || '?').substring(0, 2);
    const labelW = Math.max(shortLabel.length * 8 + 8, 20);
    const totalBadgesW = labelW + 4 + 32; // number badge + gap + capacity badge

    // Center both badges horizontally, position just above the element
    const startX = -totalBadgesW / 2;
    const badgeY = isCircle ? -(table.radius || 35) - 4 : -h / 2 + 4;

    return (
      <Group listening={false} perfectDrawEnabled={false}>
        {/* Table Number Badge */}
        <Rect
          x={startX} y={badgeY}
          width={labelW} height={16}
          fill="#ea580c"
          cornerRadius={8}
        />
        <Text
          text={shortLabel}
          x={startX} y={badgeY}
          width={labelW} height={16}
          fill="white"
          fontSize={10}
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          listening={false}
          perfectDrawEnabled={false}
        />

        {/* Capacity Badge */}
        <Rect
          x={startX + labelW + 4} y={badgeY}
          width={32} height={16}
          fill="white"
          stroke="#ea580c"
          strokeWidth={1}
          cornerRadius={8}
        />
        <Path
          x={startX + labelW + 4 + 3}
          y={badgeY + 3}
          data="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
          fill="#64748b"
          stroke="#64748b"
          strokeWidth={1.5}
          scaleX={0.4}
          scaleY={0.4}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Text
          text={String(table.seats || 0)}
          x={startX + labelW + 4 + 14} y={badgeY}
          width={16} height={16}
          fill="#64748b"
          fontSize={9}
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
    );
  };

  const renderShape = () => {
    switch (table.type) {
      case 'rect':
        return (
          <Rect
            width={table.width} height={table.height}
            fill={isSelected ? colors.selectedFill : colors.tableFill}
            stroke={isSelected ? colors.selectedStroke : colors.tableStroke}
            strokeWidth={2} cornerRadius={4}
            offsetX={table.width! / 2} offsetY={table.height! / 2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'door': // Broken line with wider gap
        return (
          <Group>
            {/* Left Piece */}
            <Rect
              width={table.width! * 0.2} height={table.height}
              fill={colors.wallFill}
              stroke={isSelected ? colors.selectedStroke : colors.wallStroke}
              strokeWidth={isSelected ? 2 : 1}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
            {/* Middle Piece (Gap/Opening) */}
            <Rect
              x={table.width! * 0.2}
              width={table.width! * 0.6} height={table.height}
              fill={colors.paperBg}
              strokeWidth={0}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
            {/* Right Piece */}
            <Rect
              x={table.width! * 0.8}
              width={table.width! * 0.2} height={table.height}
              fill={colors.wallFill}
              stroke={isSelected ? colors.selectedStroke : colors.wallStroke}
              strokeWidth={isSelected ? 2 : 1}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
          </Group>
        );
      case 'counter':
        return (
          <Rect
            width={table.width} height={table.height}
            fill={colors.counterFill}
            stroke={isSelected ? colors.selectedStroke : colors.counterStroke}
            strokeWidth={isSelected ? 2 : 2}
            cornerRadius={4}
            offsetX={table.width! / 2} offsetY={table.height! / 2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'booth':
        return (
          <Rect
            width={table.width} height={table.height}
            fill={colors.boothFill}
            stroke={isSelected ? colors.selectedStroke : colors.boothStroke}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={2}
            offsetX={table.width! / 2} offsetY={table.height! / 2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'wall':
        const isFence = table.id?.includes('fence');
        return (
          <Rect
            width={table.width} height={table.height}
            fill={isFence ? 'transparent' : colors.wallFill}
            stroke={isSelected ? colors.selectedStroke : colors.wallStroke}
            strokeWidth={isSelected ? 2 : 1.5}
            dash={isFence ? [10, 5] : undefined}
            cornerRadius={2}
            offsetX={table.width! / 2} offsetY={table.height! / 2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'curved-wall':
        // A curved wall based on an Arc.
        // table.width = inner radius, table.height = angle.
        // To draw a curved wall centered correctly:
        // By default Arc is drawn around (0,0). Our Group has width/height equal to radius * 2.
        const cRadius = table.width || 100;
        return (
          <Arc
            innerRadius={cRadius - (table.radius || 10) / 2}
            outerRadius={cRadius + (table.radius || 10) / 2}
            angle={table.height || 90}
            fill={colors.wallFill}
            stroke={isSelected ? colors.selectedStroke : colors.wallStroke}
            strokeWidth={isSelected ? 2 : 1}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          // An Arc is drawn starting at 0 angle (3 o'clock).
          // We want it to be centered relative to the (0,0) of the Group.
          // When angle is 90, the Arc sweeps from 0 to 90 degrees around origin.
          // The Group already handles dragging and rotating the table's (x,y).
          />
        );
      case 'column':
        if (table.radius) {
          return (
            <Circle
              radius={table.radius}
              fill={colors.columnFill}
              stroke={isSelected ? colors.selectedStroke : colors.columnStroke}
              strokeWidth={isSelected ? 2 : 1}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
            />
          );
        } else {
          return (
            <Rect
              width={table.width} height={table.height}
              fill={colors.columnFill}
              stroke={isSelected ? colors.selectedStroke : colors.columnStroke}
              strokeWidth={isSelected ? 2 : 1}
              offsetX={table.width! / 2} offsetY={table.height! / 2}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
            />
          );
        }
      case 'plant':
        return (
          <Group>
            <Circle
              radius={table.radius || 25}
              fill={colors.plantFill}
              stroke={isSelected ? colors.selectedStroke : colors.plantStroke}
              strokeWidth={isSelected ? 2 : 1}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
              opacity={0.8}
            />
            <Circle radius={(table.radius || 25) * 0.4} fill={colors.plantStroke} opacity={0.5} />
          </Group>
        );
      case 'text':
        return (
          <Text
            text={table.label}
            fontSize={20}
            fontStyle="bold"
            fill={colors.text}
            width={table.width}
            height={table.height}
            align="left"
            verticalAlign="middle"
            offsetX={table.width! / 2}
            offsetY={table.height! / 2}
          />
        );
      case 'cashier':
        return (
          <Group>
            <Rect
              width={table.width} height={table.height}
              fill={colors.cashierFill}
              stroke={isSelected ? colors.selectedStroke : colors.cashierStroke}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={4}
              offsetX={table.width! / 2} offsetY={table.height! / 2}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
            />
            {/* Cashier Icon / Text */}
            <Text
              text="$"
              fontSize={Math.min(table.width!, table.height!) * 0.6}
              fontStyle="bold"
              fill={colors.text}
              align="center"
              verticalAlign="middle"
              width={table.width}
              height={table.height}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
          </Group>
        );
      case 'container':
        return (
          <Rect
            width={table.width} height={table.height}
            fill={colors.containerFill}
            stroke={isSelected ? colors.selectedStroke : colors.containerStroke}
            strokeWidth={isSelected ? 2 : 1.5}
            dash={[10, 5]}
            cornerRadius={4}
            offsetX={table.width! / 2} offsetY={table.height! / 2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'restroom':
        const isDarkMode = colors.stageBg === '#18181b';
        return (
          <Group>
            <Rect
              width={table.width} height={table.height}
              fill={isDarkMode ? '#27272a' : '#e4e4e7'}
              stroke={isSelected ? colors.selectedStroke : (isDarkMode ? '#3f3f46' : '#a1a1aa')}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={4}
              offsetX={table.width! / 2} offsetY={table.height! / 2}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
            />
            <Text
              text="WC"
              fontSize={Math.min(table.width!, table.height!) * 0.4}
              fontStyle="bold"
              fill={isDarkMode ? '#a1a1aa' : '#3f3f46'}
              align="center"
              verticalAlign="middle"
              width={table.width}
              height={table.height}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
          </Group>
        );
      case 'chair':
        return (
          <Arc
            innerRadius={0}
            outerRadius={8}
            angle={180}
            rotation={180}
            fill={colors.paperBg}
            stroke={isSelected ? colors.selectedStroke : colors.tableStroke}
            strokeWidth={isSelected ? 2 : 1.5}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
      case 'circle':
      default:
        return (
          <Circle
            radius={table.radius || 35}
            fill={isSelected ? colors.selectedFill : colors.tableFill}
            stroke={isSelected ? colors.selectedStroke : colors.tableStroke}
            strokeWidth={2}
            shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
          />
        );
    }
  };

  return (
    <Group
      key={table.uniqueId}
      id={table.uniqueId}
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Render optional external elements */}
      {renderChairs()}

      <Group name="shape">
        {renderShape()}
      </Group>

      <Group rotation={-table.rotation}>
        {renderTableBadges()}
      </Group>

      {/* Label */}
      {table.type !== 'wall' &&
        table.type !== 'plant' &&
        table.type !== 'booth' &&
        table.type !== 'door' &&
        table.type !== 'column' &&
        table.type !== 'text' &&
        table.type !== 'cashier' &&
        table.type !== 'restroom' &&
        table.type !== 'rect' &&
        table.type !== 'circle' &&
        table.type !== 'chair' &&
        table.type !== 'counter' && (
          <Text
            text={String(table.label || '')}
            fontSize={table.type === 'container' ? 14 : 12}
            fontStyle={table.type === 'container' ? 'bold' : 'normal'}
            fill={table.type === 'container' ? colors.containerText : colors.text}
            align="center"
            verticalAlign="middle"
            width={!table.radius ? table.width : (table.radius * 2)}
            height={!table.radius ? table.height : (table.radius * 2)}
            offsetX={!table.radius ? table.width! / 2 : table.radius}
            offsetY={!table.radius ? table.height! / 2 : table.radius}
            pointerEvents="none"
          />
        )}

      {/* Controls */}
      {isSelected && (() => {
        const isWall = table.type === 'wall';
        const halfW = !table.radius ? table.width! / 2 : table.radius!;
        const halfH = !table.radius ? table.height! / 2 : table.radius!;
        const isHorizontalWall = isWall && table.width! > table.height!;

        const btnOffset = 15; // distance from element edge

        // Delete position: top-right, detached
        const deleteX = halfW + btnOffset;
        const deleteY = -halfH - btnOffset;

        // Rotate position: top-left, detached (non-wall)
        const rotateX = -halfW - btnOffset;
        const rotateY = -halfH - btnOffset;

        // Wall extend positions
        const extendStartX = isHorizontalWall ? -halfW - 20 : 0;
        const extendStartY = isHorizontalWall ? 0 : -halfH - 20;
        const extendEndX = isHorizontalWall ? halfW + 20 : 0;
        const extendEndY = isHorizontalWall ? 0 : halfH + 20;

        const buttonCursor = (e: any, cursor: string) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = cursor;
        };

        return (
          <>
            {/* Rotate Handle (non-wall only) */}
            {!isWall && (
              <Group
                x={rotateX} y={rotateY}
                onClick={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
                onTap={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
                onMouseEnter={(e) => buttonCursor(e, 'pointer')}
                onMouseLeave={(e) => buttonCursor(e, 'default')}
              >
                <Circle radius={12} fill="transparent" />
                <Circle radius={9} fill="white" stroke="#e2e8f0" strokeWidth={1} shadowColor="black" shadowBlur={3} shadowOpacity={0.1} />
                <Path data="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5" stroke="#0f172a" strokeWidth={2} scaleX={0.35} scaleY={0.35} x={-4.2} y={-4.2} lineCap="round" lineJoin="round" />
              </Group>
            )}

            {/* Delete Handle (top-right) */}
            <Group
              x={deleteX} y={deleteY}
              onClick={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
              onTap={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
              onMouseEnter={(e) => buttonCursor(e, 'pointer')}
              onMouseLeave={(e) => buttonCursor(e, 'default')}
            >
              <Circle radius={12} fill="transparent" />
              <Circle radius={9} fill="#ef4444" stroke="white" strokeWidth={1.5} shadowColor="black" shadowBlur={3} shadowOpacity={0.15} />
              <Path data="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth={2.5} scaleX={0.35} scaleY={0.35} x={-4.2} y={-4.2} lineCap="round" lineJoin="round" />
            </Group>

            {/* Wall Extension Handles (short ends) */}
            {isWall && onWallExtendStart && (
              <>
                <Group
                  x={extendStartX} y={extendStartY}
                  onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start'); }}
                  onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start'); }}
                  onMouseEnter={(e) => buttonCursor(e, 'pointer')}
                  onMouseLeave={(e) => buttonCursor(e, 'default')}
                >
                  <Circle radius={15} fill="transparent" />
                  <Circle radius={12} fill="#3b82f6" stroke="white" strokeWidth={2} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} />
                  <Path data="M12 5v14M5 12h14" stroke="white" strokeWidth={3} scaleX={0.5} scaleY={0.5} x={-6} y={-6} lineCap="round" lineJoin="round" />
                </Group>
                <Group
                  x={extendEndX} y={extendEndY}
                  onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end'); }}
                  onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end'); }}
                  onMouseEnter={(e) => buttonCursor(e, 'pointer')}
                  onMouseLeave={(e) => buttonCursor(e, 'default')}
                >
                  <Circle radius={15} fill="transparent" />
                  <Circle radius={12} fill="#3b82f6" stroke="white" strokeWidth={2} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} />
                  <Path data="M12 5v14M5 12h14" stroke="white" strokeWidth={3} scaleX={0.5} scaleY={0.5} x={-6} y={-6} lineCap="round" lineJoin="round" />
                </Group>
              </>
            )}
          </>
        );
      })()}
    </Group>
  );
};
