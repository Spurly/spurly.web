import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import { DataTable } from 'src/components/DataTable';
import { Button, useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/common/utils/apiError';
import { validateAndExtractProfiles } from 'src/common/utils/csvImport.js';
import importController from 'src/core/controllers/importController.js';
import { previewColumns } from './columns.jsx';

/**
 * CSV upload step of the Import page.
 *
 * Parses and previews a file, then stages it. Staging is free and reversible,
 * so there's no confirmation friction here — the review that matters happens
 * in the staging table afterwards, once rows have been enriched.
 */
export function UploadPanel({ onStaged }) {
  const fileInputRef = useRef(null);
  const toast = useToast();

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null); // { profiles, skippedCount }
  const [error, setError] = useState(null); // { title, detail, columns? }
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { savedCount, failedCount, totalCount }

  const resetAll = useCallback(() => {
    setFileName('');
    setParsed(null);
    setError(null);
    setSaving(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    // Guard against obviously-wrong file types before reading.
    const isCsv =
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      /\.csv$/i.test(file.name);
    if (!isCsv) {
      setParsed(null);
      setFileName('');
      setError({
        title: 'That doesn’t look like a CSV',
        detail: 'Please choose a comma-separated .csv file and try again.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const outcome = validateAndExtractProfiles(text);
      if (!outcome.ok) {
        setParsed(null);
        setFileName(file.name);
        setError(outcome.error);
        return;
      }
      setFileName(file.name);
      setParsed({ profiles: outcome.profiles, skippedCount: outcome.skippedCount });
    };
    reader.onerror = () => {
      setParsed(null);
      setError({
        title: "Couldn't read the file",
        detail: 'Something went wrong reading the file. Please try again.',
      });
    };
    reader.readAsText(file);
  }, []);

  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSave = async () => {
    if (!parsed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await importController.importProfiles({
        profiles: parsed.profiles,
        sourceFile: fileName,
      });
      setResult(res);
      onStaged?.(res);
      toast.success(`Imported ${(res?.savedCount ?? 0).toLocaleString()} leads`, {
        description: res?.failedCount
          ? `${res.failedCount.toLocaleString()} row(s) couldn't be saved.`
          : 'They are waiting in Staging.',
      });
    } catch (err) {
      /* The detail belongs in the panel — this is the user's workspace for
         fixing a bad CSV, and the block right here is where they're already
         looking. The toast just says what failed. */
      setError({
        title: "Couldn't save the import",
        detail: getApiErrorMessage(err, 'Something went wrong while saving. Try again in a moment.'),
      });
      toast.error(getToastError(err, "Couldn't save the import"));
    } finally {
      setSaving(false);
    }
  };

  const profileCount = parsed?.profiles.length ?? 0;

  // ── Success ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-14 px-[var(--ui-pad-lg)] rounded-[var(--ui-radius-lg)]"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        <div
          className="w-14 h-14 rounded-full grid place-items-center"
          style={{ background: 'var(--green-tint)' }}
        >
          <CheckCircle size={28} style={{ color: 'var(--green)' }} />
        </div>
        <div>
          <h2 className="text-[17px] font-medium text-[var(--text-primary)] tracking-[-0.012em]">
            Import complete
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1.5">
            Staged <span className="font-medium">{result.savedCount}</span> lead
            {result.savedCount === 1 ? '' : 's'}.
            {result.failedCount > 0 && (
              <>
                {' '}
                <span style={{ color: 'var(--red)' }}>
                  {result.failedCount} skipped (missing URL).
                </span>
              </>
            )}
          </p>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-2 max-w-sm">
            Next: enrich them to pull in emails, headlines and experience — then move
            the ones you want into Contacts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <Button variant="ghost" onClick={resetAll}>
            Import another
          </Button>
          <Button
            variant="primary"
            trailingIcon={<ArrowRight size={16} />}
            onClick={() => onStaged?.(result, { view: true })}
          >
            View staged leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Error banner (dismissible) */}
      {error && (
        <div
          className="relative flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)]"
          style={{ background: 'var(--red-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-[13px] font-medium" style={{ color: 'var(--red)' }}>
              {error.title}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {error.detail}
            </p>
            {error.columns?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Columns in your file:
                </span>
                {error.columns.map((col, i) => (
                  <code
                    key={i}
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-[var(--ui-radius-sm)]"
                    style={{
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    {col || '(blank)'}
                  </code>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!parsed && (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-3 py-16 px-[var(--ui-pad-lg)] rounded-[var(--ui-radius-lg)] cursor-pointer transition-colors"
            style={{
              background: dragActive ? 'var(--accent-tint)' : 'var(--surface-card)',
              border: `1.5px dashed ${dragActive ? 'var(--brand-purple)' : 'var(--border-default)'}`,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onInputChange}
              className="hidden"
            />
            <div
              className="w-14 h-14 rounded-[var(--ui-radius-lg)] grid place-items-center"
              style={{ background: 'var(--accent-tint)' }}
            >
              <UploadCloud size={26} style={{ color: 'var(--brand-purple)' }} />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                Drop a CSV here, or <span style={{ color: 'var(--brand-purple)' }}>browse</span>
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Your file must include <code className="font-mono">profileurl</code> and{' '}
                <code className="font-mono">name</code> columns.
              </p>
            </div>
          </label>

          <div
            className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)]"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
          >
            <FileText size={17} className="shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              <span className="font-medium text-[var(--text-primary)]">Expected format:</span> a
              header row with lowercase columns. <code className="font-mono">profileurl</code> and{' '}
              <code className="font-mono">name</code> are required;{' '}
              <code className="font-mono">title</code>, <code className="font-mono">company</code>,{' '}
              <code className="font-mono">location</code>, and{' '}
              <code className="font-mono">headline</code> are imported when present. A CSV exported
              from Spurly is directly re-importable.
            </div>
          </div>
        </>
      )}

      {/* Parsed preview + save */}
      {parsed && (
        <>
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[var(--ui-pad-lg)] py-4 rounded-[var(--ui-radius-lg)]"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
          >
            <p className="text-[14px] text-[var(--text-secondary)]">
              Ready to stage{' '}
              <span className="font-medium text-[var(--text-primary)]">{profileCount}</span> lead
              {profileCount === 1 ? '' : 's'}.{' '}
              <span style={{ color: 'var(--text-tertiary)' }}>
                Importing is free — you’re only charged when you enrich or move them to Contacts.
              </span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" onClick={resetAll} disabled={saving}>
                Choose different file
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Importing…' : `Import ${profileCount} lead${profileCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] px-1 -mt-2">
            <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">{fileName}</span>
              {' · '}
              {profileCount} valid lead{profileCount === 1 ? '' : 's'}
              {parsed.skippedCount > 0 && (
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {' · '}
                  {parsed.skippedCount} skipped (missing URL or name)
                </span>
              )}
            </span>
          </div>

          <div className="rounded-[var(--ui-radius-lg)] overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
            <DataTable
              columns={previewColumns}
              data={parsed.profiles}
              rowKey={(row) => row._id}
              emptyMessage="No leads to preview"
              maxHeight="52vh"
            />
          </div>
        </>
      )}
    </>
  );
}
