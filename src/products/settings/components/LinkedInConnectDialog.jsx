import { useState } from 'react';
import { Linkedin, ShieldCheck, Smartphone, Eye, EyeOff } from 'lucide-react';
import { Dialog, Button, Field } from 'src/core/primitives';
import { CHECKPOINT_TYPES } from '../constants/constants.js';

/**
 * Our own LinkedIn sign-in, replacing the provider's hosted page as the
 * default. Drive it with useLinkedInConnect(); `onUseHosted` opens the hosted
 * page, offered only when the native flow cannot finish (`connect.offerHosted`).
 *
 * The password lives in this component's state only while the dialog is open,
 * goes to the server once, and is cleared as soon as it has been sent.
 */

const COPY = {
  [CHECKPOINT_TYPES.TWO_FA]: {
    title: 'Enter your verification code',
    body: 'Open your authenticator app and enter the 6-digit code for LinkedIn.',
    label: 'Verification code',
  },
  [CHECKPOINT_TYPES.OTP]: {
    title: 'Check your email or phone',
    body: 'LinkedIn sent a verification code to the email or phone number on your account. Enter it below.',
    label: 'Verification code',
  },
  [CHECKPOINT_TYPES.IN_APP]: {
    title: 'Approve the sign-in',
    body: 'Open the LinkedIn app on your phone and tap “Yes” to approve this sign-in. If LinkedIn emailed you instead, approving from that email works too.',
  },
  [CHECKPOINT_TYPES.PHONE]: {
    title: 'Add a phone number',
    body: 'LinkedIn wants a phone number on this account before it lets you sign in. It will send a code to it next.',
  },
};

function Message({ tone, children }) {
  if (!children) return null;
  const color = tone === 'error' ? 'var(--ui-danger-fg)' : 'var(--ui-text-secondary)';
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className="text-[length:var(--ui-t-body)]" style={{ color }}>
      {children}
    </p>
  );
}

function CredentialsStep({ busy, onSubmit, formId }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (busy || !username.trim() || !password) return;
    onSubmit({ username: username.trim(), password });
    // Not kept around after it has been sent. A retry means typing it again.
    setPassword('');
  };

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4" autoComplete="on">
      <Field
        label="Email or phone"
        type="text"
        inputMode="email"
        name="username"
        autoComplete="username"
        placeholder="you@company.com"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={busy}
        autoFocus
        required
      />
      <div className="flex flex-col gap-1.5">
        <Field
          label="Password"
          type={show ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Your LinkedIn password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
        />
        <Button
          variant="link"
          size="sm"
          className="self-start"
          onClick={() => setShow((s) => !s)}
          leadingIcon={show ? <EyeOff size={13} /> : <Eye size={13} />}
        >
          {show ? 'Hide password' : 'Show password'}
        </Button>
      </div>
      <p className="flex gap-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
        <ShieldCheck size={15} className="shrink-0 mt-px" style={{ color: 'var(--ui-success)' }} />
        <span>
          Spurly never stores your password. It is used once, over an encrypted connection, to sign in to LinkedIn.
        </span>
      </p>
    </form>
  );
}

function CodeStep({ type, busy, onSubmit, formId }) {
  const [code, setCode] = useState('');
  const copy = COPY[type];
  const submit = (event) => {
    event.preventDefault();
    if (busy || !code.trim()) return;
    onSubmit(code.trim());
  };
  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{copy.body}</p>
      <Field
        label={copy.label}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={busy}
        autoFocus
        required
      />
    </form>
  );
}

function PhoneStep({ busy, onSubmit, formId }) {
  const [dial, setDial] = useState('+91');
  const [number, setNumber] = useState('');
  const submit = (event) => {
    event.preventDefault();
    const cleanDial = `+${dial.replace(/[^\d]/g, '')}`;
    const cleanNumber = number.replace(/[^\d]/g, '');
    if (busy || cleanDial.length < 2 || cleanNumber.length < 5) return;
    // The provider's format: international dialling code in brackets.
    onSubmit(`(${cleanDial})${cleanNumber}`);
  };
  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{COPY[CHECKPOINT_TYPES.PHONE].body}</p>
      <div className="grid grid-cols-[88px_1fr] gap-2">
        <Field
          label="Code"
          name="dial"
          inputMode="tel"
          value={dial}
          onChange={(e) => setDial(e.target.value)}
          disabled={busy}
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="9876543210"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          disabled={busy}
          autoFocus
          required
        />
      </div>
    </form>
  );
}

function ApprovalStep() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{COPY[CHECKPOINT_TYPES.IN_APP].body}</p>
      <div
        className="flex items-center gap-3 rounded-[var(--ui-radius-md)] p-3"
        style={{ background: 'var(--ui-surface-sunken)' }}
      >
        <Smartphone size={18} style={{ color: 'var(--ui-text-tertiary)' }} />
        <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">Waiting for your approval…</span>
        <span
          className="ml-auto shrink-0 rounded-full border-[1.5px] border-[var(--ui-text-tertiary)] border-r-transparent animate-spin"
          style={{ width: 14, height: 14 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function LinkedInConnectDialog({ connect, onUseHosted, hostedBusy = false }) {
  const formId = 'linkedin-connect-form';
  const { open, step, checkpointType, busy, error, notice, offerHosted } = connect;

  const onCheckpoint = step === 'checkpoint';
  const isApproval = onCheckpoint && checkpointType === CHECKPOINT_TYPES.IN_APP;
  const isPhone = onCheckpoint && checkpointType === CHECKPOINT_TYPES.PHONE;
  const canResend = onCheckpoint && !isPhone;
  const title = onCheckpoint ? (COPY[checkpointType]?.title ?? 'Verify it’s you') : 'Connect LinkedIn';
  const description = onCheckpoint
    ? null
    : 'Sign in with the email and password you use on LinkedIn.';

  const primaryLabel = (() => {
    if (!onCheckpoint) return busy === 'signin' ? 'Signing in…' : 'Connect';
    if (isPhone) return busy === 'code' ? 'Sending…' : 'Continue';
    return busy === 'code' ? 'Verifying…' : 'Verify';
  })();

  const footer = (
    <>
      <Button variant="ghost" onClick={connect.closeDialog}>Cancel</Button>
      {!isApproval && (
        <Button
          variant="primary"
          type="submit"
          form={formId}
          disabled={Boolean(busy)}
          loading={busy === 'signin' || busy === 'code'}
          leadingIcon={onCheckpoint ? null : <Linkedin size={15} />}
        >
          {primaryLabel}
        </Button>
      )}
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={connect.closeDialog}
      title={title}
      description={description}
      size="md"
      footer={footer}
      // A stray click outside must not throw away a half-finished verification.
      closeOnBackdrop={false}
    >
      <div className="flex flex-col gap-4">
        {!onCheckpoint && (
          <CredentialsStep busy={Boolean(busy)} onSubmit={connect.signIn} formId={formId} />
        )}
        {onCheckpoint && (checkpointType === CHECKPOINT_TYPES.TWO_FA || checkpointType === CHECKPOINT_TYPES.OTP) && (
          <CodeStep key={checkpointType} type={checkpointType} busy={Boolean(busy)} onSubmit={connect.submitCode} formId={formId} />
        )}
        {isPhone && <PhoneStep busy={Boolean(busy)} onSubmit={connect.submitCode} formId={formId} />}
        {isApproval && <ApprovalStep />}

        {busy === 'signin' && (
          <Message tone="info">Signing in to LinkedIn. This can take up to a minute — keep this window open.</Message>
        )}
        <Message tone="info">{notice}</Message>
        <Message tone="error">{error}</Message>

        {onCheckpoint && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {canResend && (
              <Button variant="link" size="sm" onClick={connect.resend} disabled={Boolean(busy)}>
                {busy === 'resend' ? 'Sending…' : isApproval ? 'Resend notification' : 'Resend code'}
              </Button>
            )}
            <Button variant="link" size="sm" onClick={connect.tryAnotherWay} disabled={Boolean(busy)}>
              {busy === 'another' ? 'Switching…' : 'Try another way'}
            </Button>
          </div>
        )}

        {offerHosted && onUseHosted && (
          <div
            className="flex flex-col gap-2 rounded-[var(--ui-radius-md)] p-3"
            style={{ background: 'var(--ui-surface-sunken)' }}
          >
            <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              Having trouble? You can sign in on LinkedIn’s secure sign-in page instead.
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={onUseHosted}
              disabled={hostedBusy}
            >
              {hostedBusy ? 'Opening…' : 'Use the secure sign-in page'}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default LinkedInConnectDialog;
