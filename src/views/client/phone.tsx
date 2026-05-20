 
import { useEffect, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field, SkeletonBox, SkeletonLine } from '@/components/ui';
import { requestClientOtp } from '@/services/clientAuthApi';
import {
  getCachedPortalScan,
  resolveClientOrgId,
  resolvePortalScan,
} from '@/lib/client-org';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PortalScanResponse } from '@/types';

interface ClientPhoneScreenProps {
  onContinue: (phone: string) => void;
}

const COUNTRY_DIAL_CODE = '+27';

function normalisePhone(input: string): string {
  const digits = input.replace(/\D+/g, '').replace(/^0+/, '');
  return `${COUNTRY_DIAL_CODE}${digits}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .padEnd(2, ' ')
    .slice(0, 2);
}

export function ClientPhoneScreen({ onContinue }: ClientPhoneScreenProps) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Org info — start with whatever's already cached so the UI doesn't flash, then
  // refresh from the scan endpoint to bump the scan_count + pick up branding tweaks.
  const [scan, setScan] = useState<PortalScanResponse | null>(() => getCachedPortalScan());
  const [resolving, setResolving] = useState(scan === null);
  const orgId = scan?.orgId ?? resolveClientOrgId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await resolvePortalScan();
        if (cancelled) return;
        if (fresh) setScan(fresh);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = async () => {
    if (!orgId) {
      setError('No organisation selected. Open a QueueFlow portal link to start.');
      return;
    }
    const normalised = normalisePhone(phone);
    if (normalised.length <= COUNTRY_DIAL_CODE.length) {
      setError('Please enter a phone number.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestClientOtp({ orgId, phone: normalised });
      onContinue(normalised);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send code. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="px-6 pt-7 pb-6">
        {/* Org header — real branding if the scan resolved */}
        {resolving && !scan ? (
          <div className="flex items-center gap-2.5">
            <SkeletonBox w={36} h={36} />
            <div className="flex-1 min-w-0">
              <SkeletonLine w="60%" h={13} />
              <SkeletonLine w="35%" h={10} className="mt-1.5" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-[9px] inline-flex items-center justify-center text-[13px] font-semibold flex-none text-white"
              style={{ background: scan?.brandColor ?? 'var(--teal)' }}
            >
              {scan ? initials(scan.orgName) : '?'}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold tracking-[-0.005em] truncate">
                {scan?.orgName ?? 'Pick a portal to start'}
              </div>
              <div className="text-[11.5px] text-ink-3 truncate">
                {scan?.scope?.name ?? (scan?.scope?.type === 'org' ? 'Whole organisation' : 'Welcome')}
              </div>
            </div>
          </div>
        )}

        <h1 className="mt-8 mb-1.5 text-[24px] font-medium tracking-[-0.02em] leading-[1.2] text-balance">
          Skip the waiting room.<br />
          Get notified when it's your turn.
        </h1>
        <p className="mt-0 mb-6 text-ink-3 text-[13.5px] leading-relaxed">
          Enter your phone number to join. We'll text you a code and a live link to your spot in the queue.
        </p>

        <Field label="Phone number">
          <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[10px] px-3 h-[50px]">
            <span className="inline-flex items-center gap-1.5 pr-2 border-r border-line h-[60%]">
              <span className="text-[16px]">🇿🇦</span>
              <span className="mono tnum text-[14px]">{COUNTRY_DIAL_CODE}</span>
              <Icon name="chevronD" size={11} className="text-ink-3" />
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="82 123 4567"
              inputMode="tel"
              autoComplete="tel-national"
              className="flex-1 h-full border-0 bg-transparent font-[inherit] text-[16px] text-ink outline-none min-w-0"
            />
          </div>
        </Field>

        {error && (
          <div className="text-coral text-[12.5px] mt-3" role="alert">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-[18px] h-[52px]"
          onClick={handleContinue}
          iconRight="arrowR"
          disabled={submitting || resolving}
        >
          {submitting ? 'Sending code…' : 'Continue'}
        </Button>

        <div className="mt-6 px-3.5 py-3 bg-surface-2 rounded-[10px] flex gap-2.5 items-start">
          <Icon name="shield" size={14} className="text-ink-3 mt-0.5" />
          <div className="text-[11.5px] text-ink-3 leading-relaxed">
            We use your number only to send queue updates. Stored securely; not shared with third parties.
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
