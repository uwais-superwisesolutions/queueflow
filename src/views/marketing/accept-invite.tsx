import { Icon, Button, Field, TextInput, Pill, Avatar } from '@/components/ui';
import { AuthCard } from './landing';

interface AcceptInviteScreenProps {
  onSubmit?: () => void;
}

export function AcceptInviteScreen({ onSubmit }: AcceptInviteScreenProps) {
  return (
    <AuthCard width={460}>
      <div style={{
        margin: '0 auto 16px', width: 64, height: 64, borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} className="bg-teal-tint text-teal-ink">
        <Icon name="send" size={26} />
      </div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center' }}>
        You've been invited to QueueFlow
      </h2>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, textAlign: 'center', lineHeight: 1.55 }} className="text-ink-3">
        <span className="text-ink-2">Thandi Mbeki</span> invited you to join
        {' '}<b className="text-ink">Bryanston Family Practice</b>{' '}
        as a Consultant.
      </p>

      <div style={{
        padding: '10px 12px', marginBottom: 18,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }} className="bg-surface-2 border border-line">
        <Avatar name="Sipho Dlamini" size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Sipho Dlamini</div>
          <div style={{ fontSize: 11.5 }} className="text-ink-3">sipho@bryanstonfp.co.za · Org user</div>
        </div>
        <Pill tone="amber">Pending</Pill>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Set a password" hint="At least 10 characters, mixing letters and numbers.">
          <TextInput type="password" placeholder="••••••••••" />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" placeholder="••••••••••" />
        </Field>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR" style={{ marginTop: 4 }}>
          Accept invite &amp; sign in
        </Button>
      </div>
      <p style={{ margin: '16px 0 0', fontSize: 11.5, textAlign: 'center' }} className="text-ink-4">
        You'll be asked to claim a seat to start your first shift.
      </p>
    </AuthCard>
  );
}
