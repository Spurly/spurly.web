import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Dialog, Input, SoonTag, StatTile } from 'src/core/primitives';
import { ArrowRightIcon, ImportIcon, LinkIcon, SlidersIcon, SparkIcon } from 'src/core/icons';
import { FilterTagPicker } from './FilterTagPicker.jsx';
import { urlProblem } from './AudienceForm.jsx';

/**
 * "New audience" — the handoff's three-step modal (Leads v2):
 * SOURCE → REVIEW → RUN, progress as segment bars that fill left to right.
 *
 * Replaces the bottom dock. Everything it submits goes through the same
 * `createAudience` the dock's form used, with the same two payload shapes:
 * `{ searchUrl, name }` or `{ filters, name }`.
 *
 * Sources:
 *   describe — the plain-English brief. Needs the LLM filter-drafting pass
 *              that doesn't exist yet; shown, marked SOON, not selectable.
 *   url      — paste a LinkedIn search (real).
 *   filters  — build the search from LinkedIn's own filter ids (real — the
 *              old dock form's pickers, moved here).
 *   csv      — upload a file: the Import page owns that flow, so picking it
 *              goes there rather than duplicating a file uploader.
 */
const SOURCES = [
  {
    id: 'describe',
    icon: SparkIcon,
    title: 'Describe who you want',
    body: 'Plain English. Spurly turns it into LinkedIn filters and shows you them before anything runs.',
    soon: true,
  },
  {
    id: 'url',
    icon: LinkIcon,
    title: 'Paste a LinkedIn search',
    body: 'Already have a search you trust? Paste the URL and Spurly pages it in the background.',
  },
  {
    id: 'filters',
    icon: SlidersIcon,
    title: 'Build from filters',
    body: 'Location, industry, company, school, degree and title — LinkedIn’s own filters, picked here.',
  },
  {
    id: 'csv',
    icon: ImportIcon,
    title: 'Upload a CSV',
    body: 'Profile URLs or names plus companies. Opens the import page, which matches and enriches each row.',
  },
];

const STEPS = ['Source', 'Review', 'Run'];
const STEP_HINTS = [
  'Tell Spurly who you are looking for. Pick the way in you already have.',
  'Check the search before anything runs. Nothing has been queued yet.',
  'One last look before the worker starts paging LinkedIn.',
];

const NETWORK_DISTANCE_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd+' },
];

function MicroLabel({ children, htmlFor }) {
  const Tag = htmlFor ? 'label' : 'p';
  return (
    <Tag htmlFor={htmlFor} className="block ui-micro !text-[var(--ui-text-secondary)] mb-[7px]">
      {children}
    </Tag>
  );
}

function SourceOption({ source, active, onPick }) {
  const Icon = source.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={source.soon || undefined}
      onClick={() => !source.soon && onPick(source.id)}
      className={[
        'flex items-start gap-3 w-full px-3.5 py-[13px] rounded-[var(--ui-radius-md)] border text-left',
        'transition-[border-color,background-color,box-shadow] duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
        source.soon
          ? 'border-[var(--ui-border)] bg-[var(--ui-surface-card)] cursor-not-allowed opacity-70'
          : active
            ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-wash)] shadow-[var(--ui-hover-ring)]'
            : 'border-[var(--ui-border)] bg-[var(--ui-surface-card)] hover:border-[var(--ui-accent-border)]',
      ].join(' ')}
    >
      <span
        className={`grid place-items-center w-[30px] h-[30px] rounded-[var(--ui-radius-btn)] shrink-0 transition-colors ${
          active ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-on)]' : 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
        }`}
      >
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)]">
          {source.title}
          {source.soon && <SoonTag />}
        </span>
        <span className="block text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5] mt-0.5">
          {source.body}
        </span>
      </span>
      <span
        className={`grid place-items-center w-4 h-4 rounded-full shrink-0 mt-0.5 border-[1.5px] transition-colors ${
          active ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]' : 'border-[var(--ui-border-strong)]'
        }`}
      >
        <span className={`w-[5px] h-[5px] rounded-full bg-[var(--ui-accent-on)] ${active ? 'opacity-100' : 'opacity-0'}`} />
      </span>
    </button>
  );
}

export function NewAudienceModal({ open, onClose, onSubmit, submitting = false, creditBalance = 0 }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState('url');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState([]);
  const [industry, setIndustry] = useState([]);
  const [company, setCompany] = useState([]);
  const [pastCompany, setPastCompany] = useState([]);
  const [school, setSchool] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [networkDistance, setNetworkDistance] = useState([]);

  /* Close once a submit finishes (success toasts, failure toasts — either
     way the page has the answer, and a failure keeps its reason visible). */
  const wasSubmitting = useRef(false);
  useEffect(() => {
    if (wasSubmitting.current && !submitting) onClose();
    wasSubmitting.current = submitting;
  }, [submitting, onClose]);

  const urlError = source === 'url' ? urlProblem(url) : null;

  const filterCount =
    location.length + industry.length + company.length + pastCompany.length + school.length +
    networkDistance.length + (keywords.trim() ? 1 : 0) + (title.trim() ? 1 : 0);

  const filters = useMemo(() => {
    const f = {};
    if (keywords.trim()) f.keywords = keywords.trim();
    if (location.length) f.location = location.map((v) => v.id);
    if (industry.length) f.industry = industry.map((v) => v.id);
    if (company.length) f.company = company.map((v) => v.id);
    if (pastCompany.length) f.past_company = pastCompany.map((v) => v.id);
    if (school.length) f.school = school.map((v) => v.id);
    if (networkDistance.length) f.network_distance = networkDistance;
    if (title.trim()) f.advanced_keywords = { title: title.trim() };
    return f;
  }, [keywords, location, industry, company, pastCompany, school, networkDistance, title]);

  const stepValid =
    step === 0
      ? source === 'csv' || (source === 'url' ? url.trim() && !urlError : source === 'filters')
      : step === 1
        ? source === 'url'
          ? url.trim() && !urlError
          : filterCount > 0
        : true;

  const next = () => {
    if (!stepValid || submitting) return;
    if (step === 0 && source === 'csv') {
      onClose();
      navigate('/dashboard/import');
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    onSubmit(source === 'url' ? { searchUrl: url.trim(), name: name.trim() } : { filters, name: name.trim() });
  };

  const toggleDistance = (d) =>
    setNetworkDistance((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const summary = [
    ['Source', source === 'url' ? 'LinkedIn search URL' : 'LinkedIn filters'],
    ['Audience name', name.trim() || 'Named for you after the search'],
    source === 'url'
      ? ['Search', url.trim()]
      : ['Filters', `${filterCount} ${filterCount === 1 ? 'filter' : 'filters'} selected`],
    ['Pace', 'Ten results per call, in the background'],
    ['Credits', `${creditBalance.toLocaleString()} available`],
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New audience"
      description={STEP_HINTS[step]}
      size="xl"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-neutral-400)] whitespace-nowrap">
            Step {step + 1} of 3
          </span>
          <div className="flex-1" />
          <Button onClick={() => (step === 0 ? onClose() : setStep(step - 1))} disabled={submitting}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="primary"
            onClick={next}
            disabled={!stepValid}
            loading={submitting}
            trailingIcon={step < 2 ? <ArrowRightIcon size={14} strokeWidth={2} /> : null}
          >
            {step === 0 && source === 'csv' ? 'Go to import' : step < 2 ? 'Continue' : submitting ? 'Queueing…' : 'Run import'}
          </Button>
        </>
      }
    >
      {/* Segment bars, never numbered circles (spurlyDESIGN.md). */}
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 min-w-0">
            <span
              className={`block mb-[7px] ui-micro transition-colors ${
                i <= step ? '!text-[var(--ui-accent-fg)]' : '!text-[var(--ui-text-quaternary)]'
              }`}
            >
              {label}
            </span>
            <div className="h-[var(--ui-meter-h)] rounded-[var(--ui-radius-pill)] bg-[var(--ui-meter-track)] overflow-hidden">
              <div
                className="h-full rounded-[var(--ui-radius-pill)] bg-[var(--ui-accent)] transition-[width] duration-[320ms] ease-[cubic-bezier(.32,.72,0,1)]"
                style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="sp-rise">
          <div role="radiogroup" aria-label="Source" className="flex flex-col gap-2">
            {SOURCES.map((s) => (
              <SourceOption key={s.id} source={s} active={source === s.id} onPick={setSource} />
            ))}
          </div>

          {source === 'url' && (
            <div className="mt-3.5">
              <MicroLabel htmlFor="audience-url">LinkedIn search URL</MicroLabel>
              <textarea
                id="audience-url"
                rows={3}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/?keywords=…"
                aria-invalid={Boolean(urlError) || undefined}
                className={`w-full px-3 py-[11px] rounded-[var(--ui-radius-md)] border bg-[var(--ui-surface-card)] font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)] leading-[1.55] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-neutral-400)] resize-none outline-none transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] ${
                  urlError ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]'
                }`}
              />
              <p
                className={`mt-2 text-[length:var(--ui-t-label)] leading-[1.5] ${
                  urlError ? 'text-[var(--ui-danger-fg)]' : 'text-[var(--ui-text-quaternary)]'
                }`}
              >
                {urlError || 'Classic search returns no total, so progress is reported as a count, not a bar.'}
              </p>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="sp-rise flex flex-col gap-5">
          {source === 'url' ? (
            <div className="flex items-start gap-2.5 px-[13px] py-[11px] rounded-[var(--ui-radius-md)] border border-[var(--ui-accent-tint-strong)] bg-[var(--ui-accent-wash)]">
              <LinkIcon size={14} className="mt-0.5 shrink-0 text-[var(--ui-accent)]" />
              <p className="min-w-0 break-all font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)] leading-[1.5]">
                {url.trim()}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FilterTagPicker type="LOCATION" label="Location" placeholder="Search a city or region…" value={location} onChange={setLocation} disabled={submitting} />
              <FilterTagPicker type="INDUSTRY" label="Industry" placeholder="Search an industry…" value={industry} onChange={setIndustry} disabled={submitting} />
              <FilterTagPicker type="COMPANY" label="Current company" placeholder="Search a company…" value={company} onChange={setCompany} disabled={submitting} />
              <FilterTagPicker type="COMPANY" label="Past company" placeholder="Search a company…" value={pastCompany} onChange={setPastCompany} disabled={submitting} />
              <FilterTagPicker type="SCHOOL" label="School" placeholder="Search a school…" value={school} onChange={setSchool} disabled={submitting} />
              <div>
                <MicroLabel>Connection degree</MicroLabel>
                <div className="inline-flex gap-1 p-1 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)]" role="group" aria-label="Connection degree">
                  {NETWORK_DISTANCE_OPTIONS.map((opt) => {
                    const active = networkDistance.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleDistance(opt.value)}
                        aria-pressed={active}
                        className={`h-[26px] px-3 rounded-[var(--ui-radius-xs)] text-[length:var(--ui-t-label)] font-medium transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ${
                          active
                            ? 'bg-[var(--ui-surface-card)] text-[var(--ui-accent-fg)] shadow-[var(--ui-shadow-sm)]'
                            : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <MicroLabel htmlFor="audience-keywords">Keywords</MicroLabel>
                <Input id="audience-keywords" size="sm" fullWidth value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. co-founder" />
              </div>
              <div>
                <MicroLabel htmlFor="audience-title">Title contains</MicroLabel>
                <Input id="audience-title" size="sm" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VP Sales" />
              </div>
            </div>
          )}

          <div>
            <MicroLabel htmlFor="audience-name">Audience name</MicroLabel>
            <Input id="audience-name" size="sm" fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. EU logistics — VP+ (optional)" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <StatTile size="sm" label="Estimated matches" soon />
            <StatTile size="sm" label="Predicted fit ≥ 70" soon />
            <StatTile size="sm" label="Credits" value={creditBalance.toLocaleString()} caption="available" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="sp-rise">
          <div className="flex items-center gap-[11px] p-3.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-accent-tint-strong)] bg-[var(--ui-accent-wash)] shadow-[inset_2px_0_0_var(--ui-accent)]">
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--ui-accent)] sp-pulse shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)]">Ready to run</p>
              <p className="mt-[3px] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-[1.5]">
                LinkedIn returns ten results per call, so this imports in the background over a few minutes. You can
                leave the page — the count on Leads ticks up as pages come back.
              </p>
            </div>
          </div>

          <p className="mt-[18px] mb-[9px] ui-micro !text-[var(--ui-text-secondary)]">Summary</p>
          <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-neutral-150)] overflow-hidden">
            {summary.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 px-[13px] py-[11px] border-b border-[var(--ui-border-hairline)] last:border-b-0">
                <span className="w-[132px] shrink-0 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] uppercase tracking-[0.09em] text-[var(--ui-text-secondary)]">
                  {k}
                </span>
                <span className="flex-1 min-w-0 text-right truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-primary)]" title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3.5 flex items-start gap-2.5 opacity-70">
            <Checkbox checked={false} disabled onChange={() => {}} aria-label="Enrich and score on arrival" />
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-body)] leading-[1.5]">
              Enrich and score every lead as it arrives, so the table is sorted by fit before you open it.{' '}
              <SoonTag className="align-middle" />
            </span>
          </div>
        </div>
      )}
    </Dialog>
  );
}
