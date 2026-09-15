import { useState, useRef, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { UploadCloud, FileText, AlertCircle, CheckCircle, X, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { DataTable } from 'src/core/DataTable';
import { Button, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';
import {
  analyzeCsv,
  extractProfiles,
  normalizeMapping,
  validateMapping,
  autoDetectMapping,
  UNMAPPED,
  MAX_IMPORT_ROWS,
} from 'src/shared/utils/csvImport.js';
import { applyRememberedMapping, saveMapping } from './mappingMemory.js';
import importController from 'src/products/import/controller/import.js';
import { IMPORT_EVENTS } from 'src/products/import/constants/constants.js';
import { FieldMappingPanel } from './FieldMappingPanel.jsx';
import { buildPreviewColumns } from './columns.jsx';

/**
 * CSV upload step of the Import page.
 *
 * Three stages, in one panel:
 *
 *   1. `upload`  — drop a file. Only a truly unreadable file errors here.
 *   2. `map`     — confirm which column feeds which Spurly field. Headers no
 *                  longer have to be named `profileurl` / `name`; a mismatch
 *                  is a dropdown to change, not an error to go fix in Excel.
 *   3. `preview` — see the rows exactly as they'll be staged, then import.
 *
 * Staging is free and reversible, so there's no confirmation friction beyond
 * this — the review that matters happens in the staging table afterwards, once
 * rows have been enriched.
 */
export function UploadPanel({ onStaged }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [step, setStep] = useState('upload'); // 'upload' | 'map' | 'preview'
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState(null); // { headers, rows, sampleValues }
  const [mapping, setMapping] = useState(null); // { field: columnIndex }
  const [error, setError] = useState(null); // { title, detail, columns? }
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { savedCount, failedCount, totalCount }

  const resetAll = useCallback(() => {
    setStep('upload');
    setFileName('');
    setAnalysis(null);
    setMapping(null);
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
      setAnalysis(null);
      setMapping(null);
      setFileName('');
      setStep('upload');
      setError({
        title: 'That doesn’t look like a CSV',
        detail: 'Please choose a comma-separated .csv file and try again.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const outcome = analyzeCsv(text);
      if (!outcome.ok) {
        setAnalysis(null);
        setMapping(null);
        setFileName(file.name);
        setStep('upload');
        setError(outcome.error);
        return;
      }
      setFileName(file.name);
      setAnalysis({
        headers: outcome.headers,
        rows: outcome.rows,
        sampleValues: outcome.sampleValues,
      });
      setMapping(applyRememberedMapping(outcome.headers, outcome.mapping));
      setStep('map');
    };
    reader.onerror = () => {
      setAnalysis(null);
      setMapping(null);
      setStep('upload');
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

  // Rows shaped by the CURRENT mapping. Recomputed rather than stored so the
  // preview can never show one mapping's output while another is selected.
  const extracted = useMemo(() => {
    if (!analysis || !mapping) return null;
    if (!validateMapping(mapping).ok) return null;
    return extractProfiles(analysis.rows, mapping);
  }, [analysis, mapping]);

  const mappedKeys = useMemo(
    () =>
      mapping
        ? Object.keys(mapping).filter((key) => mapping[key] !== UNMAPPED)
        : [],
    [mapping],
  );
  const previewColumns = useMemo(() => buildPreviewColumns(mappedKeys), [mappedKeys]);

  const handleContinueFromMapping = () => {
    if (!analysis || !mapping) return;
    const clean = normalizeMapping(mapping, analysis.headers.length);
    if (!validateMapping(clean).ok) return;
    saveMapping(analysis.headers, clean);
    setMapping(clean);
    setError(null);
    setStep('preview');
  };

  const handleSave = () => {
    if (!extracted || extracted.profiles.length === 0 || saving) return;
    if (extracted.profiles.length > MAX_IMPORT_ROWS) return;
    setSaving(true);
    setError(null);

    eventEmitter.once(IMPORT_EVENTS.IMPORT_SUCCESS, (res) => {
      setSaving(false);
      setResult(res);
      onStaged?.(res);
      toast.success(`Imported ${(res?.savedCount ?? 0).toLocaleString()} leads`, {
        description: res?.failedCount
          ? `${res.failedCount.toLocaleString()} row(s) couldn't be saved.`
          : 'They are waiting in Staging.',
      });
    });

    eventEmitter.once(IMPORT_EVENTS.IMPORT_FAILURE, (err) => {
      setSaving(false);
      /* The detail belongs in the panel — this is the user's workspace for
         fixing a bad CSV, and the block right here is where they're already
         looking. The toast just says what failed. */
      setError({
        title: "Couldn't save the import",
        detail: getApiErrorMessage(err, 'Something went wrong while saving. Try again in a moment.'),
      });
      toast.error(getToastError(err, "Couldn't save the import"));
    });

    importController.importProfiles(eventEmitter, {
      profiles: extracted.profiles,
      sourceFile: fileName,
    });
  };

  const profileCount = extracted?.profiles.length ?? 0;
  const overLimit = profileCount > MAX_IMPORT_ROWS;

  /** Human summary of the rows the current mapping drops. */
  const skipSummary = useMemo(() => {
    if (!extracted) return '';
    const parts = [];
    if (extracted.skippedNoUrl) parts.push(`${extracted.skippedNoUrl} with no URL`);
    if (extracted.skippedBadUrl) parts.push(`${extracted.skippedBadUrl} with an unusable LinkedIn URL`);
    if (extracted.skippedNoName) parts.push(`${extracted.skippedNoName} with no name`);
    return parts.join(', ');
  }, [extracted]);

  // ── Success ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-14 px-[var(--ui-pad-lg)] rounded-[var(--ui-radius-lg)]"
        style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
      >
        <div
          className="w-14 h-14 rounded-full grid place-items-center"
          style={{ background: 'var(--ui-success-tint)' }}
        >
          <CheckCircle size={28} style={{ color: 'var(--ui-success)' }} />
        </div>
        <div>
          <h2 className="text-[var(--ui-t-section)] font-medium text-[var(--ui-text-primary)] tracking-[-0.012em]">
            Import complete
          </h2>
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1.5">
            Staged <span className="font-medium">{result.savedCount}</span> lead
            {result.savedCount === 1 ? '' : 's'}.
            {result.failedCount > 0 && (
              <>
                {' '}
                <span style={{ color: 'var(--ui-danger)' }}>
                  {result.failedCount} skipped (missing URL).
                </span>
              </>
            )}
          </p>
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)] mt-2 max-w-sm">
            Next: enrich them to pull in emails, headlines and experience — then send
            the ones you want to your Hub leads.
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
          style={{ background: 'var(--ui-danger-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-[var(--ui-t-body)] font-medium" style={{ color: 'var(--ui-danger)' }}>
              {error.title}
            </p>
            <p className="text-[var(--ui-t-body)] mt-0.5" style={{ color: 'var(--ui-text-secondary)' }}>
              {error.detail}
            </p>
            {error.columns?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[var(--ui-t-label)]" style={{ color: 'var(--ui-text-tertiary)' }}>
                  Columns in your file:
                </span>
                {error.columns.map((col, i) => (
                  <code
                    key={i}
                    className="text-[var(--ui-t-meta)] font-mono px-1.5 py-0.5 rounded-[var(--ui-radius-sm)]"
                    style={{
                      background: 'var(--ui-surface-sunken)',
                      color: 'var(--ui-text-secondary)',
                      border: '1px solid var(--ui-border-hairline)',
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
            className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-primary)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Step 1: pick a file ─────────────────────────────────────────── */}
      {step === 'upload' && (
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
              background: dragActive ? 'var(--ui-accent-tint)' : 'var(--ui-surface-card)',
              border: `1.5px dashed ${dragActive ? 'var(--ui-accent)' : 'var(--ui-border)'}`,
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
              style={{ background: 'var(--ui-accent-tint)' }}
            >
              <UploadCloud size={26} style={{ color: 'var(--ui-accent)' }} />
            </div>
            <div className="text-center">
              <p className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
                Drop a CSV here, or <span style={{ color: 'var(--ui-accent)' }}>browse</span>
              </p>
              <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1">
                Any column names work — you’ll match them to Spurly fields in the next step.
              </p>
            </div>
          </label>

          <div
            className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)]"
            style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
          >
            <SlidersHorizontal size={17} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-text-tertiary)' }} />
            <div className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-relaxed">
              <span className="font-medium text-[var(--ui-text-primary)]">Field mapping:</span> your
              file needs a LinkedIn profile URL and a name — but they can be called anything
              (“Person Linkedin Url”, “Full Name”, separate first/last name columns). We match the
              headers we recognise automatically and you confirm or change them before importing.{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">Job title</span>,{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">company</span>,{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">location</span>,{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">headline</span>,{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">email</span>,{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">phone</span> and{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">website</span> are imported
              when you map them. A CSV exported from Spurly maps itself.
            </div>
          </div>
        </>
      )}

      {/* ── Step 2: map columns ─────────────────────────────────────────── */}
      {step === 'map' && analysis && mapping && (
        <FieldMappingPanel
          headers={analysis.headers}
          sampleValues={analysis.sampleValues}
          mapping={mapping}
          rowCount={analysis.rows.length}
          fileName={fileName}
          onChange={setMapping}
          onBack={resetAll}
          onContinue={handleContinueFromMapping}
          onReset={() => setMapping(autoDetectMapping(analysis.headers))}
        />
      )}

      {/* ── Step 3: preview + import ────────────────────────────────────── */}
      {step === 'preview' && extracted && (
        <>
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[var(--ui-pad-lg)] py-4 rounded-[var(--ui-radius-lg)]"
            style={{ background: 'var(--ui-surface-card)', border: '1px solid var(--ui-border-hairline)' }}
          >
            <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              Ready to stage{' '}
              <span className="font-medium text-[var(--ui-text-primary)]">{profileCount}</span> lead
              {profileCount === 1 ? '' : 's'}.{' '}
              <span style={{ color: 'var(--ui-text-tertiary)' }}>
                Importing is free — you’re only charged when you enrich or send them to the Hub.
              </span>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" onClick={() => setStep('map')} disabled={saving}>
                Edit mapping
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || profileCount === 0 || overLimit}
              >
                {saving ? 'Importing…' : `Import ${profileCount} lead${profileCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[var(--ui-t-body)] px-1 -mt-2">
            <FileText size={14} style={{ color: 'var(--ui-text-tertiary)' }} />
            <span className="text-[var(--ui-text-secondary)]">
              <span className="font-medium text-[var(--ui-text-primary)]">{fileName}</span>
              {' · '}
              {profileCount} valid lead{profileCount === 1 ? '' : 's'}
              {skipSummary && (
                <span style={{ color: 'var(--ui-text-tertiary)' }}>
                  {' · '}
                  skipped {skipSummary}
                </span>
              )}
            </span>
          </div>

          {overLimit && (
            <div
              className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)]"
              style={{ background: 'var(--ui-danger-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
              <div className="text-[var(--ui-t-body)]" style={{ color: 'var(--ui-text-secondary)' }}>
                <p className="font-medium" style={{ color: 'var(--ui-danger)' }}>
                  This file is too big for one import
                </p>
                <p className="mt-0.5">
                  {profileCount.toLocaleString()} rows — the limit is{' '}
                  {MAX_IMPORT_ROWS.toLocaleString()} per import. Split the file and import each
                  part; your column mapping is remembered, so the next one is one click.
                </p>
              </div>
            </div>
          )}

          {profileCount === 0 && (
            <div
              className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)]"
              style={{ background: 'var(--ui-danger-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
              <div className="text-[var(--ui-t-body)]" style={{ color: 'var(--ui-text-secondary)' }}>
                <p className="font-medium" style={{ color: 'var(--ui-danger)' }}>
                  No rows can be imported with this mapping
                </p>
                <p className="mt-0.5">
                  Every row was skipped ({skipSummary}). Go back and check that the LinkedIn URL and
                  name columns point at the right data.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-[var(--ui-radius-lg)] overflow-hidden" style={{ border: '1px solid var(--ui-border-hairline)' }}>
            <DataTable
              columns={previewColumns}
              data={extracted.profiles}
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
