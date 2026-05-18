import { type ReactNode } from 'react';
import { Icon } from './icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, footer, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{ background: 'rgba(20,18,12,.34)', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-line rounded-[14px] shadow-lg flex flex-col overflow-hidden"
        style={{ width, maxWidth: '100%', maxHeight: 'calc(100vh - 40px)' }}
      >
        <div className="flex items-center gap-3 px-[18px] py-[14px] border-b border-line">
          <h2 className="m-0 text-[15px] font-semibold flex-1 tracking-[-0.01em]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="border-0 bg-transparent cursor-pointer p-1 text-ink-3 rounded-md hover:bg-surface-2"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="p-[18px] overflow-auto flex-1 qf-scroll">{children}</div>
        {footer && (
          <div className="flex gap-2 justify-end px-[18px] py-3 border-t border-line">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
