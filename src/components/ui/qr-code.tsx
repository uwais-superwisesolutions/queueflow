import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  /** Outer square size in px (including the white border padding). */
  size?: number;
  /** The string to encode — a URL, slug, anything. */
  value: string;
  className?: string;
}

/**
 * Renders a real, scannable QR code. Matches the visual chrome of QRPlaceholder
 * (8px white padding, light border, rounded corners) so swapping in/out is a
 * no-op for surrounding layout.
 */
export function QRCode({ size = 140, value, className }: QRCodeProps) {
  const inner = size - 16; // matches the 8px padding on each side
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
        flex: 'none',
      }}
    >
      <QRCodeSVG
        value={value}
        size={inner}
        // Medium error correction is a good balance for marketing-style scans.
        level="M"
        bgColor="#ffffff"
        fgColor="var(--ink)"
        marginSize={0}
        style={{ display: 'block' }}
      />
    </div>
  );
}
