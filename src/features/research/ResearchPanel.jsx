import { useCallback, useEffect, useState } from 'react';
import { Globe, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import researchApi from 'src/core/gateway/researchApi.js';
import { useToast } from 'src/ui/primitives';
import { getToastError, getApiErrorMessage } from 'src/common/utils/apiError';

/**
 * Live web research about a lead and their employer, rendered in the lead
 * sidebar.
 *
 * For the USER to read before making contact. It is deliberately never fed into
 * a generated message: a wrong fact here is visible and ignorable, whereas a
 * wrong fact in a sent note reaches the recipient and can't be recalled.
 *
 * Three things the UI has to get right, all about trust:
 *
 * 1. NEVER RUN ON OPEN. Research costs seconds, quota and credits, so it takes
 *    an explicit click. Opening a lead only does the free read.
 *
 * 2. SHOW WHAT WASN'T FOUND. Every field is nullable — "no funding information
 *    found" is a real, useful answer. Hiding empty fields would leave the user
 *    unable to tell "we looked and found nothing" from "we didn't look".
 *
 * 3. SOURCES ARE THE POINT. Without them this is just a confident-sounding
 *    paragraph. The server strips linkedin.com citations before they get here,
 *    because LinkedIn blocks automated access and such a link would claim a
 *    grounding that doesn't exist.
 */

function unwrap(res, fallback) {
  if (!res?.success) throw new Error(res?.message || fallback);
  return res.data;
}

/** A labelled fact, rendered as "not found" when absent rather than hidden. */
function Fact({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
        {label}
      </span>
      {value ? (
        <span className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed">{value}</span>
      ) : (
        <span className="text-[12px] italic text-[var(--ui-text-tertiary)]">
          Nothing found
        </span>
      )}
    </div>
  );
}

function Bullets({ label, items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed pl-3 relative"
          >
            <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-[var(--ui-text-tertiary)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string} props.personId
 */
export function ResearchPanel({ personId }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // Free read on open. A 4xx/5xx here is not worth a scary message — it just
  // means we can't show a cached briefing, and the Research button still works.
  useEffect(() => {
    let alive = true;

    researchApi
      .get(personId)
      .then((res) => {
        if (alive) setData(res?.data || null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [personId]);

  const run = useCallback(
    async (refresh = false) => {
      setRunning(true);
      setError(null);

      try {
        const result = unwrap(await researchApi.run(personId, refresh), 'Research failed');
        setData(result);
        toast.success(
          refresh ? 'Research refreshed' : 'Research complete',
          result?.foundCount === 0
            ? { description: 'Nothing solid turned up for this lead.' }
            : undefined,
        );
      } catch (err) {
        /* The split that matters. Research failures are frequently operator
           diagnostics — token budgets, model names, plan tiers — so the toast
           says only what the user tried to do, and the full server text stays
           in the panel below, where there's room and it's actually useful. */
        setError(getApiErrorMessage(err, 'Research failed. Try again.'));
        toast.error(getToastError(err, "Couldn't research this lead"));
      } finally {
        setRunning(false);
      }
    },
    [personId, toast],
  );

  if (loading) {
    return <p className="text-[12px] text-[var(--ui-text-tertiary)]">Checking…</p>;
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-[12px] text-[var(--ui-text-secondary)] leading-relaxed">
          Search the web for what their company does, any recent news, and anything this person has
          published outside LinkedIn.
        </p>
        {/* Setting the expectation up front is cheaper than a spinner that
            looks stuck. This genuinely takes several seconds. */}
        <p className="text-[11px] text-[var(--ui-text-tertiary)]">
          Takes about 10 seconds. LinkedIn itself can&apos;t be read — it blocks automated access.
        </p>

        {error && (
          <p
            className="flex items-start gap-1.5 text-[12px] px-2.5 py-2 rounded-[var(--ui-radius-md)]"
            style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
          >
            <AlertTriangle size={13} className="shrink-0 mt-px" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => run(false)}
          disabled={running}
          className="inline-flex self-start items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
        >
          <Globe size={13} className={running ? 'animate-pulse' : undefined} />
          {running ? 'Searching…' : 'Research this lead'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* A briefing that found almost nothing is a valid outcome, but it must
          say so — otherwise it reads as a broken feature. */}
      {data.foundCount === 0 && (
        <p className="text-[12px] text-[var(--ui-text-tertiary)] leading-relaxed">
          Searched, but found nothing solid about this person or company. Common for small or
          stealth companies.
        </p>
      )}

      {/* A degraded briefing searched the company only — it never looked this
          person up. Without this line, the empty person fields below read as
          "we searched and found nothing about them", which is a different and
          much more discouraging fact than the true one. */}
      {data.degraded && (
        <p className="text-[12px] text-[var(--ui-text-tertiary)] leading-relaxed">
          There was a lot to read about this company, so this is a shorter briefing covering the
          company only. Refresh to try the full search again.
        </p>
      )}

      {data.companySummary && <Fact label="What they do" value={data.companySummary} />}
      {data.companyIndustry && <Fact label="Industry" value={data.companyIndustry} />}

      {/* These two are always rendered, even when empty. They're the fields a
          user most wants and most needs to know we couldn't confirm — an
          absent row would read as "not checked". */}
      <div className="grid grid-cols-2 gap-3">
        <Fact label="Size" value={data.companySize} />
        <Fact label="Funding" value={data.companyFunding} />
      </div>

      <Bullets label="Recent news" items={data.companyNews} />

      {data.personSummary && <Fact label="About them" value={data.personSummary} />}
      <Bullets label="Their public work" items={data.personPublicWork} />
      <Bullets label="Worth mentioning" items={data.talkingPoints} />

      {data.sources?.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
            Sources
          </span>
          <ul className="flex flex-col gap-1">
            {data.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-start gap-1 text-[12px] text-[var(--brand-purple)] hover:underline break-all"
                >
                  <ExternalLink size={11} className="shrink-0 mt-[3px]" />
                  {source.title || source.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // No citations means the model answered from memory rather than from a
        // search. Say so — an uncited briefing should be trusted less.
        <p className="text-[11px] italic text-[var(--ui-text-tertiary)]">
          No sources were captured for this briefing — treat it as unverified.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => run(true)}
          disabled={running}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={running ? 'animate-spin' : undefined} />
          {running ? 'Searching…' : 'Research again'}
        </button>
        {data.researchedAt && (
          <span className="text-[11px] text-[var(--ui-text-tertiary)]">
            {new Date(data.researchedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default ResearchPanel;
