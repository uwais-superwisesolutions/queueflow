/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, Icon, Button, Pill, Field, TextInput } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { listMyTimeslotTypes, listTimeslotTypes, optInTimeslotType, optOutTimeslotType } from '@/services/timeslotTypeApi'
import { listNotifications } from '@/services/notificationApi'
import { updateMyProfile } from '@/services/meApi'
import { getApiErrorMessage } from '@/lib/api-error'
import { agoLabel } from '@/lib/time'
import { POLL_INTERVAL_MS } from '@/lib/realtime-channels'
import { describeNotification } from '@/lib/notification-display'
import { usePolling } from '@/hooks/use-polling'
import type { NotificationResponse, TimeslotTypeResponse } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { OrgUserQueueScreen } from './live-queue'
import { AvailabilityView } from './availability'
import type { SidebarNavItem } from '@/types'

interface OrgUserDashboardProps {
  initialPage?: string
  onSignOut?: () => void
  onClaimSeat?: () => void
  /** Super users impersonating an org user can flip back to the SU dashboard. */
  onPersona?: (persona: string) => void
}

const ORG_NAV: SidebarNavItem[] = [
  { id: 'queue', label: 'Queue', icon: 'users' },
  { id: 'availability', label: 'My availability', icon: 'calendar' },
  { id: 'timeconfig', label: 'Enable Services', icon: 'clock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { heading: 'Account' },
  { id: 'profile', label: 'Profile', icon: 'user' },
]

export function OrgUserDashboard({ initialPage = 'queue', onSignOut, onClaimSeat, onPersona }: OrgUserDashboardProps) {
  const orgName = useAuthStore((s) => s.organisationName)
  const [active, setActive] = useState(initialPage)
  const navigate = useNavigate()

  const navItems = useMemo(() => ORG_NAV, [])

  const handleSelect = (id: string) => {
    setActive(id)
    if (id === 'queue') navigate('/queue')
    if (id === 'availability') navigate('/availability')
    if (id === 'timeconfig') navigate('/timeconfig')
    if (id === 'notifications') navigate('/notifications')
    if (id === 'profile') navigate('/profile')
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar items={navItems} active={active} onSelect={handleSelect} orgName={orgName ?? undefined} />
      <main className="flex-1 min-w-0 flex flex-col">
        {active === 'queue' && (
          <OrgUserQueueScreen
            onShiftEnded={() => onClaimSeat?.()}
            onSignOut={onSignOut}
            onPersona={onPersona}
          />
        )}
        {active === 'availability' && <AvailabilityView />}
        {active === 'timeconfig' && <TimeConfigView />}
        {active === 'notifications' && <NotificationsView />}
        {active === 'profile' && <ProfileView />}
      </main>
    </div>
  )
}

function TimeConfigView() {
  const [all, setAll] = useState<TimeslotTypeResponse[]>([])
  const [mine, setMine] = useState<TimeslotTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allRes, mineRes] = await Promise.all([listTimeslotTypes(), listMyTimeslotTypes()])
      setAll(allRes.data)
      setMine(mineRes.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load services.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const mineIds = useMemo(() => new Set(mine.map((t) => t.id)), [mine])

  const toggle = async (t: TimeslotTypeResponse) => {
    setError(null)
    setPendingId(t.id)
    try {
      if (mineIds.has(t.id)) {
        await optOutTimeslotType(t.id)
      } else {
        await optInTimeslotType(t.id)
      }
      await reload()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update service.'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <TopBar
        title="Enable Services"
        subtitle="Choose which services you accept for your seat."
        breadcrumb={['Dashboard', 'Enable Services']}
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <Card padding={0} className="max-w-[720px]">
          {error && (
            <div className="px-4 pt-3 text-[12.5px] text-coral" role="alert">
              <Icon name="alert" size={12} /> {error}
            </div>
          )}
          {loading && all.length === 0 ? (
            <div className="px-4 py-4 text-[12.5px] text-ink-3">Loading services…</div>
          ) : all.length === 0 ? (
            <div className="px-4 py-5 text-[12.5px] text-ink-3 text-center">
              Your super user hasn't added any services yet.
            </div>
          ) : (
            all.map((t, i) => {
              const isOn = mineIds.has(t.id)
              return (
                <div
                  key={t.id}
                  className={
                    i < all.length - 1
                      ? 'px-4 py-3 border-b border-line flex items-center gap-3'
                      : 'px-4 py-3 flex items-center gap-3'
                  }
                >
                  <span
                    className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-white flex-none"
                    style={{ background: t.color ?? '#0f6e56' }}
                  >
                    <Icon name="clock" size={12} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{t.name}</div>
                    <div className="text-[12px] text-ink-3">{t.durationMinutes} min · org-wide</div>
                  </div>
                  {!t.isActive && <Pill tone="neutral">Hidden</Pill>}
                  <Button
                    variant={isOn ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggle(t)}
                    disabled={pendingId === t.id}
                    icon={isOn ? 'check' : 'plus'}
                  >
                    {isOn ? 'Offering' : 'Offer this'}
                  </Button>
                </div>
              )
            })
          )}
        </Card>
        <p className="text-[12.5px] text-ink-3 mt-3">
          Only super users can add or edit timeslot types.
        </p>
      </div>
    </>
  )
}

function NotificationsView() {
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await listNotifications({ limit: 50 })
      setItems(res.data)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load notifications.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  usePolling(load, POLL_INTERVAL_MS.notifications)

  return (
    <>
      <TopBar title="Notifications" />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <Card padding={0} className="max-w-[720px]">
          {error && (
            <div className="px-4 py-3 text-[12.5px] text-coral border-b border-line" role="alert">
              <Icon name="alert" size={12} /> {error}
            </div>
          )}
          {loading && items.length === 0 ? (
            <div className="px-4 py-4 text-[12.5px] text-ink-3">Loading notifications…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-5 text-[12.5px] text-ink-3 text-center">
              No notifications yet. They'll appear here as bookings move through your queue.
            </div>
          ) : (
            items.map((n, i) => (
              <NotificationRow key={n.id} notification={n} divider={i < items.length - 1} />
            ))
          )}
        </Card>
      </div>
    </>
  )
}

function NotificationRow({
  notification,
  divider,
}: {
  notification: NotificationResponse
  divider: boolean
}) {
  const { tone, title } = describeNotification(notification.notificationType)
  const ms = Date.now() - new Date(notification.createdAt).getTime()
  const showStatusPill =
    notification.status === 'failed' || notification.status === 'pending'

  return (
    <div
      className={
        divider
          ? 'px-4 py-3 border-b border-line flex gap-2.5'
          : 'px-4 py-3 flex gap-2.5'
      }
    >
      <FeedKindBadge tone={tone} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[12.5px] font-medium truncate">{title}</div>
          {showStatusPill && (
            <Pill tone={notification.status === 'failed' ? 'coral' : 'amber'}>
              {notification.status}
            </Pill>
          )}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-0.5">{notification.body}</div>
        <div className="text-[11px] text-ink-4 mt-1">{agoLabel(ms)}</div>
      </div>
    </div>
  )
}

function ProfileView() {
  const storedFullName = useAuthStore((s) => s.fullName)
  const storedEmail = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role) ?? 'org_user'
  const setProfile = useAuthStore((s) => s.setProfile)

  const [fullName, setFullName] = useState(storedFullName ?? '')
  const [email, setEmail] = useState(storedEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirty =
    fullName.trim() !== (storedFullName ?? '').trim() ||
    email.trim() !== (storedEmail ?? '').trim()

  const handleSave = async () => {
    setError(null)
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Email is not valid.')
      return
    }
    setSaving(true)
    try {
      const res = await updateMyProfile({
        fullName: fullName.trim(),
        email: email.trim(),
      })
      setProfile({ fullName: res.data.fullName, email: res.data.email })
      setSavedAt(Date.now())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="Profile" />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <Card padding={0} className="max-w-[720px]">
          <div className="px-4 py-4 border-b border-line flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-surface-2 flex items-center justify-center">
              <Icon name="user" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium truncate">{storedFullName ?? 'Org user'}</div>
              <div className="text-[12px] text-ink-3 truncate">{storedEmail ?? '—'}</div>
            </div>
            <Pill tone="neutral">{role === 'super_user' ? 'Super user' : 'Org user'}</Pill>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <Field label="Full name">
              <TextInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </Field>
            {error && (
              <div className="text-[12.5px] text-coral" role="alert">
                <Icon name="alert" size={12} /> {error}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || !dirty}
                icon={saving ? undefined : 'check'}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {savedAt && !dirty && !saving && (
                <span className="text-[12px] text-ink-3">Saved.</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

function FeedKindBadge({ tone }: { tone: 'coral' | 'amber' | 'blue' }) {
  const map = {
    coral: { icon: 'alert', bg: 'var(--coral-tint)', fg: 'var(--coral-2)' },
    amber: { icon: 'bell', bg: 'var(--amber-tint)', fg: 'var(--amber)' },
    blue: { icon: 'info', bg: 'var(--blue-tint)', fg: 'var(--blue)' },
  } as const
  const m = map[tone]
  return (
    <span
      className="inline-flex items-center justify-center rounded-[6px] flex-none"
      style={{ width: 22, height: 22, background: m.bg, color: m.fg }}
    >
      <Icon name={m.icon} size={12} />
    </span>
  )
}
