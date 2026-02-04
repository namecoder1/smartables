import React from 'react';
import { Group, Rect, Circle, Text, Path } from 'react-konva';
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
        table.type !== 'column' && (
        <Text
          text={table.label}
          fontSize={12}
          fill={colors.text}
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
            y={!table.radius ? -(table.height! / 2) - 20 : -(table.radius!) - 20}
            onClick={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
            onTap={(e) => { e.cancelBubble = true; onRotate(table.uniqueId); }}
          >
            <Circle radius={10} fill={colors.selectedFill} stroke={colors.selectedStroke} strokeWidth={1} />
            <Path
              data="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5"
              stroke="white" strokeWidth={2} scaleX={0.5} scaleY={0.5}
              x={-6} y={-6} lineCap="round" lineJoin="round"
            />
          </Group>

          {/* Delete Handle */}
          <Group
            x={!table.radius ? (table.width! / 2) : table.radius}
            y={!table.radius ? -(table.height! / 2) : -(table.radius!)}
            onClick={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
            onTap={(e) => { e.cancelBubble = true; onDelete(table.uniqueId); }}
          >
            <Circle radius={10} fill="red" stroke="white" strokeWidth={2} />
            <Path
              data="M5 5 L19 19 M19 5 L5 19"
              stroke="white" strokeWidth={2} scaleX={0.5} scaleY={0.5}
              x={-6} y={-6} lineCap="round" lineJoin="round"
            />
          </Group>

          {/* Wall Extension Handles */}
          {table.type === 'wall' && onWallExtendStart && (
            <>
              <Group
                x={table.width! > table.height! ? -(table.width! / 2) - 20 : 0}
                y={table.width! > table.height! ? 0 : -(table.height! / 2) - 20}
                onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start') }}
                onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'start') }}
              >
                <Circle radius={8} fill={colors.selectedStroke} />
                <Text text="+" fontSize={12} fill="white" align="center" verticalAlign="middle" offsetX={3} offsetY={5} fontStyle="bold" />
              </Group>
              <Group
                x={table.width! > table.height! ? (table.width! / 2) + 20 : 0}
                y={table.width! > table.height! ? 0 : (table.height! / 2) + 20}
                onClick={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end') }}
                onTap={(e) => { e.cancelBubble = true; onWallExtendStart(e, table, 'end') }}
              >
                <Circle radius={8} fill={colors.selectedStroke} />
                <Text text="+" fontSize={12} fill="white" align="center" verticalAlign="middle" offsetX={3} offsetY={5} fontStyle="bold" />
              </Group>
            </>
          )}
        </>
      )}
    </Group>
  );
};
