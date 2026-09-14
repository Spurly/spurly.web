import { Loader2, Play, Trash2, AlertTriangle } from "lucide-react";
import { Button, Badge } from "src/ui/primitives";
import {
  isBusy,
  describeSearch,
} from "src/products/hub/leads/hooks/audience.js";

/**
 * The saved audiences, as a list you manage — inside the dock, not on the page.
 *
 * WHY IT MOVED
 *
 * This was a card sitting between the page header and the table, and it was
 * doing four jobs at once: it filtered the table (click a row), it reported
 * import progress, it managed the audience (run, delete), and it surfaced the
 * "stopped short" error. Four jobs, one box, permanently occupying the space
 * directly above the thing you actually came to look at.
 *
 * Only one of those four earns a permanent place on the page, and it is the
 * progress — an import is a background job somebody is waiting on, so hiding
 * it behind a closed panel would be worse than the card was. That one lives on
 * the page now as a strip that exists only while something is running.
 *
 * The other three are management, and management belongs where you go to
 * manage: the dock. It is not "Build an audience" any more, it is
 * "Audiences" — the ones you have and the one you are making, which is a
 * single subject rather than two.
 */

const STATUS_VIEW = {
  queued: {
    label: "Queued",
    tone: "neutral",
    detail: "Waiting for the importer. Starts within a minute.",
  },
  running: {
    label: "Importing",
    tone: "info",
    detail: "Reading results from LinkedIn.",
  },
  done: {
    label: "Imported",
    tone: "success",
    detail: "Everything LinkedIn returned is in.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    detail: "Stopped before finishing.",
  },
};

function AudienceRow({ search, onRun, onDelete, busy }) {
  const view = STATUS_VIEW[search.status] ?? STATUS_VIEW.queued;

  return (
    <div
      className={[
        "group relative flex items-center gap-3 px-[var(--ui-pad-lg)]",
        "border-b border-[var(--ui-border-hairline)] last:border-b-0",
        "transition-colors duration-[var(--ui-dur-fast)]",
        "hover:bg-[var(--ui-surface-hover)]",
      ].join(" ")}
      style={{ minHeight: "var(--ui-row)" }}
    >
      <div className="flex-1 min-w-0 py-2.5">
        <span className="block text-[var(--ui-t-body)] text-[var(--ui-text-primary)] truncate">
          {search.name || "Untitled audience"}
        </span>
        <span className="block ui-meta normal-case tracking-normal truncate mt-0.5">
          {describeSearch(search)}
        </span>
      </div>

      <span className="ui-num text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] shrink-0">
        {search.importedCount?.toLocaleString() ?? 0}
      </span>

      <Badge tone={view.tone} title={view.detail} dot pulse={isBusy(search)}>
        {view.label}
      </Badge>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || isBusy(search)}
          onClick={() => onRun(search)}
          title={
            search.status === "done"
              ? "Check for people who have appeared since"
              : "Resume this import"
          }
          aria-label={
            search.status === "done"
              ? "Check for new people"
              : "Resume this import"
          }
        >
          <Play size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onDelete(search)}
          title="Remove this audience"
          aria-label="Remove this audience"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown when an import stopped early rather than running out of people.
 *
 * The backend can tell the two apart — an empty page that still carries a
 * cursor is LinkedIn declining, not an exhausted audience — and saying
 * "imported 240" without this would be a number the user plans around.
 */
export function StoppedShortNotice({ search }) {
  if (!search?.error) return null;
  return (
    <div className="flex items-start gap-2.5 px-[var(--ui-pad-lg)] py-3 bg-[var(--ui-warning-tint)] shadow-[inset_var(--ui-spine)_0_0_var(--ui-warning-dot)]">
      <AlertTriangle
        size={15}
        className="mt-px shrink-0 text-[var(--ui-warning-fg)]"
        aria-hidden="true"
      />
      <p className="text-[var(--ui-t-label)] text-[var(--ui-warning-fg)] leading-relaxed">
        {search.error}
      </p>
    </div>
  );
}

export function AudienceList({ searches, onRun, onDelete, busy }) {
  if (searches.length === 0) {
    return (
      <p className="px-[var(--ui-pad-lg)] py-5 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
        No saved audiences yet. Build one below and it will appear here.
      </p>
    );
  }

  const failed = searches.find((s) => s.error) ?? null;

  return (
    <div>
      <StoppedShortNotice search={failed} />
      {searches.map((search) => (
        <AudienceRow
          key={search._id}
          search={search}
          onRun={onRun}
          onDelete={onDelete}
          busy={busy}
        />
      ))}
    </div>
  );
}

/**
 * The one part of the old card that stays on the page — and only while it has
 * something to say.
 *
 * An import is a background job measured in minutes, and the user is waiting on
 * it. Putting that behind a panel they have to open would be a worse answer
 * than the permanent card was. So this exists exactly as long as something is
 * actually running and then disappears, rather than occupying space to report
 * that nothing is happening.
 *
 * Still a count, never a bar: classic LinkedIn search returns no total, so the
 * honest answer to "how far along?" is "412 so far" and a percentage would have
 * to invent its denominator.
 */
export function ImportStrip({ searches }) {
  const running = searches.filter(isBusy);
  if (running.length === 0) return null;

  const imported = running.reduce((sum, s) => sum + (s.importedCount ?? 0), 0);
  const lead = running[0];

  return (
    <div className="flex items-center gap-3 px-[var(--ui-pad-lg)] py-2.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-info-tint)] shadow-[inset_var(--ui-spine)_0_0_var(--ui-info-dot)]">
      <Loader2
        size={14}
        className="shrink-0 motion-safe:animate-spin text-[var(--ui-info-fg)]"
        aria-hidden="true"
      />
      <p className="text-[var(--ui-t-label)] text-[var(--ui-info-fg)] min-w-0 truncate">
        Importing{" "}
        <span className="font-semibold">
          {running.length === 1
            ? lead.name || "an audience"
            : `${running.length} audiences`}
        </span>
        {" · "}
        <span className="ui-num">{imported.toLocaleString()}</span> so far
      </p>
      <span className="ui-meta ml-auto shrink-0 hidden sm:block">
        You can leave this page
      </span>
    </div>
  );
}
