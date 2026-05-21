import { useState } from 'react';
import { Button, Field, TextInput, SelectInput } from '@/components/ui';
import { AuthCard } from './landing';
import { signUp } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';

interface SignUpScreenProps {
  onSubmit?: () => void;
  onSignIn?: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  industry: string;
  orgName: string;
}

const INITIAL_FORM: FormState = {
  firstName: 'Thandi',
  lastName: 'Mbeki',
  email: 'thandi@bryanstonfp.co.za',
  password: '',
  industry: 'Healthcare',
  orgName: 'Bryanston Family Practice',
};

export function SignUpScreen({ onSubmit, onSignIn }: SignUpScreenProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) =>
      setForm((prev) => ({ ...prev, [k]: typeof e === 'string' ? e : e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await signUp({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        orgName: form.orgName.trim(),
        industry: form.industry || null,
      });
      setSession(response.data);
      onSubmit?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      footer={
        <>
          Already have an account?{' '}
          <a onClick={onSignIn} className="text-teal-ink cursor-pointer font-medium">Sign in</a>
        </>
      }
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Create your account</h2>
      <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
        Set up your organisation and invite your team.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="qf-two-col" style={{ gap: 12 }}>
          <Field label="First name">
            <TextInput value={form.firstName} onChange={set('firstName')} placeholder="First name" />
          </Field>
          <Field label="Last name">
            <TextInput value={form.lastName} onChange={set('lastName')} placeholder="Last name" />
          </Field>
        </div>
        <Field label="Work email" hint="We'll use this for your login.">
          <TextInput value={form.email} onChange={set('email')} placeholder="name@clinic.com" icon="send" />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <TextInput type="password" value={form.password} onChange={set('password')} placeholder="••••••••••" />
        </Field>
        <div className="qf-two-col" style={{ gap: 12 }}>
          <Field label="Industry">
            <SelectInput
              value={form.industry}
              onChange={set('industry')}
              options={['Healthcare', 'Dental', 'Salon / Spa', 'Government', 'Veterinary', 'Other']}
            />
          </Field>
          <Field label="Organization">
            <TextInput value={form.orgName} onChange={set('orgName')} />
          </Field>
        </div>
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
          style={{ marginTop: 6 }}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </div>
      <p style={{ margin: '18px 0 0', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }} className="text-ink-4">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </AuthCard>
  );
}
