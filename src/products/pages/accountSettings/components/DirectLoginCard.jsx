import { Button, Input } from 'src/core/primitives';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { useDirectLoginSetup } from 'src/products/accountSettings/hooks/useDirectLoginSetup.js';
import { DIRECT_LOGIN_COPY as c, DIRECT_LOGIN_STEPS } from 'src/core/directLogin/constants/constants.js';

function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">
      {children}
    </label>
  );
}

const body = 'text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]';

/**
 * Settings -> Account, partner-managed accounts only: set up (or see) a direct
 * login — the person's own email + password, confirmed with an emailed code.
 */
export function DirectLoginCard() {
  const s = useDirectLoginSetup();

  if (s.hasDirectLogin) {
    return (
      <SectionCard title={c.title}>
        <div className="flex flex-col gap-2">
          <p className={body}>{c.ready(s.user?.email || '')}</p>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">{c.forgot}</p>
        </div>
      </SectionCard>
    );
  }

  if (s.step === DIRECT_LOGIN_STEPS.CODE) {
    return (
      <SectionCard title={c.title}>
        <form onSubmit={s.confirmCode} className="flex flex-col gap-4">
          <p className={body}>{c.codeIntro(s.sentTo)}</p>
          <div className="max-w-[220px]">
            <FieldLabel htmlFor="direct-login-code">{c.codeLabel}</FieldLabel>
            <Input
              id="direct-login-code"
              fullWidth
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={s.code}
              onChange={(e) => s.setCode(e.target.value.replace(/\D/g, ''))}
              disabled={s.busy}
              className="[&>input]:w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" disabled={!s.canConfirm}>
              {s.busy ? c.confirming : c.confirm}
            </Button>
            <Button type="button" variant="ghost" onClick={s.sendCode} disabled={s.busy}>{c.resend}</Button>
            <Button type="button" variant="ghost" onClick={s.backToForm} disabled={s.busy}>{c.back}</Button>
          </div>
        </form>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={c.title}>
      <form onSubmit={s.sendCode} className="flex flex-col gap-4">
        <p className={body}>{c.intro}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel htmlFor="direct-login-email">{c.emailLabel}</FieldLabel>
            <Input id="direct-login-email" fullWidth type="email" autoComplete="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} disabled={s.busy} maxLength={254} className="[&>input]:w-full" />
          </div>
          <div>
            <FieldLabel htmlFor="direct-login-password">{c.passwordLabel}</FieldLabel>
            <Input id="direct-login-password" fullWidth type="password" autoComplete="new-password" value={s.password} onChange={(e) => s.setPassword(e.target.value)} disabled={s.busy} maxLength={128} className="[&>input]:w-full" />
          </div>
          <div>
            <FieldLabel htmlFor="direct-login-confirm">{c.confirmLabel}</FieldLabel>
            <Input id="direct-login-confirm" fullWidth type="password" autoComplete="new-password" value={s.confirmPassword} onChange={(e) => s.setConfirmPassword(e.target.value)} disabled={s.busy} maxLength={128} className="[&>input]:w-full" />
          </div>
        </div>
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">{c.passwordHint}</p>
        <div>
          <Button type="submit" variant="primary" disabled={!s.canSend}>
            {s.busy ? c.sending : c.sendCode}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default DirectLoginCard;
