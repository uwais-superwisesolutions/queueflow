import { Button, Field, TextInput } from '@/components/ui';
import { AuthCard } from './landing';

interface LoginScreenProps {
  onSubmit?: () => void;
  onSignUp?: () => void;
  onClientPortal?: () => void;
}

export function LoginScreen({ onSubmit, onSignUp, onClientPortal }: LoginScreenProps) {
  return (
    <AuthCard
      footer={
        <>
          <div>
            New here?{' '}
            <a onClick={onSignUp} className="text-teal-ink cursor-pointer font-medium">Start a free trial</a>
          </div>
          <div className="mt-1 text-ink-3">
            Joining a queue as a client?{' '}
            <a onClick={onClientPortal} className="text-teal-ink cursor-pointer font-medium">Go to client portal →</a>
          </div>
        </>
      }
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Welcome back</h2>
      <p style={{ margin: '0 0 22px', fontSize: 13.5 }} className="text-ink-3">
        Sign in to your QueueFlow account.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <TextInput defaultValue="amara@bryanstonfp.co.za" />
        </Field>
        <Field label="Password">
          <TextInput type="password" defaultValue="••••••••••" />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }} className="text-ink-2">
            <input type="checkbox" defaultChecked /> Remember me on this device
          </label>
          <a style={{ fontSize: 12.5 }} className="text-teal-ink cursor-pointer">Forgot password</a>
        </div>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR">Sign in</Button>
      </div>
    </AuthCard>
  );
}
