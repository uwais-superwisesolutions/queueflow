import { useMemo } from 'react';
import { hashStr } from '@/lib/time';

interface QRPlaceholderProps {
  size?: number;
  seed?: string;
  className?: string;
}

export function QRPlaceholder({ size = 140, seed = 'queueflow', className }: QRPlaceholderProps) {
  const cells = 21;

  const data = useMemo(() => {
    let h = hashStr(seed);
    const out: boolean[] = [];
    for (let i = 0; i < cells * cells; i++) {
      h = (h * 1664525 + 1013904223) & 0xffffffff;
      out.push((h & 1) === 1);
    }
    return out;
  }, [seed]);

  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) ||
    (x >= cells - 7 && y < 7) ||
    (x < 7 && y >= cells - 7);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        padding: 8,
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 10,
      }}
    >
      <svg
        width={size - 16}
        height={size - 16}
        viewBox={`0 0 ${cells} ${cells}`}
        shapeRendering="crispEdges"
      >
        {data.map((on, i) => {
          const x = i % cells;
          const y = Math.floor(i / cells);
          if (isFinder(x, y) || !on) return null;
          return <rect key={i} x={x} y={y} width="1" height="1" fill="var(--ink)" />;
        })}
        {([[0, 0], [cells - 7, 0], [0, cells - 7]] as [number, number][]).map(([fx, fy], k) => (
          <g key={k}>
            <rect x={fx} y={fy} width="7" height="7" fill="var(--ink)" />
            <rect x={fx + 1} y={fy + 1} width="5" height="5" fill="#fff" />
            <rect x={fx + 2} y={fy + 2} width="3" height="3" fill="var(--ink)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
