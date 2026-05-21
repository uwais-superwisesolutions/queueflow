import { useState } from 'react';
import { Button, Field, TextInput } from '@/components/ui';
import { AuthCard } from './landing';
import { forgotPassword, login } from '@/services/authApi';
import { getOrganisation } from '@/services/organisationApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';
import type { MemberRole } from '@/types';

export interface LoginResult {
  role: MemberRole | null;
  onboardingComplete: boolean;
}

interface LoginScreenProps {
  onSubmit?: (result: LoginResult) => void;
  onSignUp?: () => void;
  onClientPortal?: () => void;
}

export function LoginScreen({ onSubmit, onSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const handleForgot = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?" again.');
      return;
    }
    setError(null);
    setResetSent(false);
    setResetSending(true);
    try {
      await forgotPassword({ email: email.trim() });
      setResetSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send reset email.'));
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const loginResp = await login({ email: email.trim(), password });
      setSession(loginResp.data);

      let onboardingComplete = false;
      if (loginResp.data.role) {
        // Member of an org — pull the latest onboarding state.
        try {
          const orgResp = await getOrganisation();
          onboardingComplete = orgResp.data.onboardingComplete;
          setOnboardingComplete(onboardingComplete);
        } catch {
          // If the org call fails for any reason, fall through with onboardingComplete=false
          // so the user lands on the wizard rather than a broken dashboard.
        }
      }

      onSubmit?.({ role: loginResp.data.role, onboardingComplete });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign-in failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      footer={
        <div>
          New here?{' '}
          <a onClick={onSignUp} className="text-teal-ink cursor-pointer font-medium">Create an account</a>
        </div>
      }
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Welcome back</h2>
      <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
        Sign in to your QueueFlow account.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
          />
        </Field>
        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <a
            onClick={resetSending ? undefined : handleForgot}
            style={{ fontSize: 12.5, opacity: resetSending ? 0.5 : 1 }}
            className="text-teal-ink cursor-pointer"
          >
            {resetSending ? 'Sending…' : 'Forgot password?'}
          </a>
        </div>
        {resetSent && (
          <div className="text-[12.5px] text-ink-2 bg-surface-2 border border-line rounded-[8px] px-3 py-2.5">
            If that email is registered, we've sent a reset link. Check your inbox.
          </div>
        )}
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
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </AuthCard>
  );
}
