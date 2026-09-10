import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Briefcase, GraduationCap, Users } from 'lucide-react';
import { Avatar, Badge, Drawer, Skeleton } from 'src/ui/primitives';
import { LinkedInIcon } from 'src/ui/icons';
import { hubSourcingApi } from './api.js';

/**
 * Hub's lead detail drawer — Phase 6, 1a/1b.
 *
 * Deliberately NOT built on `platform/people/LeadDetailSidebar`, even though
 * the visual language (Drawer + identity block + Section blocks) is the same
 * on purpose. Hub's isolation boundary (see UNIPILE_MODULE_PLAN.md §0 /
 * [[unipile_api_module]]) shares exactly `platform/outreach` plus
 * auth/users/plans/credits with the rest of the app — a HubLead is not a
 * Person and has no `personId`. Reusing that component directly would mean
 * either passing it a HubLead pretending to be shaped like a Person (fragile:
 * its Research/Activity tabs call endpoints keyed on a Person's `_id`, which a
 * HubLead's `_id` is not), or threading new conditionals through a component
 * three other pages already depend on. A small local drawer, styled with the
 * same `--ui-*` tokens everything else uses, costs less than either.
 *
 * ONE PANEL, NOT TABS — for now. The Contacts drawer splits into tabs because
 * it mixes four independently-fetched concerns (profile, contact info,
 * research, outreach activity). Hub currently has exactly one: the resolved
 * profile. Splitting into tabs today would be structure with nothing to
 * organize; add a second tab (invitation timeline, once 1c's reconciliation
 * exists) before reaching for `Tabs`.
 *
 * THE RESOLVE-ON-OPEN TRIGGER — this is the surface Sarthak chose (2026-09-10)
 * for Phase 6 1a's "resolve once, on open" requirement: opening this drawer
 * is what fires `GET /hub/leads/:id/profile`. The backend is what actually
 * enforces "once" (it no-ops on an already-resolved lead unless `force` is
 * passed); this component only has to show a loading state while that
 * decision is made server-side, not make the decision itself.
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
          className="inline-flex items-center h-6 px-2 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] text-[12px] text-[var(--ui-text-secondary)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="px-4 py-3 border-t first:border-t-0 border-[var(--ui-border-hairline)]">
      {title && (
        <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)] mb-2">
          {title}
        </h3>
      )}
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
        <p className="text-[13px] font-medium text-[var(--ui-text-primary)] leading-snug">{primary}</p>
        {secondary && <p className="text-[12px] text-[var(--ui-text-secondary)] leading-snug">{secondary}</p>}
        {meta && <p className="text-[11px] text-[var(--ui-text-tertiary)] leading-snug mt-0.5">{meta}</p>}
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

function ResolvedProfilePanel({ lead }) {
  const profile = lead.fullProfile || {};
  const experience = Array.isArray(profile.work_experience) ? profile.work_experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const skills = Array.isArray(profile.skills) ? profile.skills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) : [];

  return (
    <>
      {profile.summary && (
        <Section title="About">
          <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed whitespace-pre-line">
            {profile.summary}
          </p>
        </Section>
      )}

      {(lead.followersCount != null || profile.connections_count != null) && (
        <Section title="Details">
          <dl className="flex flex-col gap-1.5">
            {profile.connections_count != null && (
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-[12px] text-[var(--ui-text-tertiary)]">Connections</dt>
                <dd className="text-[13px] text-[var(--ui-text-primary)] tabular-nums">
                  {profile.connections_count.toLocaleString()}
                </dd>
              </div>
            )}
            {lead.followersCount != null && (
              <div className="flex items-baseline gap-3">
                <dt className="w-24 shrink-0 text-[12px] text-[var(--ui-text-tertiary)]">Followers</dt>
                <dd className="text-[13px] text-[var(--ui-text-primary)] tabular-nums">
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
  const [resolving, setResolving] = useState(() => Boolean(lead && !lead.profileResolvedAt));
  const [error, setError] = useState(null);

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
    if (!lead || lead.profileResolvedAt) return undefined;

    const requestId = ++requestIdRef.current;
    hubSourcingApi
      .resolveProfile(lead._id)
      .then((updated) => {
        if (requestIdRef.current !== requestId || !updated) return;
        setResolved(updated);
        onResolved?.(updated);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        // Not a toast: the drawer itself is the place to say this, and a
        // failed resolve should not block reading what the lead list already
        // knew (name, headline, location) — only the extra sections stay empty.
        setError(err?.response?.data?.message || 'Could not load the full profile.');
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setResolving(false);
      });

    return () => { requestIdRef.current += 1; };
  }, [lead, onResolved]);

  const degreeLabel = useMemo(() => ({ 1: '1st', 2: '2nd', 3: '3rd' }[resolved?.connectionDegree] ?? null), [resolved]);

  if (!lead) return null;

  return (
    <Drawer open onClose={onClose} title={lead.name} showHeader={false} size="md">
      <div className="px-4 py-4 pr-10">
        <div className="flex items-start gap-3">
          <Avatar src={lead.profilePictureUrl || null} name={lead.name} size={44} shape="square" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] leading-tight">
              {lead.name}
            </h2>
            {(resolved?.currentTitle || resolved?.companyName) && (
              <p className="text-[13px] text-[var(--ui-text-secondary)] mt-0.5 leading-snug">
                {resolved.currentTitle}
                {resolved.companyName ? ` · ${resolved.companyName}` : ''}
              </p>
            )}
            {!resolved?.currentTitle && !resolved?.companyName && lead.headline && (
              <p className="text-[13px] text-[var(--ui-text-secondary)] mt-0.5 leading-snug">{lead.headline}</p>
            )}
            {lead.location && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--ui-text-tertiary)] mt-1">
                <MapPin size={12} aria-hidden="true" />
                {lead.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {degreeLabel && (
            <Badge size="sm" tone="neutral">
              {degreeLabel} degree
            </Badge>
          )}
          {lead.isPremium && (
            <Badge size="sm" tone="accent">
              Premium
            </Badge>
          )}
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-6 px-2 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] text-[12px] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
          >
            <LinkedInIcon size={12} />
            View on LinkedIn
          </a>
        </div>
      </div>

      {resolving && (
        <div className="px-4 py-3 flex flex-col gap-2">
          <Skeleton width="75%" height={11} />
          <Skeleton width="50%" height={11} />
          <Skeleton width="65%" height={11} />
        </div>
      )}

      {!resolving && error && (
        <Section>
          <p className="text-[12px] text-[var(--ui-danger-fg)]">{error}</p>
        </Section>
      )}

      {!resolving && !error && <ResolvedProfilePanel lead={resolved} />}

      {!resolving && !error && !resolved?.profileResolvedAt && (
        <Section>
          <div className="flex items-center gap-2 text-[12px] text-[var(--ui-text-tertiary)]">
            <Users size={13} aria-hidden="true" />
            Nothing more to show yet — this profile hasn't been resolved.
          </div>
        </Section>
      )}
    </Drawer>
  );
}
