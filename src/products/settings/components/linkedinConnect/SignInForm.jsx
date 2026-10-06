import { useState } from 'react';
import { Mail, KeyRound, Eye, EyeOff, Cookie, ChevronDown, MapPin, Globe, Server, MessagesSquare } from 'lucide-react';
import { Input, IconButton, SwitchRow, Switch, Dropdown } from 'src/core/primitives';
import { PROXY_COUNTRIES, countryName } from '../../constants/constants.js';
import { FieldShell, TrustRow } from './parts.jsx';

/**
 * Step 1 of the LinkedIn connect dialog: how to sign in (email + password, or
 * a pasted li_at session cookie) and the optional sync + location settings —
 * the same choices the provider's hosted page offers.
 *
 * Owns its own field state. Secrets are cleared as soon as they are sent; a
 * retry means typing them again, which is the point.
 */

const METHODS = [
  { id: 'credentials', label: 'Email & password', Icon: Mail },
  { id: 'cookies', label: 'Session cookie', Icon: Cookie },
];

/** 🇮🇳 from "IN" — regional-indicator letters, so no flag assets to ship. */
function flag(code) {
  return /^[A-Z]{2}$/.test(code ?? '')
    ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '';
}

const COUNTRY_OPTIONS = PROXY_COUNTRIES.map((c) => [c.code, `${flag(c.code)}  ${c.name}`]);
const PROTOCOL_OPTIONS = [['http', 'HTTP'], ['https', 'HTTPS'], ['socks5', 'SOCKS5']];

/** "Chrome on macOS" from a user-agent string — enough to recognise the browser. */
function describeBrowser(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'This browser';
  const os = /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

/** A segmented control built on radios, so arrow keys and screen readers work for free. */
function MethodPicker({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="How to sign in" className="grid grid-cols-2 gap-1 p-1 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)]">
      {METHODS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <label
            key={id}
            className={[
              'flex items-center justify-center gap-2 h-9 rounded-[var(--ui-radius-sm)] cursor-pointer select-none',
              'text-[length:var(--ui-t-body)] transition-[background-color,box-shadow,color] duration-[var(--ui-dur-fast)]',
              'has-[:focus-visible]:shadow-[var(--ui-focus-ring)]',
              active
                ? 'bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] text-[var(--ui-text-primary)] font-medium'
                : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]',
              disabled ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            <input
              type="radio"
              name="linkedin-method"
              value={id}
              checked={active}
              disabled={disabled}
              onChange={() => onChange(id)}
              className="sr-only"
            />
            <Icon size={15} />
            {label}
          </label>
        );
      })}
    </div>
  );
}

function LocationChoice({ id, value, current, onChange, Icon, title, detail, disabled, children }) {
  const active = current === value;
  return (
    <div
      className="rounded-[var(--ui-radius-md)] border transition-colors duration-[var(--ui-dur-fast)]"
      style={{
        borderColor: active ? 'var(--ui-accent-border)' : 'var(--ui-border)',
        background: active ? 'var(--ui-accent-wash)' : 'var(--ui-surface-card)',
      }}
    >
      <label htmlFor={id} className={`flex items-start gap-3 p-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          id={id}
          type="radio"
          name="linkedin-location"
          value={value}
          checked={active}
          disabled={disabled}
          onChange={() => onChange(value)}
          className="mt-1 accent-[var(--ui-accent)]"
        />
        <Icon size={16} className="mt-0.5 shrink-0" style={{ color: active ? 'var(--ui-accent)' : 'var(--ui-text-tertiary)' }} />
        <span className="min-w-0 flex flex-col gap-0.5">
          <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{title}</span>
          {detail && <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{detail}</span>}
        </span>
      </label>
      {active && children && <div className="px-3 pb-3 pl-[52px]">{children}</div>}
    </div>
  );
}

function Advanced({ state, set, detectedCountry, errors, disabled, serverField }) {
  const [open, setOpen] = useState(serverField?.startsWith('proxy') || serverField === 'country');
  const where = state.location === 'proxy'
    ? 'Own proxy'
    : state.location === 'country'
      ? (state.country ? countryName(state.country) : 'Choose a country')
      : detectedCountry ? `Automatic (${countryName(detectedCountry)})` : 'Automatic';
  const sync = state.syncChats && state.syncMessages
    ? 'Full history'
    : !state.syncChats && !state.syncMessages ? 'No history' : 'Partial history';

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="group rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]"
    >
      <summary className="flex items-center gap-2 px-3.5 py-3 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="flex-1 min-w-0">
          <span className="block text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Sync & location</span>
          <span className="block text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] truncate">
            {sync} · {where}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[var(--ui-text-tertiary)] transition-transform group-open:rotate-180" />
      </summary>

      <div className="flex flex-col gap-5 px-3.5 pb-4 pt-1 border-t border-[var(--ui-neutral-150)]">
        <section className="flex flex-col gap-2 pt-3">
          <h3 className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] font-medium uppercase tracking-[var(--ui-track-meta)] text-[var(--ui-text-tertiary)]">
            <MessagesSquare size={13} /> Messaging history
          </h3>
          <SwitchRow
            title="Sync conversations"
            hint="Bring your existing LinkedIn conversations into Spurly’s Inbox."
            checked={state.syncChats}
            onChange={(v) => set({ syncChats: v })}
            disabled={disabled}
          />
          <SwitchRow
            title="Sync message history"
            hint="Include the older messages inside each conversation."
            checked={state.syncMessages}
            onChange={(v) => set({ syncMessages: v })}
            disabled={disabled}
          />
          {(!state.syncChats || !state.syncMessages) && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              New messages still arrive in your Inbox — only older history is skipped. You can’t change this later without reconnecting.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] font-medium uppercase tracking-[var(--ui-track-meta)] text-[var(--ui-text-tertiary)]">
            <MapPin size={13} /> Sign in from
          </h3>
          <LocationChoice
            id="loc-auto"
            value="auto"
            current={state.location}
            onChange={(v) => set({ location: v })}
            Icon={MapPin}
            title="Automatic"
            detail={detectedCountry
              ? `${countryName(detectedCountry)} — matches where you are now. Recommended.`
              : 'Matches where you are now. Recommended.'}
            disabled={disabled}
          />
          <LocationChoice
            id="loc-country"
            value="country"
            current={state.location}
            onChange={(v) => set({ location: v })}
            Icon={Globe}
            title="A specific country"
            detail="Pick the country you usually use LinkedIn from."
            disabled={disabled}
          >
            <FieldShell id="li-country" error={errors.country}>
              <Dropdown
                id="li-country"
                variant="dashboard"
                ariaLabel="Country"
                icon={<Globe size={15} />}
                placeholder="Choose a country"
                value={state.country}
                options={COUNTRY_OPTIONS}
                onChange={(v) => set({ country: v })}
                error={Boolean(errors.country)}
                disabled={disabled}
              />
            </FieldShell>
          </LocationChoice>
          <LocationChoice
            id="loc-proxy"
            value="proxy"
            current={state.location}
            onChange={(v) => set({ location: v })}
            Icon={Server}
            title="My own proxy"
            detail="For teams that route LinkedIn through a dedicated IP."
            disabled={disabled}
          >
            <div className="grid grid-cols-[110px_1fr_90px] gap-2">
              <FieldShell id="li-proxy-protocol" label="Protocol" error={errors.proxyProtocol}>
                <Dropdown
                  id="li-proxy-protocol"
                  variant="dashboard"
                  ariaLabel="Proxy protocol"
                  value={state.proxyProtocol}
                  options={PROTOCOL_OPTIONS}
                  onChange={(v) => set({ proxyProtocol: v })}
                  error={Boolean(errors.proxyProtocol)}
                  disabled={disabled}
                />
              </FieldShell>
              <FieldShell id="li-proxy-host" label="Host" error={errors.proxyHost}>
                <Input
                  id="li-proxy-host"
                  fullWidth
                  mono
                  placeholder="proxy.example.com"
                  value={state.proxyHost}
                  onChange={(e) => set({ proxyHost: e.target.value })}
                  invalid={Boolean(errors.proxyHost)}
                  disabled={disabled}
                  autoComplete="off"
                />
              </FieldShell>
              <FieldShell id="li-proxy-port" label="Port" error={errors.proxyPort}>
                <Input
                  id="li-proxy-port"
                  fullWidth
                  mono
                  inputMode="numeric"
                  placeholder="8080"
                  value={state.proxyPort}
                  onChange={(e) => set({ proxyPort: e.target.value.replace(/[^\d]/g, '') })}
                  invalid={Boolean(errors.proxyPort)}
                  disabled={disabled}
                />
              </FieldShell>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <FieldShell id="li-proxy-user" label="Username" optional>
                <Input
                  id="li-proxy-user"
                  fullWidth
                  value={state.proxyUser}
                  onChange={(e) => set({ proxyUser: e.target.value })}
                  disabled={disabled}
                  autoComplete="off"
                />
              </FieldShell>
              <FieldShell id="li-proxy-pass" label="Password" optional>
                <Input
                  id="li-proxy-pass"
                  type="password"
                  fullWidth
                  value={state.proxyPass}
                  onChange={(e) => set({ proxyPass: e.target.value })}
                  disabled={disabled}
                  autoComplete="new-password"
                />
              </FieldShell>
            </div>
            {errors.proxy?.trim() && (
              <p className="mt-2 text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{errors.proxy}</p>
            )}
          </LocationChoice>
        </section>
      </div>
    </details>
  );
}

const INITIAL = {
  method: 'credentials',
  username: '',
  password: '',
  accessToken: '',
  premiumToken: '',
  usePremium: false,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  editUserAgent: false,
  syncChats: true,
  syncMessages: true,
  location: 'auto',
  country: '',
  proxyProtocol: 'http',
  proxyHost: '',
  proxyPort: '',
  proxyUser: '',
  proxyPass: '',
};

/** Client-side checks, so obvious slips are caught in place instead of by LinkedIn. */
function validate(state) {
  const errors = {};
  if (state.method === 'credentials') {
    if (!state.username.trim()) errors.username = 'Enter the email or phone number you sign in to LinkedIn with.';
    if (!state.password) errors.password = 'Enter your LinkedIn password.';
  } else {
    const token = state.accessToken.trim().replace(/^li_at\s*=\s*/i, '').replace(/^["']|["']$/g, '');
    if (!token) errors.accessToken = 'Paste your li_at cookie value.';
    else if (/[\s;,]/.test(token) || token.length < 20) errors.accessToken = 'Paste only the li_at Value — not the whole cookie line.';
    if (state.usePremium && !state.premiumToken.trim()) errors.premiumToken = 'Paste your li_a cookie value, or turn this off.';
  }
  if (state.location === 'country' && !state.country) errors.country = 'Choose a country.';
  if (state.location === 'proxy') {
    if (!state.proxyHost.trim()) errors.proxyHost = 'Required';
    const port = Number(state.proxyPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.proxyPort = '1–65535';
  }
  return errors;
}

/** Form state -> the request body the server expects. */
function toInput(state) {
  const input = {
    method: state.method,
    sync: { chats: state.syncChats, messages: state.syncMessages },
    location: state.location === 'proxy'
      ? {
        mode: 'proxy',
        proxy: {
          protocol: state.proxyProtocol,
          host: state.proxyHost.trim(),
          port: Number(state.proxyPort),
          username: state.proxyUser.trim() || undefined,
          password: state.proxyPass || undefined,
        },
      }
      : state.location === 'country'
        ? { mode: 'country', country: state.country }
        : { mode: 'auto' },
  };
  if (state.method === 'cookies') {
    input.accessToken = state.accessToken.trim();
    if (state.usePremium) input.premiumToken = state.premiumToken.trim();
    input.userAgent = state.userAgent.trim();
  } else {
    input.username = state.username.trim();
    input.password = state.password;
  }
  return input;
}

export function SignInForm({ formId, busy, onSubmit, detectedCountry, serverError }) {
  const [state, setState] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const set = (patch) => {
    setState((s) => ({ ...s, ...patch }));
    // Editing a field clears its own complaint.
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => { delete next[k]; });
      return next;
    });
  };

  // A server complaint about one field shows on that field, too.
  const serverField = serverError?.field;
  const fieldErrors = { ...errors };
  if (serverField && !fieldErrors[serverField] && serverError?.code !== 'INVALID_CREDENTIALS') {
    fieldErrors[serverField] = ' ';
  }
  const invalid = (k) => Boolean(fieldErrors[k]) || (serverError?.code === 'INVALID_CREDENTIALS' && (k === 'username' || k === 'password'));

  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    const found = validate(state);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit(toInput(state));
    // Secrets are not kept once sent.
    setState((s) => ({ ...s, password: '', accessToken: '', premiumToken: '', proxyPass: '' }));
  };

  const disabled = Boolean(busy);
  const shownError = (k) => (errors[k] && errors[k].trim() ? errors[k] : null);

  return (
    <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
      <MethodPicker value={state.method} onChange={(m) => { set({ method: m }); setErrors({}); }} disabled={disabled} />

      {state.method === 'credentials' ? (
        <>
          <FieldShell id="li-username" label="Email or phone" error={shownError('username')}>
            <Input
              id="li-username"
              name="username"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="you@company.com"
              fullWidth
              leadingIcon={<Mail size={15} />}
              value={state.username}
              onChange={(e) => set({ username: e.target.value })}
              invalid={invalid('username')}
              disabled={disabled}
              autoFocus
            />
          </FieldShell>
          <FieldShell id="li-password" label="LinkedIn password" error={shownError('password')}>
            <Input
              id="li-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your LinkedIn password"
              fullWidth
              leadingIcon={<KeyRound size={15} />}
              trailingSlot={(
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  onClick={() => setShowPassword((v) => !v)}
                  className="!w-7 !h-7"
                />
              )}
              value={state.password}
              onChange={(e) => set({ password: e.target.value })}
              invalid={invalid('password')}
              disabled={disabled}
            />
          </FieldShell>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] -mt-1">
            If you have two-step verification on, LinkedIn will ask for a code next — that’s expected.
          </p>
        </>
      ) : (
        <>
          <FieldShell
            id="li-cookie"
            label="li_at cookie"
            error={shownError('accessToken')}
            hint="Your LinkedIn session, copied from the browser you’re signed in on."
          >
            <textarea
              id="li-cookie"
              name="accessToken"
              rows={3}
              spellCheck={false}
              autoComplete="off"
              placeholder="AQEDAR…"
              value={state.accessToken}
              onChange={(e) => set({ accessToken: e.target.value })}
              disabled={disabled}
              aria-invalid={invalid('accessToken') || undefined}
              className={[
                'w-full px-3 py-2 bg-[var(--ui-surface-card)] border rounded-[var(--ui-radius-btn)] resize-none break-all',
                'font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)]',
                'placeholder:text-[var(--ui-text-quaternary)] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)]',
                invalid('accessToken') ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
              ].join(' ')}
            />
          </FieldShell>

          <details className="group rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)]">
            <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer list-none select-none text-[length:var(--ui-t-body)] text-[var(--ui-accent-fg)] [&::-webkit-details-marker]:hidden">
              How do I find my li_at cookie?
              <ChevronDown size={15} className="ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <ol className="list-decimal pl-8 pr-3 pb-3 flex flex-col gap-1.5 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              <li>Open <span className="font-medium text-[var(--ui-text-primary)]">linkedin.com</span> in this browser and make sure you’re signed in.</li>
              <li>Open Developer Tools — <span className="font-[family-name:var(--ui-font-mono)]">F12</span>, or <span className="font-[family-name:var(--ui-font-mono)]">⌥⌘I</span> on a Mac.</li>
              <li>Go to <span className="font-medium text-[var(--ui-text-primary)]">Application → Cookies → https://www.linkedin.com</span>.</li>
              <li>Find <span className="font-[family-name:var(--ui-font-mono)]">li_at</span>, double-click its <span className="font-medium text-[var(--ui-text-primary)]">Value</span>, copy it and paste it above.</li>
              <li className="list-none -ml-5 mt-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
                Signing out of LinkedIn in that browser ends this session, so use a browser you stay signed in on.
              </li>
            </ol>
          </details>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">I use Sales Navigator or Recruiter</span>
            <Switch checked={state.usePremium} onChange={(v) => set({ usePremium: v })} disabled={disabled} label="I use Sales Navigator or Recruiter" />
          </div>
          {state.usePremium && (
            <FieldShell id="li-premium" label="li_a cookie" error={shownError('premiumToken')} hint="Found next to li_at. Needed for Sales Navigator and Recruiter.">
              <Input
                id="li-premium"
                fullWidth
                mono
                autoComplete="off"
                placeholder="AQJ…"
                value={state.premiumToken}
                onChange={(e) => set({ premiumToken: e.target.value })}
                invalid={invalid('premiumToken')}
                disabled={disabled}
              />
            </FieldShell>
          )}

          <div className="flex flex-col gap-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                Browser: <span className="text-[var(--ui-text-primary)] font-medium">{describeBrowser(state.userAgent)}</span>
                <span className="text-[var(--ui-text-tertiary)]"> — must be the browser the cookie came from</span>
              </span>
              <IconButton
                size="sm"
                variant="ghost"
                label={state.editUserAgent ? 'Hide user agent' : 'Edit user agent'}
                icon={<ChevronDown size={14} className={state.editUserAgent ? 'rotate-180' : ''} />}
                onClick={() => set({ editUserAgent: !state.editUserAgent })}
              />
            </div>
            {state.editUserAgent && (
              <Input
                id="li-ua"
                fullWidth
                mono
                size="sm"
                aria-label="User agent"
                value={state.userAgent}
                onChange={(e) => set({ userAgent: e.target.value })}
                disabled={disabled}
              />
            )}
          </div>
        </>
      )}

      <Advanced
        state={state}
        set={set}
        detectedCountry={detectedCountry}
        errors={fieldErrors}
        disabled={disabled}
        serverField={serverField}
      />

      <TrustRow secret={state.method === 'cookies' ? 'cookie' : 'password'} />
    </form>
  );
}

export default SignInForm;
