import { useState, useRef, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import {
  UploadCloud, FileText, AlertCircle, X, ArrowLeft, ArrowRight, Download, Link2, Search, Ban, ShieldCheck,
} from 'lucide-react';
import { DataTable } from 'src/core/DataTable';
import { Button, Dialog, IconButton, Input, useToast } from 'src/core/primitives';
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
import { ImportStepper } from './ImportStepper.jsx';
import { buildPreviewColumns } from './columns.jsx';

/**
 * The import wizard: Upload → Match columns → Review & import.
 *
 * One bar on top carries the stepper (where am I) AND the step's actions
 * (what next), so the primary button never moves and never scrolls away.
 * After a successful import there is no success screen — `onDone` drops the
 * user straight into the pipeline, at the stage their rows just entered,
 * where they can watch them move.
 */

const SAMPLE_CSV = [
  'First Name,Last Name,Company,Job Title,Location,LinkedIn URL',
  'Ada,Lovelace,Analytical Engines,Founder,London,https://www.linkedin.com/in/example-ada',
  'Grace,Hopper,Compiler Co,Engineering Lead,New York,',
].join('\n');

function downloadSample() {
  const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spurly-import-sample.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Mirrors the backend's fallback list name (lookup.js#audienceNameFor). */
function defaultListName(fileName) {
  const now = new Date();
  const base = String(fileName || '').replace(/\.csv$/i, '').trim() || 'Import';
  return `${base} · ${now.getDate()} ${SHORT_MONTHS[now.getMonth()]} ${now.getFullYear()}`.slice(0, 200);
}

const card = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)]';

function OutcomeTile({ icon, tone, tint, value, label, caption }) {
  return (
    <div className={`${card} p-4 flex gap-3 min-w-0`}>
      <span className="w-9 h-9 shrink-0 rounded-[var(--ui-radius-md)] grid place-items-center" style={{ background: tint, color: tone }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="ui-num text-[length:var(--ui-t-section)] leading-tight text-[var(--ui-text-primary)]">{value.toLocaleString()}</p>
        <p className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]">{label}</p>
        {caption && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">{caption}</p>}
      </div>
    </div>
  );
}

export function UploadPanel({ onDone, onCancel }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [step, setStep] = useState('upload'); // 'upload' | 'map' | 'review'
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState(null); // { headers, rows, sampleValues }
  const [mapping, setMapping] = useState(null);
  const [error, setError] = useState(null); // { title, detail }
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  // The "Name this list" step: every person from this upload lands in one
  // Hub list, so it is named once, right before importing.
  const [naming, setNaming] = useState(false);
  const [listName, setListName] = useState('');

  const resetFile = useCallback(() => {
    setStep('upload');
    setFileName('');
    setAnalysis(null);
    setMapping(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setError(null);
    const isCsv = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || /\.csv$/i.test(file.name);
    if (!isCsv) {
      setError({ title: 'That doesn’t look like a CSV', detail: 'Choose a comma-separated .csv file. From Excel or Google Sheets: File → Download → CSV.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const outcome = analyzeCsv(event.target?.result);
      if (!outcome.ok) {
        setFileName(file.name);
        setError(outcome.error);
        return;
      }
      setFileName(file.name);
      setAnalysis({ headers: outcome.headers, rows: outcome.rows, sampleValues: outcome.sampleValues });
      setMapping(applyRememberedMapping(outcome.headers, outcome.mapping));
      setStep('map');
    };
    reader.onerror = () => setError({ title: "Couldn't read the file", detail: 'Something went wrong reading it. Try again.' });
    reader.readAsText(file);
  }, []);

  const extracted = useMemo(() => {
    if (!analysis || !mapping || !validateMapping(mapping).ok) return null;
    return extractProfiles(analysis.rows, mapping);
  }, [analysis, mapping]);

  const mappedKeys = useMemo(() => (mapping ? Object.keys(mapping).filter((k) => mapping[k] !== UNMAPPED) : []), [mapping]);
  const previewColumns = useMemo(() => buildPreviewColumns(mappedKeys), [mappedKeys]);
  const previewRows = useMemo(() => (extracted ? [...extracted.profiles, ...extracted.lookupRows] : []), [extracted]);

  const readyCount = extracted?.profiles.length ?? 0;
  const findCount = extracted?.lookupRows.length ?? 0;
  const totalCount = readyCount + findCount;
  const skipped = extracted?.skippedCount ?? 0;
  const overLimit = readyCount > MAX_IMPORT_ROWS || findCount > MAX_IMPORT_ROWS;

  const skipReasons = useMemo(() => {
    if (!extracted) return '';
    const parts = [];
    if (extracted.skippedNoUrl) parts.push(`${extracted.skippedNoUrl} with no URL or company`);
    if (extracted.skippedBadUrl) parts.push(`${extracted.skippedBadUrl} with a broken LinkedIn URL`);
    if (extracted.skippedNoName) parts.push(`${extracted.skippedNoName} with no name`);
    return parts.join(', ');
  }, [extracted]);

  const goToReview = () => {
    if (!analysis || !mapping) return;
    const clean = normalizeMapping(mapping, analysis.headers.length);
    if (!validateMapping(clean).ok) return;
    saveMapping(analysis.headers, clean);
    setMapping(clean);
    setStep('review');
  };

  const openNaming = () => {
    if (!extracted || saving || totalCount === 0 || overLimit) return;
    setListName(defaultListName(fileName));
    setNaming(true);
  };

  const handleImport = () => {
    if (!extracted || saving || totalCount === 0 || overLimit) return;
    setSaving(true);
    setError(null);

    eventEmitter.once(IMPORT_EVENTS.IMPORT_SUCCESS, (res) => {
      setSaving(false);
      const parts = [];
      if (res.sentToHub) parts.push(`${res.sentToHub.toLocaleString()} going to your Hub`);
      if (res.finding) parts.push(`finding ${res.finding.toLocaleString()} on LinkedIn`);
      toast.success(`Importing ${fileName}`, {
        description: [parts.join(' · '), res.audience?.name ? `Leads land in “${res.audience.name}”.` : '']
          .filter(Boolean)
          .join(' '),
      });
      setNaming(false);
      onDone?.(res);
    });
    eventEmitter.once(IMPORT_EVENTS.IMPORT_FAILURE, (err) => {
      setSaving(false);
      setNaming(false);
      setError({ title: "Couldn't import this file", detail: getApiErrorMessage(err, 'Something went wrong. Try again in a moment.') });
      toast.error(getToastError(err, "Couldn't import this file"));
    });

    importController.importProfiles(eventEmitter, {
      profiles: extracted.profiles,
      lookupRows: extracted.lookupRows,
      sourceFile: fileName,
      listName: listName.trim(),
    });
  };

  const importLabel = `Import ${totalCount.toLocaleString()} ${totalCount === 1 ? 'row' : 'rows'}`;

  // ── The bar: stepper left, the step's actions right ─────────────────
  const bar = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[38px]">
      <div className="flex items-center gap-4 min-w-0">
        <ImportStepper step={step} />
        {fileName && step !== 'upload' && (
          <span className="hidden lg:inline-flex items-center gap-1.5 min-w-0 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
            <FileText size={13} />
            <span className="truncate max-w-[220px]" title={fileName}>{fileName}</span>
            {analysis && <span>· {analysis.rows.length.toLocaleString()} rows</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {step === 'upload' && onCancel && (
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
        {step === 'map' && (
          <>
            <Button variant="ghost" leadingIcon={<ArrowLeft size={14} />} onClick={resetFile}>Different file</Button>
            <Button variant="primary" trailingIcon={<ArrowRight size={14} />} onClick={goToReview} disabled={!extracted}>
              Continue
            </Button>
          </>
        )}
        {step === 'review' && (
          <>
            <Button variant="ghost" leadingIcon={<ArrowLeft size={14} />} onClick={() => setStep('map')} disabled={saving}>Back</Button>
            <Button variant="primary" onClick={openNaming} disabled={saving || totalCount === 0 || overLimit}>
              {importLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const errorBanner = error && (
    <div className="relative flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)] bg-[var(--ui-danger-tint)]">
      <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-[length:var(--ui-t-body)] font-medium" style={{ color: 'var(--ui-danger)' }}>{error.title}</p>
        <p className="text-[length:var(--ui-t-body)] mt-0.5 text-[var(--ui-text-secondary)]">{error.detail}</p>
      </div>
      <span className="absolute top-2.5 right-2.5">
        <IconButton size="sm" icon={<X size={14} />} label="Dismiss" onClick={() => setError(null)} />
      </span>
    </div>
  );

  const nameDialog = (
    <Dialog
      open={naming}
      onClose={() => !saving && setNaming(false)}
      size="sm"
      title="Name this list"
      description="Everyone from this file lands in your Leads under this list, so you can filter to them and build a sequence."
      footer={
        <>
          <Button variant="ghost" onClick={() => setNaming(false)} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleImport} loading={saving} disabled={saving}>
            {importLabel}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleImport();
        }}
      >
        <label htmlFor="import-list-name" className="block text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-1.5">
          List name
        </label>
        <Input
          id="import-list-name"
          fullWidth
          autoFocus
          maxLength={200}
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder={defaultListName(fileName)}
        />
        <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-1.5">
          {readyCount > 0 && `${readyCount.toLocaleString()} go in now`}
          {readyCount > 0 && findCount > 0 && ' · '}
          {findCount > 0 && `${findCount.toLocaleString()} join as Spurly finds them on LinkedIn`}
          {'. Leave it blank to use the file name.'}
        </p>
      </form>
    </Dialog>
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1200px]">
      {nameDialog}
      {bar}
      {errorBanner}

      {/* ── 1. Upload ───────────────────────────────────────────────── */}
      {step === 'upload' && (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center justify-center gap-3.5 py-12 px-[var(--ui-pad-lg)] rounded-[var(--ui-radius-lg)] cursor-pointer transition-colors"
            style={{
              background: dragActive ? 'var(--ui-accent-tint)' : 'var(--ui-surface-card)',
              border: `1.5px dashed ${dragActive ? 'var(--ui-accent)' : 'var(--ui-border)'}`,
            }}
          >
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
            <span className="w-14 h-14 rounded-[var(--ui-radius-lg)] grid place-items-center bg-[var(--ui-accent-tint)]">
              <UploadCloud size={26} style={{ color: 'var(--ui-accent)' }} />
            </span>
            <div className="text-center">
              <p className="text-[length:var(--ui-t-section)] font-medium text-[var(--ui-text-primary)] tracking-[-0.012em]">
                {dragActive ? 'Drop it here' : 'Drop your CSV here'}
              </p>
              <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1">
                or <span className="font-medium text-[var(--ui-accent-fg)]">browse your files</span> · up to {MAX_IMPORT_ROWS.toLocaleString()} rows · any column names
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Download size={13} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadSample();
              }}
            >
              Download a sample CSV
            </Button>
          </label>

          <div className={`${card} grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--ui-border-hairline)]`}>
            {[
              {
                icon: <Link2 size={15} />, tone: 'var(--ui-success)', tint: 'var(--ui-success-tint)',
                title: 'Have LinkedIn URLs?',
                body: 'Rows with a profile URL go straight to your Hub Leads.',
              },
              {
                icon: <Search size={15} />, tone: 'var(--ui-accent)', tint: 'var(--ui-accent-tint)',
                title: 'Only names and companies?',
                body: 'Spurly finds each person on LinkedIn and adds every match to your Leads.',
              },
              {
                icon: <ShieldCheck size={15} />, tone: 'var(--ui-text-secondary)', tint: 'var(--ui-surface-sunken)',
                title: 'Free to import',
                body: 'Credits are used only for leads that land in your Hub.',
              },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3 p-4">
                <span className="w-8 h-8 shrink-0 rounded-[var(--ui-radius-md)] grid place-items-center" style={{ color: tip.tone, background: tip.tint }}>
                  {tip.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">{tip.title}</p>
                  <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5 leading-snug">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 2. Match columns ────────────────────────────────────────── */}
      {step === 'map' && analysis && mapping && (
        <FieldMappingPanel
          headers={analysis.headers}
          sampleValues={analysis.sampleValues}
          rows={analysis.rows}
          mapping={mapping}
          onChange={setMapping}
          onReset={() => setMapping(autoDetectMapping(analysis.headers))}
        />
      )}

      {/* ── 3. Review & import ──────────────────────────────────────── */}
      {step === 'review' && extracted && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <OutcomeTile
              icon={<Link2 size={17} />}
              tone="var(--ui-success)"
              tint="var(--ui-success-tint)"
              value={readyCount}
              label="Straight to your Hub"
              caption="They have a LinkedIn URL"
            />
            <OutcomeTile
              icon={<Search size={17} />}
              tone="var(--ui-accent)"
              tint="var(--ui-accent-tint)"
              value={findCount}
              label="Spurly will find"
              caption={findCount ? 'Searched on LinkedIn by name + company' : 'Every row has a URL'}
            />
            <OutcomeTile
              icon={<Ban size={17} />}
              tone="var(--ui-text-tertiary)"
              tint="var(--ui-surface-sunken)"
              value={skipped}
              label="Skipped"
              caption={skipped ? skipReasons : 'Nothing left out'}
            />
          </div>

          {findCount > 0 && (
            <div className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)] bg-[var(--ui-accent-wash)] border border-[var(--ui-accent-tint)]">
              <Search size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-accent)' }} />
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                <span className="font-medium text-[var(--ui-text-primary)]">How finding works: </span>
                Spurly searches LinkedIn for each name at its company and sends every match to your Hub — if three
                Falguni Nayars work at Nykaa, all three are added. People whose name only partly matches, or who
                don’t work there, are left out. Filter them in <span className="font-medium text-[var(--ui-text-primary)]">Leads</span>.
              </p>
            </div>
          )}

          {overLimit && (
            <div className="flex gap-3 px-4 py-3.5 rounded-[var(--ui-radius-lg)] bg-[var(--ui-danger-tint)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-danger)' }} />
              <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
                <span className="font-medium" style={{ color: 'var(--ui-danger)' }}>Too many rows for one import. </span>
                The limit is {MAX_IMPORT_ROWS.toLocaleString()} per import — split the file. Your column matching is remembered.
              </p>
            </div>
          )}

          <div className={`${card} overflow-hidden`}>
            <DataTable
              columns={previewColumns}
              data={previewRows}
              rowKey={(row) => row._id}
              emptyMessage="No rows to import with this matching"
              emptyHint="Go back and check the name, LinkedIn URL and company columns."
              maxHeight="52vh"
            />
          </div>
        </>
      )}
    </div>
  );
}
