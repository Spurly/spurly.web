import { useState } from 'react';
import { KeyRound, MailCheck, Smartphone, Phone } from 'lucide-react';
import { Input, Button } from 'src/core/primitives';
import { CHECKPOINT_TYPES } from '../../constants/constants.js';
import { Countdown, FieldShell } from './parts.jsx';

/**
 * Step 2 — whatever LinkedIn asked for after the password: an authenticator
 * code, a code by email/SMS, an approval in the LinkedIn app, or a phone number.
 */

const CHECKPOINT_COPY = {
  [CHECKPOINT_TYPES.TWO_FA]: {
    Icon: KeyRound,
    title: 'Enter your verification code',
    body: 'Open your authenticator app and enter the 6-digit code it shows for LinkedIn.',
    label: 'Authenticator code',
  },
  [CHECKPOINT_TYPES.OTP]: {
    Icon: MailCheck,
    title: 'Check your email or phone',
    body: 'LinkedIn just sent a verification code to the email address or phone number on your account.',
    label: 'Verification code',
  },
  [CHECKPOINT_TYPES.IN_APP]: {
    Icon: Smartphone,
    title: 'Approve on your phone',
    body: 'Open the LinkedIn app and tap “Yes, it’s me” on the sign-in request. If LinkedIn emailed you instead, approving from that email works too.',
  },
  [CHECKPOINT_TYPES.PHONE]: {
    Icon: Phone,
    title: 'Add a phone number',
    body: 'LinkedIn wants a phone number on this account before it lets you sign in. It will text a code to it next.',
  },
};

function CodeForm({ formId, type, busy, onSubmit, invalid }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const copy = CHECKPOINT_COPY[type];
  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    const clean = code.replace(/\s+/g, '');
    if (!clean) {
      setError('Enter the code.');
      return;
    }
    onSubmit(clean);
  };
  return (
    <form id={formId} onSubmit={submit} noValidate>
      <FieldShell id="li-code" label={copy.label} error={error}>
        <Input
          id="li-code"
          name="code"
          size="lg"
          mono
          fullWidth
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          placeholder="• • • • • •"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          invalid={invalid || Boolean(error)}
          disabled={busy}
          autoFocus
          className="[&_input]:text-center [&_input]:tracking-[0.4em] [&_input]:text-[length:var(--ui-t-heading)]"
        />
      </FieldShell>
    </form>
  );
}

function PhoneForm({ formId, busy, onSubmit }) {
  const [dial, setDial] = useState('+91');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    const cleanDial = dial.replace(/[^\d]/g, '');
    const cleanNumber = number.replace(/[^\d]/g, '');
    if (!cleanDial || cleanNumber.length < 6) {
      setError('Enter the country code and the full phone number.');
      return;
    }
    // The provider's format: international dialling code in brackets.
    onSubmit(`(+${cleanDial})${cleanNumber}`);
  };
  return (
    <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[96px_1fr] gap-2">
        <FieldShell id="li-dial" label="Code">
          <Input id="li-dial" fullWidth mono inputMode="tel" value={dial} onChange={(e) => setDial(e.target.value)} disabled={busy} />
        </FieldShell>
        <FieldShell id="li-phone" label="Phone number">
          <Input
            id="li-phone"
            type="tel"
            fullWidth
            mono
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={number}
            onChange={(e) => { setNumber(e.target.value); setError(''); }}
            invalid={Boolean(error)}
            disabled={busy}
            autoFocus
          />
        </FieldShell>
      </div>
      {error && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error}</p>}
    </form>
  );
}

function WaitingForApproval() {
  return (
    <div role="status" className="flex items-center gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-3.5">
      <span className="relative grid place-items-center w-9 h-9 shrink-0">
        <span className="absolute inset-0 rounded-full bg-[var(--ui-accent-tint)] animate-ping" aria-hidden="true" />
        <span className="relative grid place-items-center w-9 h-9 rounded-full bg-[var(--ui-accent-tint)]">
          <Smartphone size={17} style={{ color: 'var(--ui-accent)' }} />
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Waiting for your approval…</span>
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">This updates by itself the moment you approve.</span>
      </span>
    </div>
  );
}

export function CheckpointStep({ formId, checkpoint, busy, onSubmitCode, onResend, onTryAnotherWay, codeInvalid }) {
  const type = checkpoint?.type;
  const copy = CHECKPOINT_COPY[type] ?? CHECKPOINT_COPY[CHECKPOINT_TYPES.OTP];
  const { Icon } = copy;
  const isApproval = type === CHECKPOINT_TYPES.IN_APP;
  const isPhone = type === CHECKPOINT_TYPES.PHONE;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-[var(--ui-accent-tint)]">
          <Icon size={19} style={{ color: 'var(--ui-accent)' }} />
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[length:var(--ui-t-title)] font-semibold text-[var(--ui-text-primary)]">{copy.title}</p>
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-[1.5]">{copy.body}</p>
          <div className="mt-1"><Countdown expiresAt={checkpoint?.expiresAt} /></div>
        </div>
      </div>

      {isApproval && <WaitingForApproval />}
      {isPhone && <PhoneForm formId={formId} busy={Boolean(busy)} onSubmit={onSubmitCode} />}
      {!isApproval && !isPhone && (
        <CodeForm key={type} formId={formId} type={type} busy={Boolean(busy)} onSubmit={onSubmitCode} invalid={codeInvalid} />
      )}

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mr-1">
          {isApproval ? 'No notification?' : isPhone ? 'Can’t add a number?' : 'Didn’t get it?'}
        </span>
        {!isPhone && (
          <Button variant="link" size="sm" onClick={onResend} disabled={Boolean(busy)}>
            {busy === 'resend' ? 'Sending…' : isApproval ? 'Send it again' : 'Resend code'}
          </Button>
        )}
        {!isPhone && <span className="text-[var(--ui-text-quaternary)]" aria-hidden="true">·</span>}
        <Button variant="link" size="sm" onClick={onTryAnotherWay} disabled={Boolean(busy)}>
          {busy === 'another' ? 'Switching…' : 'Try another way'}
        </Button>
      </div>
    </div>
  );
}

export default CheckpointStep;
