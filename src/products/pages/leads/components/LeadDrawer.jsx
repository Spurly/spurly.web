import { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, GraduationCap, Users, UserX } from 'lucide-react';
import { Avatar, Badge, Button, Drawer, Skeleton, SoonTag } from 'src/core/primitives';
import { LinkedInIcon, SparkIcon } from 'src/core/icons';
import { absoluteTime } from 'src/shared/utils/outreach';
import { leadStatus, formatFollowers } from './columns.jsx';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import leadController from 'src/products/leads/controller/lead.js';
import { LEAD_EVENTS } from 'src/products/leads/constants/constants.js';

/**
 * Hub's lead detail drawer — Phase 6, 1a/1b.
 *
 * A small local drawer, styled with the same `--ui-*` tokens everything else
 * uses, built specifically around a HubLead's shape (see
 * UNIPILE_MODULE_PLAN.md §0 / [[unipile_api_module]]) rather than reusing
 * another page's detail view.
 *
 * ONE PANEL, NOT TABS — for now. The Contacts drawer splits into tabs because
 * it mixes four independently-fetched concerns (profile, contact info,
 * research, outreach activity). Hub currently has two related but still
 * single-panel-sized concerns (the resolved profile, and — once 1c's
 * reconciliation job has run — a pending-invitation banner with a withdraw
 * action). Splitting into tabs is still not worth it yet; add a real
 * invitation TIMELINE (not just current status) before reaching for `Tabs`.
 *
 * THE RESOLVE-ON-OPEN TRIGGER — this is the surface Sarthak chose (2026-09-10)
 * for Phase 6 1a's "resolve once, on open" requirement: opening this drawer
 * is what fires `GET /hub/leads/:id/profile`. The backend is what actually
 * enforces "once" against the VENDOR (it no-ops the Unipile call on an
 * already-resolved lead unless `force` is passed, see resolveLeadProfile) —
 * this component only has to show a loading state while that decision is
 * made server-side, not make the decision itself.
 *
 * ALWAYS fetches on open now, even for a lead that's already resolved —
 * changed 2026-09-16 alongside GET /hub/leads dropping `fullProfile` from
 * its response (see that route's own comment): the list no longer carries
 * enough to render this drawer's Experience/Education/Skills sections on
 * its own, so this is genuinely the only place that data comes from. The
 * "once" guarantee still holds where it matters (never re-hitting Unipile
 * for data already resolved) — this just changed from an in-browser cache
 * to a DB-backed one, an unnoticeable network round trip instead of a free
 * skip.
 *
 * RENDER WITH `key={lead._id}` from the caller. That is what resets
 * `resolved`/`error` state between leads instead of an effect syncing it
 * (which would call setState synchronously on every render and trip
 * react-hooks/set-state-in-effect for no benefit over a remount).
 */

/** Skills/languages arrive as plain strings on the resolved profile blob. */
function ChipList({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="inline-flex items-center h-6 px-2 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="px-5 pt-[22px]">
      {title && <h3 className="ui-micro !text-[var(--ui-text-secondary)] mb-2.5">{title}</h3>}
      {children}
    </section>
  );
}

function HistoryRow({ icon: Icon, primary, secondary, meta }) {
  return (
    <div className="flex gap-2.5">
      <span
        className="grid place-items-center w-7 h-7 shrink-0 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]"
        aria-hidden="true"
      >
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] leading-snug">{primary}</p>
        {secondary && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-snug">{secondary}</p>}
        {meta && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] leading-snug mt-0.5">{meta}</p>}
      </div>
    </div>
  );
}

/** `work_experience`/`education` entries carry `start`/`end` as loose date
 *  strings ("2/1/2014") or null (ongoing) — proven live 2026-09-10, see
 *  [[hub_phase6_kickoff]]. No parsing here, just the raw string either side
 *  of a dash; anything smarter is a guess this data doesn't support yet. */
function dateRange(start, end) {
  if (!start && !end) return null;
  return `${start || '?'} – ${end || 'Present'}`;
}

/**
 * PHASE 6 (1c). Shown only once the reconciliation job has actually looked
 * at this lead (`pendingInvitationId` is set server-side, never guessed
 * client-side — see sourcing/service.js#withdrawInvitation). A lead with a
 * pending invite Hub hasn't reconciled yet shows nothing here; the banner is
 * "here's what we currently know", not "here's what must be true".
 *
 * `source` distinguishes an invite Hub itself sent (already tracked in the
 * outreach log) from one sent through the LinkedIn app or another tool —
 * the whole point of 1c is surfacing the second case before a campaign
 * invites this person again.
 */
function PendingInvitationBanner({ lead, onWithdraw, withdrawing, withdrawError }) {
  if (!lead?.pendingInvitationId) return null;

  return (
    <Section>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">
            Invitation pending
            {lead.pendingInvitationSource === 'external' && (
              <span className="text-[var(--ui-text-tertiary)]"> — sent outside Spurly</span>
            )}
          </p>
          {withdrawError && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)] mt-1">{withdrawError}</p>
          )}
        </div>
        <Button size="sm" variant="ghost" leadingIcon={<UserX size={13} />} onClick={onWithdraw} loading={withdrawing} disabled={withdrawing}>
          Withdraw
        </Button>
      </div>
    </Section>
  );
}

function ResolvedProfilePanel({ lead }) {
  const profile = lead.fullProfile || {};
  const experience = Array.isArray(profile.work_experience) ? profile.work_experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const skills = Array.isArray(profile.skills) ? profile.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) : [];

  return (
    <>
      {profile.summary && (
        <Section title="About">
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-relaxed whitespace-pre-line">
            {profile.summary}
          </p>
        </Section>
      )}

      {(lead.followersCount != null || profile.connections_count != null) && (
        <Section title="Details">
          <dl className="flex flex-col gap-1.5">
            {profile.connections_count != null && (
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">Connections</dt>
                <dd className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] tabular-nums">
                  {profile.connections_count.toLocaleString()}
                </dd>
              </div>
            )}
            {lead.followersCount != null && (
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">Followers</dt>
                <dd className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] tabular-nums">
                  {lead.followersCount.toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          <div className="flex flex-col gap-2.5">
            {experience.map((exp, i) => (
              <HistoryRow
                key={i}
                icon={Briefcase}
                primary={exp.position}
                secondary={exp.company}
                meta={dateRange(exp.start, exp.end)}
              />
            ))}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          <div className="flex flex-col gap-2.5">
            {education.map((edu, i) => (
              <HistoryRow
                key={i}
                icon={GraduationCap}
                primary={edu.school}
                secondary={edu.degree}
                meta={dateRange(edu.start, edu.end)}
              />
            ))}
          </div>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <ChipList items={skills} />
        </Section>
      )}
    </>
  );
}

export function LeadDrawer({ lead, onClose, onResolved }) {
  const [resolved, setResolved] = useState(lead);
  /* Lazy-initialized rather than defaulted to `false` and flipped inside the
     effect: this component is keyed by `lead._id` (see index.jsx), so a new
     lead is a fresh mount, and deciding "will this fetch?" up front keeps
     every setState in this file confined to a promise callback — the
     convention LinkedInSettingsPage's `load()` documents, and the same fix
     for the same react-hooks/set-state-in-effect warning. */
  const [resolving, setResolving] = useState(() => Boolean(lead));
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

  /* Guards a resolve response arriving after the drawer moved to a different
     lead (fast row-clicking) or closed — the same pattern the Contacts page
     uses for its own load effects (see PeoplePage's mountedRef). */
  const requestIdRef = useRef(0);

  /* No `setResolved(lead)` / `setError(null)` reset here on purpose: the
     caller keys this component by `lead._id` (see index.jsx), so picking a
     different row remounts it with fresh state instead of this effect
     syncing it — the same convention LeadDetailSidebar's NotesEditor uses.
     That leaves this effect free to do only what it's actually for: firing
     the resolve fetch. */
  useEffect(() => {
    if (!lead) return undefined;

    const requestId = ++requestIdRef.current;
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.RESOLVE_PROFILE_SUCCESS, (updated) => {
      if (requestIdRef.current !== requestId) return;
      if (updated) {
        setResolved(updated);
        onResolved?.(updated);
      }
      setResolving(false);
    });
    callEmitter.once(LEAD_EVENTS.RESOLVE_PROFILE_FAILURE, (err) => {
      if (requestIdRef.current !== requestId) return;
      // Not a toast: the drawer itself is the place to say this, and a
      // failed resolve should not block reading what the lead list already
      // knew (name, headline, location) — only the extra sections stay empty.
      setError(err?.response?.data?.message || 'Could not load the full profile.');
      setResolving(false);
    });
    leadController.resolveProfile(callEmitter, lead._id);

    return () => { requestIdRef.current += 1; };
    // Deliberately keyed on `lead._id`, not `lead` itself: `onResolved` folds
    // the resolve response back into `selectedLead` as a NEW object with the
    // same `_id` (see useLeadsPage's handleLeadResolved), so depending on the
    // whole `lead` reference here would refire this effect on every resolve,
    // which resolves again, which refires again — an infinite loop of
    // `GET .../profile` calls. The component is already remounted by the
    // caller's `key={lead._id}` when the id actually changes, so `lead._id`
    // is the only piece of this that this effect needs to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?._id, onResolved]);

  const degreeLabel = useMemo(() => ({ 1: '1st', 2: '2nd', 3: '3rd' }[resolved?.connectionDegree] ?? null), [resolved]);

  const handleWithdraw = () => {
    if (withdrawing) return;
    setWithdrawing(true);
    setWithdrawError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(LEAD_EVENTS.WITHDRAW_INVITATION_SUCCESS, (updated) => {
      if (updated) {
        setResolved(updated);
        onResolved?.(updated);
      }
      setWithdrawing(false);
    });
    callEmitter.once(LEAD_EVENTS.WITHDRAW_INVITATION_FAILURE, (err) => {
      setWithdrawError(err?.response?.data?.message || 'Could not withdraw this invitation.');
      setWithdrawing(false);
    });
    leadController.withdrawInvitation(callEmitter, lead._id);
  };

  if (!lead) return null;

  const status = leadStatus(resolved || lead);
  const profileRows = [
    ['Title', resolved?.currentTitle],
    ['Company', resolved?.companyName],
    ['Location', lead.location],
    ['Degree', degreeLabel],
    ['Followers', resolved?.followersCount != null ? formatFollowers(resolved.followersCount) : null],
    ['Status', { connected: 'Connected', invited: 'Invitation pending', new: 'Not contacted' }[status]],
    ['Enrichment', { none: 'Not enriched', queued: 'Queued', enriching: 'Enriching', enriched: 'Enriched', failed: 'Failed' }[resolved?.enrichmentStatus] ?? null],
  ].filter(([, v]) => v);

  const timeline = [
    resolved?.pendingInvitationSentAt && { label: 'Connection request sent', at: resolved.pendingInvitationSentAt, live: true },
    resolved?.profileResolvedAt && { label: 'Full profile resolved', at: resolved.profileResolvedAt },
    (resolved?.createdAt || lead.createdAt) && { label: 'Imported into Spurly', at: resolved?.createdAt || lead.createdAt },
  ].filter(Boolean);

  return (
    <Drawer open onClose={onClose} title={lead.name} eyebrow="Lead" size="md">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-[13px]">
          <Avatar src={lead.profilePictureUrl || null} name={lead.name} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[length:var(--ui-t-heading)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] leading-[1.2]">
              {lead.name}
            </h2>
            <p className="mt-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.4]">
              {lead.headline ||
                [resolved?.currentTitle, resolved?.companyName].filter(Boolean).join(' · ')}
            </p>
          </div>
          {/* Fit reading — the handoff's top-right number. Not built yet. */}
          <div className="text-right shrink-0">
            <div className="ui-num text-[length:var(--ui-t-section)] leading-none text-[var(--ui-text-disabled)]">—</div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)]">Fit</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[7px] mt-4">
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-[7px] h-8 rounded-[var(--ui-radius-btn)] bg-[var(--ui-accent)] text-[var(--ui-accent-on)] text-[length:var(--ui-t-control)] font-medium shadow-[var(--ui-btn-shadow)] hover:bg-[var(--ui-accent-hover)] hover:shadow-[var(--ui-btn-shadow-hover)] transition-[background-color,box-shadow] duration-[var(--ui-dur-fast)]"
          >
            <LinkedInIcon size={13} />
            View on LinkedIn
          </a>
          {lead.isPremium && <Badge tone="accent">Premium</Badge>}
        </div>

        {/* Why this lead + Suggested opener: the handoff's two AI panels.
            Both need the scoring pass (UI_REDESIGN_DEFERRED_FEATURES.md §1),
            so they render in their designed place, marked as coming. */}
        <div className="mt-5 px-4 py-3.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-accent-wash)] border border-[var(--ui-accent-tint-strong)] shadow-[inset_2px_0_0_var(--ui-accent)]">
          <div className="flex items-center gap-[7px] mb-2">
            <SparkIcon size={13} strokeWidth={1.9} className="text-[var(--ui-accent-fg)]" />
            <span className="ui-micro !text-[var(--ui-accent-fg)]">Why this lead</span>
            <SoonTag />
          </div>
          <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] leading-[1.6]">
            Spurly will score every lead against your ICP and explain the score here in a sentence you can overrule.
          </p>
        </div>

        <div className="mt-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-neutral-150)] overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-[13px] py-2.5 border-b border-[var(--ui-border-hairline)] bg-[var(--ui-surface-header)]">
            <span className="ui-micro !text-[var(--ui-text-secondary)]">Suggested opener</span>
            <SoonTag />
          </div>
          <p className="px-[13px] py-[13px] text-[length:var(--ui-t-control)] text-[var(--ui-text-quaternary)] leading-[1.6]">
            A first line drafted from this person&rsquo;s own profile, ready to edit or regenerate.
          </p>
        </div>
      </div>

      {profileRows.length > 0 && (
        <Section title="Profile">
          <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-neutral-150)] overflow-hidden">
            {profileRows.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 px-[13px] py-2.5 border-b border-[var(--ui-border-hairline)] last:border-b-0">
                <span className="w-[104px] shrink-0 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[0.09em] text-[var(--ui-text-secondary)]">
                  {k}
                </span>
                <span className="flex-1 min-w-0 text-right truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resolving && (
        <div className="px-5 pt-5 flex flex-col gap-2">
          <Skeleton width="75%" height={11} />
          <Skeleton width="50%" height={11} />
          <Skeleton width="65%" height={11} />
        </div>
      )}

      {!resolving && error && (
        <Section>
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{error}</p>
        </Section>
      )}

      <PendingInvitationBanner
        lead={resolved}
        onWithdraw={handleWithdraw}
        withdrawing={withdrawing}
        withdrawError={withdrawError}
      />

      {!resolving && !error && <ResolvedProfilePanel lead={resolved} />}

      {timeline.length > 0 && (
        <Section title="Activity">
          <div className="flex flex-col gap-3.5 pl-1">
            {timeline.map((ev) => (
              <div key={ev.label} className="flex gap-[11px]">
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <span
                    className="w-[7px] h-[7px] rounded-full"
                    style={{ background: ev.live ? 'var(--ui-accent)' : 'var(--ui-border-strong)' }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)] leading-[1.4]">{ev.label}</p>
                  <p className="mt-0.5 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-neutral-400)]">
                    {absoluteTime(ev.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!resolving && !error && !resolved?.profileResolvedAt && (
        <Section>
          <div className="flex items-center gap-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">
            <Users size={13} aria-hidden="true" />
            Nothing more to show yet — this profile hasn&rsquo;t been resolved.
          </div>
        </Section>
      )}
      <div className="h-6 shrink-0" />
    </Drawer>
  );
}
