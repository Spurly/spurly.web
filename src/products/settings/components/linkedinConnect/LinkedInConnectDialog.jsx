import { useEffect, useRef } from 'react';
import { ArrowLeft, Linkedin } from 'lucide-react';
import { CloseIcon } from 'src/core/icons';
import { Overlay, Button, IconButton } from 'src/core/primitives';
import { BrandBridge, Stepper, ConnectAlert, Working } from './parts.jsx';
import { SignInForm } from './SignInForm.jsx';
import { CheckpointStep } from './CheckpointStep.jsx';
import { SuccessStep } from './SuccessStep.jsx';

/**
 * Spurly's own LinkedIn sign-in — replaces the provider's hosted page as the
 * default. Drive it with useLinkedInConnect().
 *
 *   form        email + password or li_at cookie, plus sync & location
 *   checkpoint  2FA / emailed code / app approval / phone number
 *   success     who is connected, and what happens next
 *
 * `onUseHosted` opens the provider's hosted page; offered only when the native
 * flow cannot finish (`connect.offerHosted`), never as the first choice.
 */

const FORM_ID = 'linkedin-connect-form';
const STEP_INDEX = { form: 0, checkpoint: 1, success: 2 };

const HEADINGS = {
  form: {
    title: 'Connect your LinkedIn',
    sub: 'Spurly sends, syncs and tracks outreach from your own LinkedIn account.',
  },
  checkpoint: {
    title: 'Verify it’s you',
    sub: 'LinkedIn wants to confirm this sign-in. This is normal for a new device.',
  },
  success: {
    title: 'You’re all set',
    sub: 'Spurly can now work from your LinkedIn account.',
  },
};

export function LinkedInConnectDialog({ connect, onUseHosted, hostedBusy = false }) {
  const { open, step, checkpoint, busy, error, notice, offerHosted, options, connectedAccount } = connect;
  const heading = HEADINGS[step] ?? HEADINGS.form;
  const bodyRef = useRef(null);

  // A new problem is shown at the top of the step; bring it into view, since
  // the submit button that caused it sits at the bottom of a scrolling body.
  useEffect(() => {
    if (error && bodyRef.current) bodyRef.current.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [error]);
  const isApproval = step === 'checkpoint' && checkpoint?.type === 'IN_APP_VALIDATION';

  // During a sign-in a stray Escape must not throw away a half-finished verification.
  const midFlow = step === 'checkpoint' || Boolean(busy);

  const footer = (() => {
    if (step === 'success') {
      return <Button variant="primary" onClick={connect.closeDialog}>Done</Button>;
    }
    if (step === 'checkpoint') {
      return (
        <>
          <Button
            variant="ghost"
            onClick={connect.startOver}
            disabled={Boolean(busy)}
            leadingIcon={<ArrowLeft size={15} />}
            className="mr-auto"
          >
            Use a different account
          </Button>
          {!isApproval && (
            <Button variant="primary" type="submit" form={FORM_ID} loading={busy === 'code'} disabled={Boolean(busy)}>
              {busy === 'code' ? 'Verifying…' : checkpoint?.type === 'PHONE_REGISTER' ? 'Continue' : 'Verify'}
            </Button>
          )}
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" onClick={connect.closeDialog} disabled={busy === 'signin'}>Cancel</Button>
        <Button
          variant="primary"
          type="submit"
          form={FORM_ID}
          loading={busy === 'signin'}
          disabled={Boolean(busy)}
          leadingIcon={<Linkedin size={15} />}
        >
          {busy === 'signin' ? 'Signing in…' : 'Connect LinkedIn'}
        </Button>
      </>
    );
  })();

  return (
    <Overlay
      open={open}
      onClose={connect.closeDialog}
      label="Connect your LinkedIn account"
      closeOnBackdrop={false}
      closeOnEscape={!midFlow}
      panelClassName="w-full max-w-[520px] max-h-[calc(100vh-3rem)] rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-modal)] overflow-hidden"
    >
      <div className="relative shrink-0 px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3 border-b border-[var(--ui-neutral-150)] bg-[var(--ui-surface-header)]">
        <IconButton
          size="sm"
          variant="ghost"
          label="Close"
          icon={<CloseIcon size={15} strokeWidth={2.2} />}
          onClick={connect.closeDialog}
          disabled={busy === 'signin'}
          className="!absolute top-3 right-3 !w-7 !h-7 !text-[var(--ui-text-quaternary)]"
        />
        <BrandBridge done={step === 'success'} />
        <div className="flex flex-col gap-1">
          <h2 className="text-[length:var(--ui-t-figure)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)]">
            {heading.title}
          </h2>
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] max-w-[380px]">{heading.sub}</p>
        </div>
        <Stepper current={STEP_INDEX[step] ?? 0} />
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {step !== 'success' && (
          <ConnectAlert error={error} offerHosted={offerHosted} onUseHosted={onUseHosted} hostedBusy={hostedBusy} />
        )}
        {step === 'form' && (
          <SignInForm
            formId={FORM_ID}
            busy={busy}
            onSubmit={connect.signIn}
            detectedCountry={options?.detectedCountry}
            serverError={error}
          />
        )}
        {step === 'checkpoint' && (
          <CheckpointStep
            formId={FORM_ID}
            checkpoint={checkpoint}
            busy={busy}
            onSubmitCode={connect.submitCode}
            onResend={connect.resend}
            onTryAnotherWay={connect.tryAnotherWay}
            codeInvalid={error?.code === 'INVALID_CODE'}
          />
        )}
        {step === 'success' && <SuccessStep account={connectedAccount} />}

        {busy === 'signin' && (
          <Working title="Signing in to LinkedIn…" detail="This can take up to a minute. Keep this window open." />
        )}
        {busy === 'code' && <Working title="Checking with LinkedIn…" />}
        {notice && !error && (
          <p role="status" className="text-[length:var(--ui-t-body)] text-[var(--ui-success-fg)]">{notice}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-3.5 shrink-0 border-t border-[var(--ui-neutral-150)] bg-[var(--ui-surface-header)]">
        {footer}
      </div>
    </Overlay>
  );
}

export default LinkedInConnectDialog;
