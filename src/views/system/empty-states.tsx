import { type ReactNode } from 'react';
import { Icon, Button, Card } from '@/components/ui';
import type { IconName } from '@/types';

interface ProgressDef {
  value: number;
  max: number;
  label: string;
}

interface ESBlockProps {
  icon: IconName;
  title: string;
  body: string;
  primary: string;
  secondary?: string;
  illustration?: 'dots';
  meta?: string;
  progress?: ProgressDef;
}

function ESBlock({ icon, title, body, primary, secondary, illustration, meta, progress }: ESBlockProps) {
  return (
    <div className="text-center max-w-[360px]">
      {illustration === 'dots' ? (
        <div className="flex gap-1.5 justify-center mb-4">
          {[3, 4, 5, 6, 7].map((d, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width:      d,
                height:     d,
                background: i === 2 ? 'var(--teal)' : 'var(--ink-4)',
                opacity:    i === 2 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      ) : (
        <span className="w-14 h-14 rounded-[14px] bg-surface-2 text-ink-3 inline-flex items-center justify-center mb-4">
          <Icon name={icon} size={22} stroke={1.5} />
        </span>
      )}
      <h3 className="m-0 mb-1.5 text-[17px] font-medium text-ink tracking-[-0.015em]">{title}</h3>
      <p className="m-0 mb-[18px] text-[13.5px] text-ink-3 leading-relaxed">{body}</p>
      {progress && (
        <div className="mb-[18px]">
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-teal"
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            />
          </div>
          <span className="mono text-[11px] text-ink-3">{progress.label}</span>
        </div>
      )}
      <div className="inline-flex gap-2">
        <Button variant="primary" size="sm">{primary}</Button>
        {secondary && <Button variant="ghost" size="sm">{secondary}</Button>}
      </div>
      {meta && <div className="mt-3.5 text-[11px] text-ink-4">{meta}</div>}
    </div>
  );
}

function ESFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
        {label}
      </div>
      <Card
        style={{ padding: 28, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Card>
    </div>
  );
}

export function EmptyStatesScreen() {
  return (
    <div className="min-h-screen bg-bg px-10 py-8">
      <div className="max-w-[1280px] mx-auto">
        <h1 className="m-0 mb-1.5 text-[22px] font-medium tracking-[-0.02em]">Empty states</h1>
        <p className="m-0 mb-6 text-[13.5px] text-ink-3">
          Each empty state earns its place: a clear next action, never just an illustration.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <ESFrame label="Super user · no departments yet">
            <ESBlock
              icon="building"
              title="Set up your first department"
              body="Departments group your seats — Dental, Pediatrics, General Practice. Most clinics start with one or two."
              primary="Add a department"
              secondary="See examples"
            />
          </ESFrame>

          <ESFrame label="Org user · no queue today">
            <ESBlock
              icon="users"
              title="No one is waiting yet"
              body="Your queue is empty. Share your join link or wait for the first request to come in — we'll notify you."
              primary="Copy join link"
              secondary="Update availability"
              illustration="dots"
            />
          </ESFrame>

          <ESFrame label="Client portal link · no scans yet">
            <ESBlock
              icon="qr"
              title="No scans yet"
              body="This link was created 2 hours ago. Once people scan the QR or open the URL, you'll see scan counts here."
              primary="Download QR"
              secondary="Copy link"
              meta="Scope: Whole org · Created 12:14 today"
            />
          </ESFrame>

          <ESFrame label="Analytics · insufficient data">
            <ESBlock
              icon="zap"
              title="We need a few more bookings"
              body="Analytics light up after 7 days and at least 30 completed bookings. You're at day 2 with 11 bookings — keep going."
              primary="Share your link"
              secondary="View dashboard"
              progress={{ value: 11, max: 30, label: '11 of 30 bookings' }}
            />
          </ESFrame>
        </div>
      </div>
    </div>
  );
}
