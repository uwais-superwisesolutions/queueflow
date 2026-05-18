import { type ReactNode } from 'react';
import { Pill } from '@/components/ui';

function Bubble({
  side,
  highlight,
  children,
}: {
  side: 'me' | 'them';
  highlight?: boolean;
  children: ReactNode;
}) {
  const isMe = side === 'me';
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        style={{
          maxWidth: '78%',
          padding: '8px 12px',
          borderRadius: 16,
          background: isMe ? '#0a84ff' : highlight ? '#1c2f29' : 'rgba(255,255,255,.13)',
          color:      isMe ? '#fff'    : highlight ? '#8ad9bd' : 'rgba(255,255,255,.95)',
          fontSize: 13,
          lineHeight: 1.4,
          whiteSpace: 'pre-line',
          border: highlight ? '1px solid rgba(138,217,189,.3)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SmsPhone() {
  return (
    <div
      className="mx-auto relative"
      style={{
        width: 320, height: 620,
        background: 'var(--ink)', borderRadius: 36,
        padding: 10,
        boxShadow: '0 30px 80px rgba(20,18,12,.18), 0 0 0 1px rgba(20,18,12,.05)',
      }}
    >
      <div
        className="w-full h-full overflow-hidden flex flex-col relative"
        style={{
          borderRadius: 28,
          background: '#0b0f10',
          color: '#ecead9',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Dynamic island */}
        <div
          className="absolute z-[3]"
          style={{
            top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 84, height: 22, background: '#000', borderRadius: 14,
          }}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-[22px] pt-[10px] pb-1.5 text-[12px] font-semibold">
          <span className="tnum">14:42</span>
          <span />
        </div>

        {/* iOS messages header */}
        <div className="px-4 pt-4 pb-2.5 flex flex-col items-center gap-1.5">
          <span
            className="w-[50px] h-[50px] rounded-full inline-flex items-center justify-center text-[16px] font-semibold text-white"
            style={{ background: '#0f6e56' }}
          >
            BF
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>BFP Clinic</span>
          <span style={{ fontSize: 9.5, opacity: 0.5 }}>SMS</span>
        </div>

        {/* Message thread */}
        <div className="flex-1 px-3 py-2 flex flex-col gap-2.5 overflow-auto">
          <div
            className="text-center"
            style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', margin: '6px 0' }}
          >
            Today 10:32
          </div>
          <Bubble side="them">
            Hi Sarah, your booking with Dr. Okonkwo on Tue 18 May at 15:00 is confirmed. View live status: queueflow.io/q/x42p
          </Bubble>
          <div
            className="text-center"
            style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)', margin: '6px 0' }}
          >
            Today 14:42 · Delay alert
          </div>
          <Bubble side="them" highlight>
            {`Hi Sarah, your appointment with Dr. Okonkwo at 14:30 is running ~15 min late. New estimated time: 14:45.\n\nView live status: queueflow.io/q/x42p`}
          </Bubble>
          <Bubble side="me">Thanks for the heads up 🙏</Bubble>
        </div>

        {/* Input bar */}
        <div className="px-3 pt-2 pb-3.5 flex items-center gap-2">
          <div
            className="flex-1 px-3 py-1.5 rounded-[16px] text-[12px]"
            style={{ border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.4)' }}
          >
            iMessage
          </div>
        </div>

        {/* Home bar */}
        <div
          className="absolute bottom-1.5 rounded-full"
          style={{
            width: 110, height: 4,
            left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,.55)',
          }}
        />
      </div>
    </div>
  );
}

const SMS_RULES = [
  ['Trigger',        'When estimated wait drifts ≥ 10 min from scheduled time'],
  ['Audience',       'All \'scheduled\' and \'checked-in\' clients in that org user\'s queue'],
  ['Personalisation','First name, consultant, scheduled time, new estimate, deep link'],
  ['Throttling',     'One SMS per client per delay event; max 3 per booking'],
] as const;

const SMS_TEMPLATE = `Hi {{first_name}}, your appointment with
{{consultant}} at {{scheduled_time}} is
running ~{{delay_min}} min late.
New estimated time: {{new_eta}}.

View live status: {{link}}`;

export function SmsPreviewScreen() {
  return (
    <div
      className="min-h-screen bg-bg px-6 py-8 grid place-items-center"
    >
      <div
        className="max-w-[1100px] w-full grid items-center gap-10"
        style={{ gridTemplateColumns: '1.2fr 1fr' }}
      >
        {/* Left: explainer */}
        <div>
          <Pill tone="neutral" className="mb-3.5">Auto-drafted by Claude · sent via Twilio</Pill>
          <h1 className="m-0 mb-2.5 text-[32px] font-medium tracking-[-0.025em] text-balance">
            Delay alert SMS
          </h1>
          <p className="m-0 mb-[22px] text-[15px] text-ink-3 leading-relaxed">
            When the system detects a queue is running &gt; 10 minutes behind schedule,
            downstream clients get a short, personalised SMS with a live link.
          </p>

          <div className="flex flex-col gap-2.5">
            {SMS_RULES.map(([k, v]) => (
              <div key={k} className="grid text-[13px]" style={{ gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <span className="text-ink-3 font-medium">{k}</span>
                <span className="text-ink-2">{v}</span>
              </div>
            ))}
          </div>

          {/* Template block */}
          <div className="mt-6 p-4 bg-surface border border-line rounded-[12px]">
            <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
              Template
            </div>
            <pre
              className="mono m-0 text-[12.5px] text-ink-2 whitespace-pre-wrap leading-relaxed"
            >
              {SMS_TEMPLATE}
            </pre>
          </div>
        </div>

        {/* Right: phone mock */}
        <SmsPhone />
      </div>
    </div>
  );
}
