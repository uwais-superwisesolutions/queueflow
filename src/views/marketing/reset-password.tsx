import { useState } from 'react';
import { Button, Field, Icon, TextInput } from '@/components/ui';
import { AuthCard } from './landing';
import { updatePassword } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import { RECOVERY_PENDING_FLAG } from '@/lib/invite-callback';
import { getApiErrorMessage } from '@/lib/api-error';

interface ResetPasswordScreenProps {
  /** Called once the new password is saved — route wrapper sends user to /login. */
  onDone?: () => void;
}

/**
 * Landing screen for Supabase's password-recovery email link. The hash
 * fragment was already consumed by `consumeRecoveryCallback` during bootstrap,
 * which stored the recovery JWT in localStorage. We just need to collect a
 * new password and POST it to /secure/auth/update-password.
 */
export function ResetPasswordScreen({ onDone }: ResetPasswordScreenProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const clearAuth = useAuthStore((s) => s.clear);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // If the user arrives at /reset-password without a recovery token in
  // localStorage (e.g. typed the URL manually), there's nothing to do.
  const hasRecoverySession =
    typeof window !== 'undefined' &&
    (sessionStorage.getItem(RECOVERY_PENDING_FLAG) === '1' || isAuthenticated);

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
      sessionStorage.removeItem(RECOVERY_PENDING_FLAG);
      // The recovery JWT is short-lived and scoped to this flow — clear the
      // local auth state so the user signs in fresh with their new password.
      clearAuth();
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthCard>
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
          <Icon name="check" size={26} />
        </div>
        <h2
          style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center' }}
        >
          Password updated
        </h2>
        <p
          style={{ margin: '0 0 22px', fontSize: 13.5, textAlign: 'center', lineHeight: 1.55 }}
          className="text-ink-3"
        >
          Sign in with your new password to continue.
        </p>
        <Button variant="primary" size="lg" full onClick={() => onDone?.()} iconRight="arrowR">
          Go to sign-in
        </Button>
      </AuthCard>
    );
  }

  if (!hasRecoverySession) {
    return (
      <AuthCard>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Reset link expired or missing
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
          Open the most recent password-reset email and click the link again, or request a new one from the sign-in page.
        </p>
        <Button variant="primary" full onClick={() => onDone?.()} iconRight="arrowR">
          Back to sign-in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Set a new password
      </h2>
      <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
        Choose a new password to finish signing back in.
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
        <Field label="Confirm new password">
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
        >
          {submitting ? 'Saving…' : 'Update password'}
        </Button>
      </div>
    </AuthCard>
  );
}
