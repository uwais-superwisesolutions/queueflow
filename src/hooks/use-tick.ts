import { useEffect, useState } from 'react';

export function useTick(ms = 1000): void {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set(n => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
