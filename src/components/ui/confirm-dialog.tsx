import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from './button';
import { Modal } from './modal';
import type { ButtonVariant } from '@/types';

/**
 * Reusable confirm dialog wired via a React context.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: 'Delete?', body: 'This cannot be undone.', tone: 'danger' });
 *   if (!ok) return;
 *
 * Mount <ConfirmProvider> once near the app root (we do this in main.tsx).
 */

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' renders the confirm button in coral; default uses primary teal. */
  tone?: 'default' | 'danger';
}

type Confirm = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  // Keep a ref so the imperative `confirm` function is stable across renders.
  const stateRef = useRef<DialogState | null>(null);
  stateRef.current = state;

  const confirm = useCallback<Confirm>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        // If a previous dialog is somehow still open, resolve it as cancel.
        stateRef.current?.resolve(false);
        setState({ ...opts, resolve });
      }),
    [],
  );

  const close = (result: boolean) => {
    setState((prev) => {
      prev?.resolve(result);
      return null;
    });
  };

  const confirmVariant: ButtonVariant = state?.tone === 'danger' ? 'danger' : 'primary';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state !== null}
        onClose={() => close(false)}
        title={state?.title ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              {state?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button variant={confirmVariant} onClick={() => close(true)} autoFocus>
              {state?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        {state?.body && (
          <div className="text-[13.5px] text-ink-2 leading-relaxed">{state.body}</div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

/**
 * Returns the imperative `confirm(opts) → Promise<boolean>` function.
 * Throws if used outside `<ConfirmProvider>`.
 */
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm() must be used inside <ConfirmProvider>.');
  }
  return useMemo(() => ctx, [ctx]);
}
