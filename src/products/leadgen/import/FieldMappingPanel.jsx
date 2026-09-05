import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import { Dropdown } from 'src/ui/compat/Dropdown';
import { Button } from 'src/ui/primitives';
import {
  IMPORT_FIELDS,
  UNMAPPED,
  validateMapping,
} from 'src/shared/utils/csvImport.js';

/**
 * Column → field mapping step of the CSV import.
 *
 * Why this exists: a CSV only ever failed to import because its headers were
 * spelled differently ("LinkedIn URL" instead of "profileurl"), and the only
 * fix we offered was "go edit your file". Here the file is already parsed —
 * the user just points each Spurly field at the right column.
 *
 * Auto-detection has usually done the work by the time this renders, so the
 * panel is designed to be *confirmed*, not filled in: every field shows what
 * it matched and a real sample value from the file, and only the unmatched
 * required ones demand attention.
 */
export function FieldMappingPanel({
  headers,
  sampleValues,
  mapping,
  onChange,
  onBack,
  onContinue,
  onReset,
  rowCount,
  fileName,
}) {
  // Column options, shared by every dropdown. A column already used by another
  // field is still selectable — picking it just moves it, which is less
  // surprising than a disabled option the user can't explain.
  const columnOptions = useMemo(
    () => [
      [String(UNMAPPED), 'Not imported'],
      ...headers.map((header, i) => [String(i), header || `Column ${i + 1}`]),
    ],
    [headers],
  );

  const { ok, missing } = validateMapping(mapping);

  // A column used by two fields at once is legal but almost always a mistake,
  // so it's surfaced as a warning rather than blocking the import.
  const duplicateColumns = useMemo(() => {
    const counts = new Map();
    for (const field of IMPORT_FIELDS) {
      const index = mapping[field.key];
      if (index === undefined || index === UNMAPPED) continue;
      counts.set(index, (counts.get(index) || 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n > 1).map(([index]) => headers[index]);
  }, [mapping, headers]);

  const mappedCount = IMPORT_FIELDS.filter(
    (f) => mapping[f.key] !== undefined && mapping[f.key] !== UNMAPPED,
  ).length;

  const setField = (key, value) => {
    const index = parseInt(value, 10);
    onChange({ ...mapping, [key]: Number.isInteger(index) ? index : UNMAPPED });
  };

  const isMissing = (field) => {
    if (!missing.length) return false;
    if (field.key === 'profileUrl') return missing.includes('LinkedIn URL');
    if (field.requiredGroup === 'name') return missing.includes('Full name (or First name)');
    return false;
  };

  return (
    <>
      {/* Header: what we found, and what still needs a decision */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[var(--ui-pad-lg)] py-4 rounded-[var(--ui-radius-lg)]"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[var(--text-primary)]">
            Match your columns
          </p>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            <span className="font-medium text-[var(--text-primary)]">{fileName}</span>
            {' · '}
            {headers.length} column{headers.length === 1 ? '' : 's'}
            {' · '}
            {rowCount.toLocaleString()} row{rowCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={onBack}>
            Choose different file
          </Button>
          <Button variant="primary" onClick={onContinue} disabled={!ok}>
            Continue
          </Button>
        </div>
      </div>

      {/* Auto-detection result */}
      <div
        className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)] -mt-2"
        style={
          ok
            ? { background: 'var(--green-tint)', border: '1px solid rgba(52,199,89,0.22)' }
            : { background: 'var(--red-tint)', border: '1px solid rgba(255,69,58,0.22)' }
        }
      >
        {ok ? (
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
        ) : (
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-medium"
            style={{ color: ok ? 'var(--green)' : 'var(--red)' }}
          >
            {ok
              ? `Matched ${mappedCount} field${mappedCount === 1 ? '' : 's'} automatically`
              : `Pick a column for ${missing.join(' and ')}`}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {ok
              ? 'Check the samples below and change anything that looks wrong. Fields set to “Not imported” are simply left out.'
              : 'Your file’s columns are listed in each dropdown — choose the one that holds this information.'}
          </p>
          {duplicateColumns.length > 0 && (
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Heads up: {duplicateColumns.map((c) => `“${c}”`).join(', ')} is mapped to more than
              one field.
            </p>
          )}
        </div>
        <div className="shrink-0 self-start">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Wand2 size={13} />}
            onClick={onReset}
            title="Discard my changes and re-detect from the headers"
          >
            Re-detect
          </Button>
        </div>
      </div>

      {/* The mapping grid.
          Deliberately NOT `overflow-hidden`, unlike the other cards on this
          page: each row contains a dropdown whose menu is absolutely
          positioned, and clipping the card would cut the menu off for every
          field near the bottom of the list. */}
      <div
        className="rounded-[var(--ui-radius-lg)]"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <div
          className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] gap-4 px-[var(--ui-pad-lg)] py-2.5 text-[12px] font-medium uppercase tracking-[0.04em]"
          style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-hairline)' }}
        >
          <span>Spurly field</span>
          <span>Your column</span>
          <span>Sample from your file</span>
        </div>

        {IMPORT_FIELDS.map((field) => {
          const index = mapping[field.key] ?? UNMAPPED;
          const sample = index >= 0 ? sampleValues[index] : '';
          const missingThis = isMissing(field);

          return (
            <div
              key={field.key}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] gap-2 sm:gap-4 sm:items-center px-[var(--ui-pad-lg)] py-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div className="min-w-0">
                <p className="text-[14px] text-[var(--text-primary)] flex items-center gap-1.5">
                  {field.label}
                  {(field.required || field.requiredGroup) && (
                    <span
                      className="text-[11px]"
                      style={{ color: missingThis ? 'var(--red)' : 'var(--text-tertiary)' }}
                    >
                      {field.required ? 'Required' : 'Required*'}
                    </span>
                  )}
                </p>
                {field.hint && (
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {field.hint}
                  </p>
                )}
              </div>

              <Dropdown
                id={`map-${field.key}`}
                variant="dashboard"
                value={String(index)}
                onChange={(value) => setField(field.key, value)}
                options={columnOptions}
                placeholder="Not imported"
                error={missingThis}
              />

              <p
                className="text-[13px] truncate"
                style={{ color: sample ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
                title={sample}
              >
                {index === UNMAPPED ? '—' : sample || '(blank in every row)'}
              </p>
            </div>
          );
        })}

        <p className="px-[var(--ui-pad-lg)] py-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          * Map either <span className="text-[var(--text-secondary)]">Full name</span> or{' '}
          <span className="text-[var(--text-secondary)]">First name</span> — with first and last
          name columns we join them for you. Your choices are remembered for your next import.
        </p>
      </div>
    </>
  );
}
