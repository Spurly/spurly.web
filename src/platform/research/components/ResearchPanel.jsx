import { Globe, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { Skeleton } from 'src/ui/primitives';
import { useResearch } from '../hooks/useResearch.js';

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

/** A labelled fact, rendered as "not found" when absent rather than hidden. */
function Fact({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[var(--ui-t-micro)] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
        {label}
      </span>
      {value ? (
        <span className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-relaxed">{value}</span>
      ) : (
        <span className="text-[var(--ui-t-label)] italic text-[var(--ui-text-tertiary)]">
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
      <span className="text-[var(--ui-t-micro)] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] leading-relaxed pl-3 relative"
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
  const { data, loading, running, error, run } = useResearch(personId);

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        <Skeleton width="100%" height={11} />
        <Skeleton width="70%" height={11} />
        <Skeleton width={140} height={28} radius="var(--ui-radius-md)" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] leading-relaxed">
          Search the web for what their company does, any recent news, and anything this person has
          published outside LinkedIn.
        </p>
        {/* Setting the expectation up front is cheaper than a spinner that
            looks stuck. This genuinely takes several seconds. */}
        <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
          Takes about 10 seconds. LinkedIn itself can&apos;t be read — it blocks automated access.
        </p>

        {error && (
          <p
            className="flex items-start gap-1.5 text-[var(--ui-t-label)] px-2.5 py-2 rounded-[var(--ui-radius-md)]"
            style={{ background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)' }}
          >
            <AlertTriangle size={13} className="shrink-0 mt-px" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => run(false)}
          disabled={running}
          className="inline-flex self-start items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-colors disabled:opacity-50"
          style={{ background: 'var(--ui-accent-tint)', color: 'var(--ui-accent)' }}
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
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-relaxed">
          Searched, but found nothing solid about this person or company. Common for small or
          stealth companies.
        </p>
      )}

      {/* A degraded briefing searched the company only — it never looked this
          person up. Without this line, the empty person fields below read as
          "we searched and found nothing about them", which is a different and
          much more discouraging fact than the true one. */}
      {data.degraded && (
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-relaxed">
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
          <span className="text-[var(--ui-t-micro)] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
            Sources
          </span>
          <ul className="flex flex-col gap-1">
            {data.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-start gap-1 text-[var(--ui-t-label)] text-[var(--ui-accent-fg)] hover:underline break-all"
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
        <p className="text-[var(--ui-t-meta)] italic text-[var(--ui-text-tertiary)]">
          No sources were captured for this briefing — treat it as unverified.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => run(true)}
          disabled={running}
          className="inline-flex items-center gap-1.5 text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={running ? 'animate-spin' : undefined} />
          {running ? 'Searching…' : 'Research again'}
        </button>
        {data.researchedAt && (
          <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
            {new Date(data.researchedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default ResearchPanel;
