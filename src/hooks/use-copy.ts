import { useCallback, useRef, useState } from 'react';

/**
 * Tiny clipboard helper. `copied` flips to `true` for `resetMs` after a
 * successful copy, so the UI can swap a "Copy" button to "Copied ✓" briefly.
 *
 * Falls back to a hidden textarea + `document.execCommand('copy')` for older
 * browsers / non-https contexts where `navigator.clipboard` isn't available.
 */
export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const ta = document.createElement('textarea');
          ta.value = value;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopied(true);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copy, copied };
}
