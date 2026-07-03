import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { DataTable } from 'src/common/components/DataTable';
import { Input } from 'src/common/components/Input';
import { Button } from 'src/common/components/Button';
import { validateAndExtractProfiles } from 'src/common/utils/csvImport.js';
import importController from 'src/core/controllers/importController.js';
import { previewColumns } from './columns.jsx';

/** Strip a .csv extension to seed a friendly default session name. */
function defaultSessionName(fileName) {
  const base = (fileName || '').replace(/\.csv$/i, '').trim();
  return base || `CSV Import — ${new Date().toLocaleDateString()}`;
}

export function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null); // { profiles, skippedCount }
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState(null); // { title, detail, columns? }
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { savedCount, sessionName, sessionId }

  const resetAll = useCallback(() => {
    setFileName('');
    setParsed(null);
    setSessionName('');
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
      setSessionName(defaultSessionName(file.name));
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

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleSave = async () => {
    if (!parsed || !sessionName.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await importController.importProfiles({
        sessionName: sessionName.trim(),
        profiles: parsed.profiles,
      });
      setResult(res);
    } catch (err) {
      setError({
        title: "Couldn't save the import",
        detail:
          err?.message ||
          'Something went wrong while saving. Please try again in a moment.',
      });
    } finally {
      setSaving(false);
    }
  };

  const profileCount = parsed?.profiles.length ?? 0;

  return (
    <DashboardLayout
      title="Import"
      subtitle="Upload a CSV of LinkedIn profiles to create a new session."
    >
      <div className="p-7 flex flex-col gap-6 w-full max-w-[1100px]">
        {/* Success state ------------------------------------------------ */}
        {result ? (
          <div
            className="flex flex-col items-center text-center gap-4 py-14 px-6 rounded-[20px]"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full grid place-items-center"
              style={{ background: 'var(--green-tint)' }}
            >
              <CheckCircle size={28} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[var(--text-primary)] tracking-[-0.014em]">
                Import complete
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1.5">
                Saved <span className="font-semibold">{result.savedCount}</span>{' '}
                profile{result.savedCount === 1 ? '' : 's'} into{' '}
                <span className="font-semibold">“{result.sessionName}”</span>.
                {result.failedCount > 0 && (
                  <>
                    {' '}
                    <span style={{ color: 'var(--red)' }}>
                      {result.failedCount} failed.
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <Button variant="ghost" onClick={resetAll}>
                Import another
              </Button>
              <Button
                variant="primary"
                trailingIcon={<ArrowRight size={16} />}
                onClick={() => navigate('/dashboard/leads')}
              >
                View People
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Error banner (dismissible) ------------------------------- */}
            {error && (
              <div
                className="relative flex gap-3 px-4 py-3.5 rounded-[14px]"
                style={{
                  background: 'var(--red-tint)',
                  border: '1px solid rgba(255,69,58,0.22)',
                }}
              >
                <AlertCircle
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--red)' }}
                />
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-[13.5px] font-semibold" style={{ color: 'var(--red)' }}>
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
                          className="text-[11.5px] font-mono px-1.5 py-0.5 rounded-[6px]"
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
                  className="absolute top-3 right-3 w-6 h-6 grid place-items-center rounded-[7px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload zone --------------------------------------------- */}
            {!parsed && (
              <>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  className="flex flex-col items-center justify-center gap-3 py-16 px-6 rounded-[20px] cursor-pointer transition-all"
                  style={{
                    background: dragActive ? 'var(--accent-tint)' : 'var(--surface-card)',
                    border: `1.5px dashed ${
                      dragActive ? 'var(--brand-purple)' : 'var(--border-default)'
                    }`,
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
                    className="w-14 h-14 rounded-[16px] grid place-items-center"
                    style={{ background: 'var(--accent-tint)' }}
                  >
                    <UploadCloud size={26} style={{ color: 'var(--brand-purple)' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Drop a CSV here, or{' '}
                      <span style={{ color: 'var(--brand-purple)' }}>browse</span>
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                      Your file must include <code className="font-mono">profileurl</code> and{' '}
                      <code className="font-mono">name</code> columns.
                    </p>
                  </div>
                </label>

                {/* Format hint */}
                <div
                  className="flex gap-3 px-4 py-3.5 rounded-[14px]"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <FileText size={17} className="shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--text-primary)]">Expected format:</span>{' '}
                    a header row with lowercase columns. <code className="font-mono">profileurl</code> and{' '}
                    <code className="font-mono">name</code> are required; <code className="font-mono">title</code>,{' '}
                    <code className="font-mono">company</code>, <code className="font-mono">location</code>, and{' '}
                    <code className="font-mono">headline</code> are imported when present. A CSV exported from
                    Spurly is directly re-importable.
                  </div>
                </div>
              </>
            )}

            {/* Parsed preview + save ------------------------------------ */}
            {parsed && (
              <>
                {/* Session name + summary bar */}
                <div
                  className="flex flex-col sm:flex-row sm:items-end gap-4 px-5 py-4 rounded-[16px]"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <Input
                      label="Session name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Name this import"
                      disabled={saving}
                      maxLength={100}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" onClick={resetAll} disabled={saving}>
                      Choose different file
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving || !sessionName.trim()}
                    >
                      {saving
                        ? 'Importing…'
                        : `Import ${profileCount} profile${profileCount === 1 ? '' : 's'}`}
                    </Button>
                  </div>
                </div>

                {/* Summary line */}
                <div className="flex items-center gap-2 text-[13px] px-1 -mt-2">
                  <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">{fileName}</span>
                    {' · '}
                    {profileCount} valid profile{profileCount === 1 ? '' : 's'}
                    {parsed.skippedCount > 0 && (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {' · '}
                        {parsed.skippedCount} skipped (missing URL or name)
                      </span>
                    )}
                  </span>
                </div>

                {/* Preview table — same DataTable as Captured People */}
                <div
                  className="rounded-[16px] overflow-hidden"
                  style={{ border: '1px solid var(--border-hairline)' }}
                >
                  <DataTable
                    columns={previewColumns}
                    data={parsed.profiles}
                    rowKey={(row) => row._id}
                    emptyMessage="No profiles to preview"
                    maxHeight="52vh"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
