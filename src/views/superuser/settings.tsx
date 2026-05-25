/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Field, Icon, Modal, SelectInput, TextInput, useConfirm } from '@/components/ui';
import { fmtDate } from '@/lib/date';
import { TopBar } from '@/components/layout';
import type { OrganisationResponse, PublicHolidayResponse } from '@/types';
import { getOrganisation, updateBranding } from '@/services/organisationApi';
import {
  createPublicHoliday,
  deletePublicHoliday,
  listPublicHolidays,
} from '@/services/publicHolidayApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';
import { EmptyState, FormSkeleton, ListSkeleton, SectionError } from './shared';

export function SettingsView() {
  return (
    <>
      <TopBar title="Settings" subtitle="Organization-level configuration." />
      <div className="flex-1 overflow-auto qf-page qf-scroll max-w-[880px]">
        <BrandingSection />
        <div className="h-5" />
        <PublicHolidaysSection />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────
// Branding
// ─────────────────────────────────────────────────

function BrandingSection() {
  const [org, setOrg] = useState<OrganisationResponse | null>(null);
  const [industry, setIndustry] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const setOrganisationName = useAuthStore((s) => s.setOrganisationName);

  // Build the timezone option list once. `Intl.supportedValuesOf` is the
  // canonical API but isn't on every runtime — fall back to a short list
  // covering the main regions if not present.
  const timezoneOptions = useMemo<string[]>(() => {
    const supported =
      (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof supported === 'function') {
      try { return supported('timeZone'); } catch { /* fall through */ }
    }
    return [
      'UTC',
      'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Lagos',
      'Europe/London', 'Europe/Berlin', 'Europe/Paris',
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
      'Australia/Sydney',
    ];
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await getOrganisation();
        setOrg(resp.data);
        setIndustry(resp.data.industry ?? '');
        setLogoUrl(resp.data.logoUrl ?? '');
        setBrandColor(resp.data.brandColor ?? '');
        setTimezone(resp.data.timezone || 'UTC');
        setOrganisationName(resp.data.name);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not load organisation.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [setOrganisationName]);

  const save = async () => {
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      const resp = await updateBranding({
        industry: industry || '',
        logoUrl: logoUrl || '',
        brandColor: brandColor || '',
        timezone: timezone || 'UTC',
      });
      setOrg(resp.data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save branding.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding={0}>
      <div className="px-[18px] py-[14px] border-b border-line flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[14px] font-medium">Branding</h2>
        <span className="text-[12px] text-ink-3">How your organisation appears in QueueFlow.</span>
      </div>
      <div className="p-[18px]">
        <SectionError message={error} />
        {loading ? (
          <FormSkeleton rows={4} />
        ) : (
          <>
            <div className="qf-two-col gap-4">
              <Field label="Organisation name" hint="Set during signup. Contact support to change.">
                <TextInput value={org?.name ?? ''} disabled />
              </Field>
              <Field label="Industry">
                <TextInput
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. healthcare"
                />
              </Field>
            </div>
            <div className="h-3" />
            <Field label="Logo URL" hint="Square logo, served from a public URL.">
              <TextInput
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
              />
            </Field>
            <div className="h-3" />
            <Field label="Brand color" hint="Pick a color or paste a hex value like #0F6E56. Used as accent in client portal.">
              <div className="flex items-center gap-2.5 min-w-0">
                <TextInput
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#0F6E56"
                  wrapClassName="flex-1"
                />
                <label
                  className="w-9 h-9 rounded-[8px] flex-none border border-line cursor-pointer relative overflow-hidden"
                  style={{ background: brandColor || 'var(--surface-2)' }}
                  aria-label="Pick brand color"
                  title="Pick a color"
                >
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : '#0f6e56'}
                    onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer border-0 p-0 m-0"
                  />
                </label>
              </div>
            </Field>
            <div className="h-3" />
            <Field
              label="Timezone"
              hint="Availability hours are interpreted in this zone. Clients still see slots in their own local time."
            >
              <SelectInput
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={timezoneOptions}
              />
            </Field>
            <div className="flex flex-wrap items-center mt-4 gap-3">
              {saved && (
                <span className="text-[12.5px] text-success inline-flex items-center gap-1.5">
                  <Icon name="check" size={12} /> Saved
                </span>
              )}
              <span className="flex-1" />
              <Button variant="primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// Public holidays
// ─────────────────────────────────────────────────

function PublicHolidaysSection() {
  const currentYear = new Date().getFullYear();
  const [holidays, setHolidays] = useState<PublicHolidayResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(currentYear);
  const [showModal, setShowModal] = useState(false);
  const confirm = useConfirm();

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listPublicHolidays(year);
      setHolidays([...resp.data].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load public holidays.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [year]);

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this public holiday?',
      body: 'Org users will be bookable again on this date.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await deletePublicHoliday(id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete holiday.'));
    }
  };

  return (
    <Card padding={0}>
      <div className="px-[18px] py-[14px] border-b border-line flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[14px] font-medium">Public holidays</h2>
        <span className="text-[12px] text-ink-3">
          Days when nobody in {`the org`} is available. Overrides individual availability.
        </span>
        <span className="flex-1" />
        <div className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="border-0 bg-transparent p-1 cursor-pointer text-ink-3 rounded hover:bg-surface-2"
            aria-label="Previous year"
          >
            <Icon name="chevronL" size={14} />
          </button>
          <span className="mono tnum text-[12.5px] text-ink-2 w-10 text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="border-0 bg-transparent p-1 cursor-pointer text-ink-3 rounded hover:bg-surface-2"
            aria-label="Next year"
          >
            <Icon name="chevronR" size={14} />
          </button>
        </div>
        <Button variant="secondary" size="sm" icon="plus" onClick={() => setShowModal(true)}>
          Add holiday
        </Button>
      </div>

      <div className="p-2">
        <SectionError message={error} />
        {loading && holidays.length === 0 ? (
          <ListSkeleton rows={4} />
        ) : holidays.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={`No holidays for ${year}`}
            body="Add the public holidays your team observes. Bookings won't be offered on these dates."
            action={
              <Button variant="primary" icon="plus" onClick={() => setShowModal(true)}>
                Add holiday
              </Button>
            }
          />
        ) : (
          <div>
            {holidays.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center gap-3 px-3 py-2.5 ${
                  i < holidays.length - 1 ? 'border-b border-line' : ''
                }`}
              >
                <span className="w-9 h-9 rounded-[8px] bg-surface-2 text-ink-3 inline-flex items-center justify-center flex-none">
                  <Icon name="calendar" size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{h.name}</div>
                  <div className="mono text-[11.5px] text-ink-3">
                    {fmtDate(h.date)}
                  </div>
                </div>
                <button
                  aria-label="Delete"
                  onClick={() => remove(h.id)}
                  className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublicHolidayModal
        open={showModal}
        defaultYear={year}
        onClose={() => setShowModal(false)}
        onSaved={async () => {
          setShowModal(false);
          await reload();
        }}
      />
    </Card>
  );
}

function PublicHolidayModal({
  open,
  defaultYear,
  onClose,
  onSaved,
}: {
  open: boolean;
  defaultYear: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDate('');
      setName('');
      setError(null);
      setSubmitting(false);
    } else {
      setDate(`${defaultYear}-01-01`);
    }
  }, [open, defaultYear]);

  const submit = async () => {
    if (!date) {
      setError('Pick a date.');
      return;
    }
    if (!name.trim()) {
      setError('Holiday name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPublicHoliday({ date, name: name.trim() });
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add holiday.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add public holiday"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Youth Day"
            autoFocus
          />
        </Field>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
