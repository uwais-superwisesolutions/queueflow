import { useState, useEffect } from 'react';
import { Icon, Button, Card, Pill, Avatar } from '@/components/ui';
import { QFLogo } from '@/components/layout';
import { formatMS } from '@/lib/time';

interface LandingScreenProps {
  onCta?: () => void;
  onSignIn?: () => void;
  onClientPortal?: () => void;
}

export function LandingScreen({ onCta, onSignIn, onClientPortal }: LandingScreenProps) {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-bg text-ink">
      <header style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <QFLogo size={20} />
        <nav style={{ display: 'flex', gap: 22, marginLeft: 24, fontSize: 13.5 }} className="text-ink-2">
          <a className="cursor-pointer">Product</a>
          <a className="cursor-pointer">How it works</a>
          <a className="cursor-pointer">Pricing</a>
          <a className="cursor-pointer">Customers</a>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" icon="phone" onClick={onClientPortal}>Join a queue</Button>
          <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={onCta} iconRight="arrowR">Start free trial</Button>
        </div>
      </header>

      <section style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '40px 32px 64px',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: 56,
        alignItems: 'center',
      }}>
        <div>
          <Pill tone="teal" icon="sparkles" style={{ marginBottom: 22 }}>
            Now in private beta — 14 clinics live
          </Pill>
          <h1 style={{
            margin: 0, fontSize: 56, lineHeight: 1.04,
            fontWeight: 500, letterSpacing: '-0.035em',
            textWrap: 'balance',
          } as React.CSSProperties}>
            Replace your token machine<br />
            with a link.
          </h1>
          <p style={{
            margin: '20px 0 0', fontSize: 17, lineHeight: 1.55,
            maxWidth: 480, textWrap: 'pretty',
          } as React.CSSProperties} className="text-ink-2">
            QueueFlow takes the waiting room online. Clients join from their phone,
            staff manage live queues from any device, and everyone gets notified the
            moment things change — so nobody waits longer than they have to.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center' }}>
            <Button variant="primary" size="lg" onClick={onCta} iconRight="arrowR">Start your free trial</Button>
            <Button variant="ghost" size="lg" icon="zap">Watch the 2-min tour</Button>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 22, fontSize: 12.5 }} className="text-ink-3">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={13} className="text-teal" /> No credit card
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={13} className="text-teal" /> Set up in 10 minutes
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={13} className="text-teal" /> POPIA-aligned
            </span>
          </div>
        </div>

        <HeroQueuePreview />
      </section>

      <section className="border-t border-b border-line bg-surface">
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          padding: '22px 32px',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }} className="text-ink-3">
            Trusted by clinics
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'center' }} className="text-ink-3">
            {['Bryanston Family', 'Linksfield Dental', 'Rosebank Pediatric', 'Cape Quay Health', 'Sandton Skin Clinic', 'Mowbray GP']
              .map((c) => (
                <span key={c} style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.01em' }} className="text-ink-2">{c}</span>
              ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
          <Pill tone="neutral" style={{ marginBottom: 14 }}>How it works</Pill>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em' }}>
            Three small changes. One quieter waiting room.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <FeatureCard
            n="01" title="Online booking"
            body="Share one link, or a printed QR at reception. Clients pick a time that suits them — or join the next-available queue."
            icon="link"
          />
          <FeatureCard
            n="02" title="Live queue"
            body="Staff see who's pending approval, who's checked in, and who's next — from any device. State changes sync in real time."
            icon="users"
          />
          <FeatureCard
            n="03" title="Proactive alerts"
            body="When a consult runs long, downstream clients get an SMS before they leave home. Less frustration, fewer no-shows."
            icon="bell"
          />
        </div>
      </section>

      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 32px 80px' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }} className="bg-surface border-line-2">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
            <div style={{ padding: '36px 40px' }}>
              <Pill tone="teal">Free trial</Pill>
              <h3 style={{ margin: '14px 0 8px', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
                14 days free, then R&nbsp;490 per seat per month.
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, maxWidth: 440 }} className="text-ink-3">
                Pay for the seats you fill. Add departments, devices, and client portal
                links at no extra cost. Annual plans save 20%.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                <Button variant="primary" onClick={onCta} iconRight="arrowR">Start your free trial</Button>
                <Button variant="ghost">See pricing details</Button>
              </div>
            </div>
            <div style={{
              borderLeft: '1px solid var(--line)',
              padding: 32,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
            }} className="bg-surface-2">
              {([
                ['Unlimited departments & seats', null],
                ['Unlimited client portal links', null],
                ['Real-time queue routing', null],
                ['Proactive SMS alerts', '1,000 / mo included'],
                ['Analytics & utilization reports', null],
              ] as [string, string | null][]).map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <Icon name="check" size={14} className="text-teal" />
                  <span style={{ flex: 1 }} className="text-ink">{k}</span>
                  {v && <span style={{ fontSize: 12 }} className="text-ink-3">{v}</span>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <footer className="border-t border-line" style={{ padding: '22px 32px' }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 12,
        }} className="text-ink-3">
          <QFLogo size={14} />
          <span>© 2026 QueueFlow</span>
          <span style={{ flex: 1 }} />
          <a className="cursor-pointer">Privacy</a>
          <a className="cursor-pointer">Terms</a>
          <a className="cursor-pointer">Status</a>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  n: string;
  title: string;
  body: string;
  icon: string;
}

function FeatureCard({ n, title, body, icon }: FeatureCardProps) {
  return (
    <Card style={{ padding: 24, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }} className="bg-teal-tint text-teal-ink">
          <Icon name={icon as never} size={16} stroke={1.75} />
        </span>
        <span className="mono text-ink-4" style={{ fontSize: 11, letterSpacing: '0.04em' }}>{n}</span>
      </div>
      <h3 style={{ margin: '16px 0 6px', fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em' }}>{title}</h3>
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
          Live · 23 in queue · synced just now
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
