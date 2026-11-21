import React from 'react';

export type SpriteName = 'inv' | 'sq' | 'ship';

const SPRITE_MATRICES: Record<SpriteName, string[]> = {
  inv: [
    "..#.....#..",
    "...#...#...",
    "..#######..",
    ".##.###.##.",
    "###########",
    "#.#######.#",
    "#.#.....#.#",
    "...##.##..."
  ],
  sq: [
    "...##...",
    "..####..",
    ".######.",
    "##.##.##",
    "########",
    "..#..#..",
    ".#.##.#.",
    "#.#..#.#"
  ],
  ship: [
    "#.......",
    "###.....",
    "#####...",
    "#######.",
    "#####...",
    "###.....",
    "#......."
  ]
};

interface PixelSpriteProps {
  name: SpriteName;
  color?: string;
  size?: number; // base pixel size in px (default ~4)
  className?: string;
  style?: React.CSSProperties;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  name,
  color = 'currentColor',
  size = 4,
  className = '',
  style = {}
}) => {
  const matrix = SPRITE_MATRICES[name] || SPRITE_MATRICES.inv;
  const height = matrix.length;
  const width = matrix[0].length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * size}
      height={height * size}
      shapeRendering="crispEdges"
      className={`inline-block select-none ${className}`}
      style={style}
    >
      {matrix.map((row, y) =>
        row.split('').map((char, x) => {
          if (char === '#') {
            return (
              <rect
                key={`${y}-${x}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            );
          }
          return null;
        })
      )}
    </svg>
  );
};
