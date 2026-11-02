import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, Wand2, ChevronDown, Link2, Search, Ban } from 'lucide-react';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { Avatar, Button } from 'src/core/primitives';
import {
  IMPORT_FIELD_BY_KEY,
  UNMAPPED,
  validateMapping,
  extractProfiles,
} from 'src/shared/utils/csvImport.js';

/**
 * Match columns — step 2 of the import wizard.
 *
 * Built to be CONFIRMED, not filled in: auto-detection has usually done the
 * work, so the panel leads with what matters and hides what doesn't.
 *
 *   Left  — "Who is this?" (name, LinkedIn URL, company) first, each with a
 *           clear ✓ / needs-attention state, then optional details folded
 *           into a compact grid (progressive disclosure: six more dropdowns
 *           are noise until someone wants them).
 *   Right — a live preview of the first rows AS SPURLY WILL READ THEM, plus
 *           the running outcome (ready · to find · skipped). Seeing "Sarthak
 *           Vats · Founder at Spurly" is proof the mapping is right; trusting
 *           a dropdown label is not.
 */

const KEY_FIELDS = ['name', 'firstName', 'lastName', 'profileUrl', 'company'];
const DETAIL_FIELDS = ['title', 'location', 'headline', 'email', 'phone', 'website'];

const KEY_LABELS = {
  name: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',
  profileUrl: 'LinkedIn URL',
  company: 'Company',
};

function isMapped(mapping, key) {
  return mapping[key] !== undefined && mapping[key] !== UNMAPPED;
}

function FieldRow({ fieldKey, label, hint, mapping, sampleValues, columnOptions, onChange, status }) {
  const index = mapping[fieldKey] ?? UNMAPPED;
  const sample = index >= 0 ? sampleValues[index] : '';
  const icon =
    status === 'ok' ? (
      <CheckCircle2 size={15} style={{ color: 'var(--ui-success)' }} />
    ) : status === 'missing' ? (
      <AlertCircle size={15} style={{ color: 'var(--ui-danger)' }} />
    ) : (
      <Circle size={15} style={{ color: 'var(--ui-border)' }} />
    );
  return (
    <div className="grid grid-cols-[18px_minmax(0,0.9fr)_minmax(0,1.2fr)] gap-x-3 gap-y-1 items-start py-3">
      <span className="mt-[9px]">{icon}</span>
      <div className="min-w-0 pt-[7px]">
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">{label}</p>
        {hint && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">{hint}</p>}
      </div>
      <div className="min-w-0">
        <Dropdown
          id={`map-${fieldKey}`}
          variant="dashboard"
          value={String(index)}
          onChange={(value) => onChange(fieldKey, value)}
          options={columnOptions}
          placeholder="Not imported"
          error={status === 'missing'}
        />
        <p
          className="text-[length:var(--ui-t-meta)] mt-1 truncate px-0.5"
          style={{ color: sample ? 'var(--ui-text-tertiary)' : 'var(--ui-text-quaternary)' }}
          title={sample}
        >
          {index === UNMAPPED ? 'Not imported' : sample ? `e.g. ${sample}` : 'Blank in every row'}
        </p>
      </div>
    </div>
  );
}

function PreviewPerson({ row, kind }) {
  const subtitle = [row.title, row.company].filter(Boolean).join(' at ');
  const tag = {
    ready: { icon: <Link2 size={11} />, text: 'Has LinkedIn URL', color: 'var(--ui-success-fg)', bg: 'var(--ui-success-tint)' },
    find: { icon: <Search size={11} />, text: 'Spurly will find', color: 'var(--ui-accent-fg)', bg: 'var(--ui-accent-tint)' },
  }[kind];
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <Avatar name={row.name} size={30} />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate">{row.name}</p>
        <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] truncate">
          {subtitle || 'No title or company mapped'}
          {row.location ? ` · ${row.location}` : ''}
        </p>
      </div>
      <span
        className="shrink-0 inline-flex items-center gap-1 px-1.5 h-5 rounded-[var(--ui-radius-pill)] text-[length:var(--ui-t-micro)] font-medium"
        style={{ color: tag.color, background: tag.bg }}
      >
        {tag.icon}
        {tag.text}
      </span>
    </div>
  );
}

function Outcome({ icon, value, label, tone }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="shrink-0" style={{ color: tone }}>{icon}</span>
      <span className="ui-num text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)]">{value.toLocaleString()}</span>
      <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">{label}</span>
    </div>
  );
}

export function FieldMappingPanel({ headers, sampleValues, rows, mapping, onChange, onReset }) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  const columnOptions = useMemo(
    () => [[String(UNMAPPED), 'Not imported'], ...headers.map((h, i) => [String(i), h || `Column ${i + 1}`])],
    [headers],
  );

  const { ok, canFindProfiles } = validateMapping(mapping);
  const hasName = isMapped(mapping, 'name') || isMapped(mapping, 'firstName');
  const hasUrl = isMapped(mapping, 'profileUrl');

  const setField = (key, value) => {
    const index = parseInt(value, 10);
    onChange({ ...mapping, [key]: Number.isInteger(index) ? index : UNMAPPED });
  };

  const extracted = useMemo(() => (ok ? extractProfiles(rows, mapping) : null), [ok, rows, mapping]);
  const preview = useMemo(() => {
    if (!extracted) return [];
    const ready = extracted.profiles.slice(0, 3).map((r) => ({ row: r, kind: 'ready' }));
    const find = extracted.lookupRows.slice(0, Math.max(0, 3 - ready.length) || 2).map((r) => ({ row: r, kind: 'find' }));
    return [...ready, ...find].slice(0, 4);
  }, [extracted]);

  const nameStatus = (key) => {
    if (key === 'name' || key === 'firstName') return hasName ? (isMapped(mapping, key) ? 'ok' : 'idle') : 'missing';
    return isMapped(mapping, key) ? 'ok' : 'idle';
  };
  const urlCompanyStatus = (key) => {
    if (isMapped(mapping, key)) return 'ok';
    return !hasUrl && !canFindProfiles ? 'missing' : 'idle';
  };

  const detailsMapped = DETAIL_FIELDS.filter((k) => isMapped(mapping, k)).length;

  const keyHints = {
    name: 'Or map first + last name instead',
    profileUrl: canFindProfiles && !hasUrl ? 'Optional — Spurly finds profiles from name + company' : 'Rows with a URL import straight away',
    company: hasUrl ? 'Lets Spurly find rows that have no URL' : 'Needed to find people without a URL',
  };

  /* One card, two panes — the same anatomy as the Leads table card: a header
     band, a body that scrolls by itself, and nothing on the page scrolls. The
     preview pane is sunken with white person cards on it, so the preview
     reads as a layer under the form rather than a second loose card. */
  const band =
    'shrink-0 flex items-center justify-between gap-3 px-[var(--ui-pad-lg)] min-h-[52px] border-b border-[var(--ui-border-hairline)] bg-[var(--ui-surface-header)]';

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)]">
      {/* ── Left: the mapping, its own scroll ─────────────────────────── */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className={band}>
          <div className="min-w-0">
            <h3 className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Match your columns</h3>
            <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
              A name, plus a LinkedIn URL or a company. We matched what we could.
            </p>
          </div>
          <Button variant="ghost" size="sm" leadingIcon={<Wand2 size={13} />} onClick={onReset} title="Discard changes and re-detect">
            Re-detect
          </Button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <p className="ui-micro px-[var(--ui-pad-lg)] pt-4 pb-1">Who is each row</p>
          <div className="px-[var(--ui-pad-lg)] divide-y divide-[var(--ui-border-hairline)]">
            {KEY_FIELDS.map((key) => (
              <FieldRow
                key={key}
                fieldKey={key}
                label={KEY_LABELS[key]}
                hint={keyHints[key]}
                mapping={mapping}
                sampleValues={sampleValues}
                columnOptions={columnOptions}
                onChange={setField}
                status={key === 'profileUrl' || key === 'company' ? urlCompanyStatus(key) : nameStatus(key)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-[var(--ui-pad-lg)] pt-5 pb-1 border-t border-[var(--ui-border-hairline)] mt-2">
            <p className="ui-micro">
              More details · {detailsMapped} of {DETAIL_FIELDS.length} mapped
            </p>
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={detailsOpen}
              trailingIcon={<ChevronDown size={13} className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              {detailsOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
          {detailsOpen && (
            <div className="px-[var(--ui-pad-lg)] pb-3 divide-y divide-[var(--ui-border-hairline)]">
              {DETAIL_FIELDS.map((key) => (
                <FieldRow
                  key={key}
                  fieldKey={key}
                  label={IMPORT_FIELD_BY_KEY[key].label}
                  mapping={mapping}
                  sampleValues={sampleValues}
                  columnOptions={columnOptions}
                  onChange={setField}
                  status={isMapped(mapping, key) ? 'ok' : 'idle'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Right: the live preview, a sunken pane ───────────────────── */}
      <aside className="lg:w-[400px] shrink-0 min-h-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--ui-border)] bg-[var(--ui-surface-sunken)]">
        <header className={band}>
          <div className="min-w-0">
            <h3 className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">How Spurly reads your file</h3>
            <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">Updates as you change a column</p>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
          {!extracted ? (
            <div className="flex gap-2.5 p-3 rounded-[var(--ui-radius-md)] bg-[var(--ui-danger-tint)]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                {!hasName
                  ? 'Pick the column with each person’s name.'
                  : 'Pick a LinkedIn URL column — or a Company column so Spurly can find each person.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {preview.map(({ row, kind }) => (
                  <div
                    key={row._id}
                    className="px-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)]"
                  >
                    <PreviewPerson row={row} kind={kind} />
                  </div>
                ))}
              </div>

              <div className="mt-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)] px-3.5 py-3 flex flex-col gap-2">
                <p className="ui-micro">Out of {(extracted.profiles.length + extracted.lookupRows.length + extracted.skippedCount).toLocaleString()} rows</p>
                <Outcome icon={<Link2 size={14} />} tone="var(--ui-success)" value={extracted.profiles.length} label="straight to your Hub" />
                <Outcome icon={<Search size={14} />} tone="var(--ui-accent)" value={extracted.lookupRows.length} label="Spurly will find on LinkedIn" />
                {extracted.skippedCount > 0 && (
                  <Outcome icon={<Ban size={14} />} tone="var(--ui-text-tertiary)" value={extracted.skippedCount} label="skipped — missing name, URL or company" />
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
