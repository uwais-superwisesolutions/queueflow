interface QFLogoProps {
  size?: number;
  showWord?: boolean;
  mono?: boolean;
}

export function QFLogo({ size = 18, showWord = true, mono = false }: QFLogoProps) {
  const dotColor = mono ? 'currentColor' : 'var(--ink)';
  const accent = mono ? 'currentColor' : 'var(--teal)';
  const dots = [3, 4, 5, 6, 7];

  return (
    <span className="inline-flex items-center gap-2" style={{ color: 'var(--ink)' }}>
      <span className="inline-flex items-center gap-[3px]" style={{ height: size }}>
        {dots.map((d, i) => (
          <span
            key={i}
            className="rounded-full flex-none transition-all duration-[400ms]"
            style={{
              width: d,
              height: d,
              background: i === 3 ? accent : dotColor,
              opacity: i === 3 ? 1 : 0.25 + i * 0.15,
            }}
          />
        ))}
      </span>
      {showWord && (
        <span
          className="font-semibold tracking-[-0.015em]"
          style={{ fontSize: size * 0.85, color: 'var(--ink)' }}
        >
          queueflow
        </span>
      )}
    </span>
  );
}
