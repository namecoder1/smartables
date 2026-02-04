import React from 'react';
import { Group, Line, Rect } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  gridSize: number;
  stroke?: string;
}

export const Grid = ({ width, height, gridSize, stroke = '#ddd' }: GridProps) => {
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={stroke}
        strokeWidth={1}
        dash={x % (gridSize * 5) === 0 ? [] : [4, 4]} // Major lines solid, minor dashed (optional)
        opacity={0.3}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={stroke}
        strokeWidth={1}
        dash={y % (gridSize * 5) === 0 ? [] : [4, 4]}
        opacity={0.3}
      />
    );
  }

  return (
    <Group listening={false}>
      {lines}
    </Group>
  );
};
