import { useMemo } from 'react';
import {
  UserPlus,
  MessageSquare,
  Check,
  X,
  Clock,
  Users,
  Loader2,
  ExternalLink,
  SkipForward,
} from 'lucide-react';

/**
 * CampaignFlowCanvas
 * -------------------
 * A lemlist-style workflow canvas. A vertical "spine" runs down the left with a
 * Start node and the campaign Action node at the top; every lead branches off
 * the spine as its own profile node. Connector lines carry motion:
 *   - pending → dim dashed, idle
 *   - sending → purple dashes flowing toward the node (the lead being processed)
 *   - sent    → solid purple
 *   - failed  → red
 *   - skipped → muted
 * The spine also fills top→down with overall progress, and a pulse travels it
 * while a run is live — so the user can watch how much is done vs. left.
 */

const DONE_STATUSES = new Set(['sent', 'failed', 'skipped']);

const STATUS_META = {
  pending: { label: 'Pending', color: 'var(--text-tertiary)', tint: 'var(--surface-sunken)', Icon: Clock },
  sending: { label: 'Sending', color: 'var(--brand-purple)',  tint: 'var(--accent-tint)',    Icon: Loader2 },
  sent:    { label: 'Sent',    color: 'var(--brand-purple)',  tint: 'var(--accent-tint)',    Icon: Check },
  failed:  { label: 'Failed',  color: 'var(--red)',           tint: 'var(--red-tint)',       Icon: X },
  skipped: { label: 'Skipped', color: 'var(--text-tertiary)', tint: 'var(--surface-sunken)', Icon: SkipForward },
};

export function CampaignFlowCanvas({ members = [], actionType, sending = false, status }) {
  const ActionIcon = actionType === 'message' ? MessageSquare : UserPlus;
  const actionLabel = actionType === 'message' ? 'Message' : 'Connection request';

  // The lead currently being processed = first still-pending one during a run.
  const activeIndex = useMemo(() => {
    if (!sending) return -1;
    return members.findIndex((m) => (m.status ?? 'pending') === 'pending');
  }, [members, sending]);

  const counts = useMemo(() => {
    const c = { pending: 0, sent: 0, failed: 0, skipped: 0 };
    members.forEach((m) => {
      const s = m.status ?? 'pending';
      if (c[s] === undefined) c.pending += 1;
      else c[s] += 1;
    });
    return c;
  }, [members]);

  const total = members.length;
  const done = members.filter((m) => DONE_STATUSES.has(m.status ?? 'pending')).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="campaign-canvas relative h-full w-full overflow-y-auto">
      {/* Live stat strip */}
      {/* Solid, not a blurred translucent bar. A 78%-opaque strip over a dotted
          canvas picks up the dots underneath it, so the numbers sat on texture
          and the whole strip shimmered while the list scrolled behind it. */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center gap-2"
        style={{
          paddingInline: 'var(--ui-pad-x)',
          paddingBlock: 8,
          background: 'var(--ui-surface-card)',
          borderBottom: '1px solid var(--ui-border-hairline)',
        }}
      >
        <Stat label="Total" value={total} icon={Users} color="var(--text-secondary)" />
        <Stat label="Sent" value={counts.sent} icon={Check} color="var(--brand-purple)" />
        <Stat label="Pending" value={counts.pending} icon={Clock} color="var(--text-tertiary)" />
        {counts.skipped > 0 && (
          <Stat label="Skipped" value={counts.skipped} icon={SkipForward} color="var(--text-tertiary)" />
        )}
        {counts.failed > 0 && <Stat label="Failed" value={counts.failed} icon={X} color="var(--red)" />}
        <div className="ml-auto flex items-center gap-2.5">
          <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
            <div className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand-purple), var(--green))' }} />
          </div>
          <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {done}/{total}
          </span>
        </div>
      </div>

      <div className="relative px-[var(--ui-pad-lg)] pt-[var(--ui-pad-lg)] pb-24 min-h-[calc(100%-52px)]">
        {/* ---- Spine + top nodes ---- */}
        <div className="relative pl-[26px]">
          {/* Vertical spine track */}
          <div className="absolute left-[10px] top-2 bottom-2 w-[3px] rounded-full" style={{ background: 'var(--border-hairline)' }} />
          {/* Spine progress fill */}
          <div
            className="absolute left-[10px] top-2 w-[3px] rounded-full transition-[height] duration-700 ease-out"
            style={{
              height: `calc(${pct}% - 4px)`,
              background: 'linear-gradient(180deg, var(--brand-purple), var(--green))',
              boxShadow: '0 0 8px var(--accent-tint-2)',
            }}
          />
          {/* Travelling pulse while a run is live */}
          {sending && (
            <span className="campaign-spine-pulse absolute left-[7px] w-[9px] h-[9px] rounded-full"
              style={{ background: 'var(--brand-purple)', boxShadow: '0 0 0 4px var(--accent-tint)' }} />
          )}

          {/* Start node */}
          <SpineNode dotColor="var(--text-secondary)">
            <div className="flex items-center gap-2.5 rounded-[var(--ui-radius-lg)] px-3.5 py-2.5"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))' }}>
              <span className="grid place-items-center w-8 h-8 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
                <Users size={16} />
              </span>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Leads list</div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{total} lead{total === 1 ? '' : 's'}</div>
              </div>
            </div>
          </SpineNode>

          {/* Action node */}
          <SpineNode dotColor="var(--brand-purple)" glow={sending}>
            <div className="flex items-center gap-2.5 rounded-[var(--ui-radius-lg)] px-3.5 py-2.5"
              style={{ background: 'var(--surface-card)', border: '1.5px solid var(--brand-purple)', boxShadow: '0 4px 16px var(--accent-tint)' }}>
              <span className="grid place-items-center w-8 h-8 rounded-[var(--ui-radius-md)] text-white" style={{ background: 'var(--brand-purple)' }}>
                <ActionIcon size={16} />
              </span>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--brand-purple)' }}>Action</div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{actionLabel}</div>
              </div>
              {sending && (
                <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand-purple)' }} /> Running
                </span>
              )}
            </div>
          </SpineNode>
        </div>

        {/* ---- Profile branches ---- */}
        <div className="relative pl-[26px] mt-1">
          {/* Branch spine continues behind the profile rows */}
          <div className="absolute left-[10px] top-0 bottom-6 w-[3px] rounded-full" style={{ background: 'var(--border-hairline)' }} />

          {total === 0 ? (
            <div className="pl-6 py-10 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              No leads in this campaign yet. Add people from the Contacts tab.
            </div>
          ) : (
            members.map((m, i) => {
              const raw = m.status ?? 'pending';
              const isActive = i === activeIndex;
              const visual = isActive ? 'sending' : raw;
              return <ProfileBranch key={m._id || i} member={m} state={visual} active={isActive} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** A node hung on the vertical spine (start / action). */
function SpineNode({ children, dotColor, glow }) {
  return (
    <div className="relative mb-3">
      <span
        className={`absolute -left-[26px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] rounded-full border-2 ${glow ? 'campaign-node-glow' : ''}`}
        style={{ background: 'var(--surface-canvas)', borderColor: dotColor }}
      />
      {children}
    </div>
  );
}

/** One lead branching off the spine with an animated connector. */
function ProfileBranch({ member, state, active }) {
  const meta = STATUS_META[state] || STATUS_META.pending;
  const { Icon } = meta;
  const name = member.name || 'Unknown';
  const sub = [member.title, member.company].filter(Boolean).join(' · ');
  const done = DONE_STATUSES.has(state);

  // Connector line styling by state.
  const connectorClass =
    state === 'sending' ? 'campaign-line-flow' : done ? 'campaign-line-solid' : 'campaign-line-idle';

  return (
    <div className="relative flex items-center py-2.5 pl-6">
      {/* Node dot on the spine */}
      <span
        className={`absolute -left-[3px] top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-2 z-10 ${active ? 'campaign-node-glow' : ''}`}
        style={{ background: done || active ? meta.color : 'var(--surface-canvas)', borderColor: active || done ? meta.color : 'var(--border-default)' }}
      />
      {/* Horizontal connector from spine to card */}
      <span
        className={`absolute left-[8px] top-1/2 -translate-y-1/2 h-[3px] w-[26px] rounded-full ${connectorClass}`}
        style={{ '--line-color': meta.color }}
      />

      {/* Profile card */}
      <div
        className="flex items-center gap-3 rounded-[var(--ui-radius-lg)] px-3.5 py-2.5 w-full max-w-[420px] transition-colors"
        style={{
          background: 'var(--surface-card)',
          border: `1.5px solid ${active ? meta.color : done ? 'color-mix(in srgb, ' + meta.color + ' 45%, var(--border-hairline))' : 'var(--border-hairline)'}`,
          boxShadow: active ? `0 6px 20px var(--accent-tint)` : 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))',
        }}
      >
        {member.avatar ? (
          <img src={member.avatar} alt={name} className="w-9 h-9 rounded-[var(--ui-radius-lg)] object-cover flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center text-white text-[13px] font-medium flex-shrink-0"
            style={{ background: 'var(--brand-gradient-vivid, var(--brand-purple))' }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</div>
          {sub && <div className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>}
        </div>

        {/* Status pill */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
          style={{ background: meta.tint, color: meta.color }}>
          <Icon size={11} className={state === 'sending' ? 'animate-spin' : ''} />
          {meta.label}
        </span>

        {member.profileUrl && (
          <a href={member.profileUrl} target="_blank" rel="noreferrer"
            className="grid place-items-center w-7 h-7 rounded-[var(--ui-radius-md)] flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            title="Open LinkedIn profile">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ui-radius-md)]" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}>
      <Icon size={13} style={{ color }} />
      <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
    </div>
  );
}
