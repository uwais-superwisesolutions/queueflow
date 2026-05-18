import { useState } from 'react';
import { Button, Field, TextInput, SelectInput } from '@/components/ui';
import { AuthCard } from './landing';

interface SignUpScreenProps {
  onSubmit?: () => void;
  onSignIn?: () => void;
}

export function SignUpScreen({ onSubmit, onSignIn }: SignUpScreenProps) {
  const [form, setForm] = useState({
    name: 'Thandi Mbeki',
    email: 'thandi@bryanstonfp.co.za',
    password: '',
    industry: 'Healthcare',
    org: 'Bryanston Family Practice',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) =>
    setForm({ ...form, [k]: typeof e === 'string' ? e : e.target.value });

  return (
    <AuthCard
      footer={
        <>
          Already have an account?{' '}
          <a onClick={onSignIn} className="text-teal-ink cursor-pointer font-medium">Sign in</a>
        </>
      }
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Start your free trial</h2>
      <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
        14 days free. No card required.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Full name">
          <TextInput value={form.name} onChange={set('name')} placeholder="Your name" />
        </Field>
        <Field label="Work email" hint="We'll use this for your login.">
          <TextInput value={form.email} onChange={set('email')} placeholder="name@clinic.com" icon="send" />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <TextInput type="password" value={form.password} onChange={set('password')} placeholder="••••••••••" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Industry">
            <SelectInput
              value={form.industry}
              onChange={set('industry')}
              options={['Healthcare', 'Dental', 'Salon / Spa', 'Government', 'Veterinary', 'Other']}
            />
          </Field>
          <Field label="Organization">
            <TextInput value={form.org} onChange={set('org')} />
          </Field>
        </div>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR" style={{ marginTop: 6 }}>
          Create account
        </Button>
      </div>
      <p style={{ margin: '18px 0 0', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }} className="text-ink-4">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </AuthCard>
  );
}
