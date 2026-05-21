import { useState, useEffect } from 'react';
import { Icon, Button, Card, Pill, Avatar } from '@/components/ui';
import { QFLogo } from '@/components/layout';
import { formatMS } from '@/lib/time';

interface LandingScreenProps {
  onCta?: () => void;
  onSignIn?: () => void;
  onClientPortal?: () => void;
}

export function LandingScreen({ onCta, onSignIn }: LandingScreenProps) {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-bg text-ink">
      <header className="px-4 sm:px-8" style={{ maxWidth: 1080, margin: '0 auto', paddingTop: 22, paddingBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <QFLogo size={20} />
        <span className="flex-wrap justify-end" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={onCta} iconRight="arrowR">Create an account</Button>
        </span>
      </header>

      <section className="qf-landing-hero px-4 sm:px-8" style={{
        maxWidth: 1080, margin: '0 auto',
        paddingTop: 48,
        paddingBottom: 72,
        gap: 56,
        alignItems: 'center',
      }}>
        <div>
          <h1 className="text-[36px] sm:text-[52px]" style={{
            margin: 0, lineHeight: 1.05,
            fontWeight: 500, letterSpacing: '-0.035em',
            textWrap: 'balance',
          } as React.CSSProperties}>
            Run your waiting room from a link.
          </h1>
          <p style={{
            margin: '20px 0 0', fontSize: 16.5, lineHeight: 1.55,
            maxWidth: 460,
          } as React.CSSProperties} className="text-ink-2">
            Clients book and check in from their phone. You see every booking,
            approve walk-ins, and send delay updates without leaving the queue.
          </p>
          <div className="flex-col sm:flex-row" style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'stretch' }}>
            <Button variant="primary" size="lg" onClick={onCta} iconRight="arrowR">Create an account</Button>
            <Button variant="ghost" size="lg" onClick={onSignIn}>Sign in</Button>
          </div>
        </div>

        <HeroQueuePreview />
      </section>

      <section className="px-4 sm:px-8" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 88 }}>
        <div className="qf-feature-grid" style={{ gap: 16 }}>
          <FeatureCard
            title="One shareable link per seat"
            body="Each org user gets a portal link or QR. Clients land in the right queue without paperwork."
            icon="link"
          />
          <FeatureCard
            title="Live queue, approve in one tap"
            body="Pending approvals, checked-in, and in-service — all in one view. Polls in real time."
            icon="users"
          />
          <FeatureCard
            title="Automatic delay SMS"
            body="When a consult overruns, downstream clients get notified before they leave home."
            icon="bell"
          />
        </div>
      </section>

      <footer className="border-t border-line" style={{ padding: '22px 32px' }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 12,
        }} className="text-ink-3">
          <QFLogo size={14} />
          <span>© 2026 QueueFlow</span>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  body: string;
  icon: string;
}

function FeatureCard({ title, body, icon }: FeatureCardProps) {
  return (
    <Card style={{ padding: 22, height: '100%' }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }} className="bg-teal-tint text-teal-ink">
        <Icon name={icon as never} size={16} stroke={1.75} />
      </span>
      <h3 style={{ margin: '14px 0 6px', fontSize: 17, fontWeight: 500, letterSpacing: '-0.015em' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }} className="text-ink-3">{body}</p>
    </Card>
  );
}

function HeroQueuePreview() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = 4 * 60 + 23 + tick;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: -20, zIndex: 0,
        background: 'radial-gradient(ellipse at 60% 40%, var(--teal-tint), transparent 60%)',
        borderRadius: 24,
      }} />
      <Card style={{
        position: 'relative', zIndex: 1,
        padding: 0, overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }} className="bg-surface">
          <Avatar name="Amara Okonkwo" size={26} active />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Dr. Amara Okonkwo</div>
            <div style={{ fontSize: 11 }} className="text-ink-3">Room 3 · General Practice</div>
          </div>
          <Pill tone="success" dot>On shift</Pill>
        </div>

        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }} className="text-ink-4">
            In service now
          </div>
          <div style={{
            padding: 12, borderRadius: 10,
            background: 'var(--blue-tint)',
            border: '1px solid color-mix(in oklab, var(--blue) 25%, transparent)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar name="Sarah Mokoena" size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Sarah Mokoena</div>
              <div style={{ fontSize: 11.5 }} className="text-ink-3">Consult — 30 min · started 14:23</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono tnum text-blue" style={{ fontSize: 18, fontWeight: 500 }}>{formatMS(elapsed)}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }} className="text-ink-4">elapsed</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '6px 0 8px' }} className="text-ink-4">
            Up next
          </div>
          {([
            ['Jabu Khumalo', 'Follow-up · 15 min', '14:55'],
            ['Lerato Dube', 'Consult · 30 min', '15:10'],
            ['Michael van der Berg', 'Consult · 30 min', '15:40'],
          ] as [string, string, string][]).map(([n, t, time]) => (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 4px',
              borderTop: '1px solid var(--line)',
            }}>
              <Avatar name={n} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n}</div>
                <div style={{ fontSize: 11 }} className="text-ink-3">{t}</div>
              </div>
              <div className="mono tnum text-ink-2" style={{ fontSize: 12.5 }}>{time}</div>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11.5,
        }} className="bg-surface-2 text-ink-3">
          <span className="qf-live-dot" />
          Live preview
        </div>
      </Card>
    </div>
  );
}

interface AuthCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function AuthCard({ children, footer, width = 440 }: AuthCardProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }} className="bg-bg">
      <div style={{ width: '100%', maxWidth: width }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <QFLogo size={20} />
        </div>
        <Card style={{ padding: 28 }}>
          {children}
        </Card>
        {footer && (
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }} className="text-ink-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
