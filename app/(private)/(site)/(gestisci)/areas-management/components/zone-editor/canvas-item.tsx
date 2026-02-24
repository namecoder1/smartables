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
      case 'door': // Broken line
        return (
          <Group>
            {/* Left Piece */}
            <Rect
              width={table.width! / 3} height={table.height}
              fill={colors.doorFill}
              stroke={isSelected ? colors.selectedStroke : colors.doorStroke}
              strokeWidth={isSelected ? 2 : 1}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
            {/* Middle Piece (Mask) */}
            <Rect
              x={table.width! / 3}
              width={table.width! / 3} height={table.height}
              fill={colors.paperBg}
              strokeWidth={0}
              offsetX={table.width! / 2}
              offsetY={table.height! / 2}
            />
            {/* Right Piece */}
            <Rect
              x={(table.width! * 2) / 3}
              width={table.width! / 3} height={table.height}
              fill={colors.doorFill}
              stroke={isSelected ? colors.selectedStroke : colors.doorStroke}
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
        return (
          <Rect
            width={table.width} height={table.height}
            fill={colors.wallFill}
            stroke={isSelected ? colors.selectedStroke : colors.wallStroke}
            strokeWidth={isSelected ? 2 : 1}
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
        return (
          <Group>
            <Rect
              width={table.width} height={table.height}
              fill={colors.restroomFill}
              stroke={isSelected ? colors.selectedStroke : colors.restroomStroke}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={4}
              offsetX={table.width! / 2} offsetY={table.height! / 2}
              shadowColor="black" shadowBlur={shadowBlur} shadowOpacity={shadowOpacity}
            />
            {/* WC Text */}
            <Text
              text="WC"
              fontSize={Math.min(table.width!, table.height!) * 0.4}
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
      {renderShape()}

      {/* Label */}
      {table.type !== 'wall' &&
        table.type !== 'plant' &&
        table.type !== 'booth' &&
        table.type !== 'door' &&
        table.type !== 'column' &&
        table.type !== 'text' &&
        table.type !== 'cashier' &&
        table.type !== 'restroom' && (
          <Text
            text={table.label}
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
      {isSelected && (
        <>
          {/* Rotate Handle */}
          <Group
            x={0}
            y={!table.radius ? -(table.height! / 2) - 25 : -(table.radius!) - 25}
            onClick={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
            onTap={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          >
            {/* Hit Area */}
            <Circle radius={15} fill="transparent" />

            {/* Button bg */}
            <Circle
              radius={12}
              fill="white"
              stroke="#e2e8f0"
              strokeWidth={1}
              shadowColor="black" shadowBlur={5} shadowOpacity={0.1}
            />
            {/* Icon */}
            <Path
              data="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5"
              stroke="#0f172a"
              strokeWidth={2}
              scaleX={0.45} scaleY={0.45}
              x={-5.5} y={-5.5}
              lineCap="round" lineJoin="round"
            />
          </Group>

          {/* Delete Handle */}
          <Group
            x={!table.radius ? (table.width! / 2) : table.radius}
            y={!table.radius ? -(table.height! / 2) : -(table.radius!)}
            onClick={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
            onTap={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          >
            {/* Hit Area */}
            <Circle radius={15} fill="transparent" />

            {/* Button bg */}
            <Circle
              radius={12}
              fill="#ef4444"
              stroke="white"
              strokeWidth={2}
              shadowColor="black" shadowBlur={5} shadowOpacity={0.2}
            />
            {/* Icon */}
            <Path
              data="M18 6L6 18M6 6l12 12"
              stroke="white" strokeWidth={2.5}
              scaleX={0.45} scaleY={0.45}
              x={-5.5} y={-5.5}
              lineCap="round" lineJoin="round"
            />
          </Group>

          {/* Wall Extension Handles */}
          {table.type === 'wall' && onWallExtendStart && (
            <>
              {/* Start Handle */}
              <Group
                x={table.width! > table.height! ? -(table.width! / 2) - 25 : 0}
                y={table.width! > table.height! ? 0 : -(table.height! / 2) - 25}
                onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start') }}
                onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start') }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
              >
                <Circle radius={15} fill="transparent" />
                <Circle
                  radius={12}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={2}
                  shadowColor="black" shadowBlur={5} shadowOpacity={0.2}
                />
                <Path
                  data="M12 5v14M5 12h14"
                  stroke="white" strokeWidth={3}
                  scaleX={0.5} scaleY={0.5}
                  x={-6} y={-6}
                  lineCap="round" lineJoin="round"
                />
              </Group>

              {/* End Handle */}
              <Group
                x={table.width! > table.height! ? (table.width! / 2) + 25 : 0}
                y={table.width! > table.height! ? 0 : (table.height! / 2) + 25}
                onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end') }}
                onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end') }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
              >
                <Circle radius={15} fill="transparent" />
                <Circle
                  radius={12}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={2}
                  shadowColor="black" shadowBlur={5} shadowOpacity={0.2}
                />
                <Path
                  data="M12 5v14M5 12h14"
                  stroke="white" strokeWidth={3}
                  scaleX={0.5} scaleY={0.5}
                  x={-6} y={-6}
                  lineCap="round" lineJoin="round"
                />
              </Group>
            </>
          )}
        </>
      )}
    </Group>
  );
};
