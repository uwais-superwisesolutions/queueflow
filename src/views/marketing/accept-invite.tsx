import { useState } from 'react';
import { Icon, Button, Field, TextInput } from '@/components/ui';
import { AuthCard } from './landing';
import { acceptInvite, getMembers, getOrganisation } from '@/services/organisationApi';
import { updatePassword } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';
import { INVITE_PENDING_FLAG } from '@/lib/invite-callback';
import type { MemberRole } from '@/types';

export interface AcceptInviteResult {
  role: MemberRole;
}

interface AcceptInviteScreenProps {
  onSubmit?: (result: AcceptInviteResult) => void;
}

// Two-step wizard:
//   1. password — only shown when the user arrived from Supabase's invite
//      email (sessionStorage flag set by consumeInviteCallback). The user sets
//      their password via /secure/auth/update-password.
//   2. confirm — confirms the email and creates the org_members row via
//      /secure/organisations/accept-invite.
type Step = 'password' | 'confirm';

export function AcceptInviteScreen({ onSubmit }: AcceptInviteScreenProps) {
  const storedEmail = useAuthStore((s) => s.email);
  const userId = useAuthStore((s) => s.userId);
  const setSession = useAuthStore((s) => s.setSession);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const initialStep: Step =
    typeof window !== 'undefined' &&
    sessionStorage.getItem(INVITE_PENDING_FLAG) === '1'
      ? 'password'
      : 'confirm';
  const [step, setStep] = useState<Step>(initialStep);

  if (step === 'password') {
    return (
      <PasswordStep
        onDone={() => {
          sessionStorage.removeItem(INVITE_PENDING_FLAG);
          setStep('confirm');
        }}
      />
    );
  }

  return (
    <ConfirmStep
      storedEmail={storedEmail}
      userId={userId}
      isAuthenticated={isAuthenticated}
      setSession={setSession}
      setOnboardingComplete={setOnboardingComplete}
      onSubmit={onSubmit}
    />
  );
}

function PasswordStep({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword({ password });
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not set your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard width={460}>
      <div
        style={{
          margin: '0 auto 16px',
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="bg-teal-tint text-teal-ink"
      >
        <Icon name="shield" size={26} />
      </div>
      <h2
        style={{
          margin: '0 0 6px',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        Set your password
      </h2>
      <p
        style={{ margin: '0 0 22px', fontSize: 13.5, textAlign: 'center', lineHeight: 1.55 }}
        className="text-ink-3"
      >
        Choose a password to finish setting up your QueueFlow account.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="New password" hint="At least 8 characters.">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
        </Field>
        <Field label="Confirm password">
          <TextInput
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          full
          onClick={handleSubmit}
          iconRight="arrowR"
          disabled={submitting || !password || !confirm}
          style={{ marginTop: 4 }}
        >
          {submitting ? 'Saving…' : 'Set password & continue'}
        </Button>
      </div>
    </AuthCard>
  );
}

interface ConfirmStepProps {
  storedEmail: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setSession: ReturnType<typeof useAuthStore.getState>['setSession'];
  setOnboardingComplete: ReturnType<typeof useAuthStore.getState>['setOnboardingComplete'];
  onSubmit?: (result: AcceptInviteResult) => void;
}

function ConfirmStep({
  storedEmail,
  userId,
  isAuthenticated,
  setSession,
  setOnboardingComplete,
  onSubmit,
}: ConfirmStepProps) {
  const [email, setEmail] = useState(storedEmail ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('Please sign in via your invitation email before accepting.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await acceptInvite({ email: email.trim() });

      // The Bearer JWT still authenticates the user; subsequent /secure calls
      // will now succeed because the org_members row exists. Refresh local
      // session info from the server.
      const orgResp = await getOrganisation();
      const membersResp = await getMembers();
      const me = membersResp.data.find((m) => m.authUserId === userId);

      setSession({
        accessToken: localStorage.getItem('token') ?? '',
        refreshToken: '',
        expiresIn: 0,
        userId: userId ?? '',
        email: email.trim(),
        fullName: me?.fullName ?? '',
        organisationId: orgResp.data.id,
        organisationName: orgResp.data.name,
        orgMemberId: me?.orgMemberId ?? null,
        role: me?.role ?? 'org_user',
      });
      setOnboardingComplete(orgResp.data.onboardingComplete);

      onSubmit?.({ role: me?.role ?? 'org_user' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not accept the invitation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard width={460}>
      <div
        style={{
          margin: '0 auto 16px',
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="bg-teal-tint text-teal-ink"
      >
        <Icon name="send" size={26} />
      </div>
      <h2
        style={{
          margin: '0 0 6px',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        You've been invited to QueueFlow
      </h2>
      <p
        style={{ margin: '0 0 22px', fontSize: 13.5, textAlign: 'center', lineHeight: 1.55 }}
        className="text-ink-3"
      >
        Confirm the email that received your invitation to join your team.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Invitation email">
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@clinic.com"
            icon="send"
          />
        </Field>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          full
          onClick={handleSubmit}
          iconRight="arrowR"
          disabled={submitting || !email.trim()}
          style={{ marginTop: 4 }}
        >
          {submitting ? 'Joining…' : 'Accept invite & continue'}
        </Button>
      </div>
      <p style={{ margin: '16px 0 0', fontSize: 11.5, textAlign: 'center' }} className="text-ink-4">
        Make sure you're already signed in via the link from your invitation email.
      </p>
    </AuthCard>
  );
}
