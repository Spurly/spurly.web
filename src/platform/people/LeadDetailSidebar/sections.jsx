import { Briefcase, GraduationCap } from 'lucide-react';

/**
 * Presentational pieces shared by the drawer's tab panels. Kept out of
 * LeadDetailSidebar.jsx so that file reads as "shell + which panel is open".
 */

/**
 * A titled block inside a tab panel. The first block in a panel drops its top
 * rule — the tab strip already draws one, and two hairlines 12px apart read as
 * a mistake.
 */
export function Section({ title, children, action = null }) {
  return (
    <section className="px-4 py-3 border-t first:border-t-0 border-[var(--ui-border-hairline)]">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function ContactRow({ icon: Icon, value, empty, href }) {
  return (
    <div className="flex items-center gap-2.5 h-8">
      <Icon size={14} className="shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
      {value ? (
        href ? (
          <a
            href={href}
            className="text-[13px] text-[var(--ui-accent-fg)] hover:underline truncate"
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {value}
          </a>
        ) : (
          <span className="text-[13px] text-[var(--ui-text-primary)] truncate">{value}</span>
        )
      ) : (
        <span className="text-[13px] text-[var(--ui-text-tertiary)]">{empty}</span>
      )}
    </div>
  );
}

/** Label/value pairs. Rows with no value are dropped, not rendered blank. */
export function FactList({ facts = [] }) {
  const present = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  if (!present.length) return null;

  return (
    <dl className="flex flex-col gap-1.5">
      {present.map((fact) => (
        <div key={fact.label} className="flex items-baseline gap-3">
          <dt className="w-24 shrink-0 text-[12px] text-[var(--ui-text-tertiary)]">{fact.label}</dt>
          <dd className="text-[13px] text-[var(--ui-text-primary)] tabular-nums min-w-0 truncate">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Skills, languages — short strings that read better wrapped than listed. */
export function ChipList({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="inline-flex items-center h-6 px-2 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-sunken)] text-[12px] text-[var(--ui-text-secondary)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function HistoryRow({ icon: Icon, primary, secondary, meta }) {
  return (
    <div className="flex gap-2.5">
      <span
        className="grid place-items-center w-7 h-7 shrink-0 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]"
        aria-hidden="true"
      >
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--ui-text-primary)] leading-snug">
          {primary}
        </p>
        {secondary && (
          <p className="text-[12px] text-[var(--ui-text-secondary)] leading-snug">{secondary}</p>
        )}
        {meta && (
          <p className="text-[11px] text-[var(--ui-text-tertiary)] leading-snug mt-0.5">{meta}</p>
        )}
      </div>
    </div>
  );
}

export function ExperienceList({ experiences = [] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {experiences.map((exp, i) => (
        <HistoryRow
          key={i}
          icon={Briefcase}
          primary={exp.title}
          secondary={exp.company}
          meta={
            exp.startDate || exp.duration
              ? `${exp.startDate || ''}${exp.endDate ? ` – ${exp.endDate}` : ''}${
                  exp.duration ? ` · ${exp.duration}` : ''
                }`
              : null
          }
        />
      ))}
    </div>
  );
}

export function EducationList({ education = [] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {education.map((edu, i) => (
        <HistoryRow
          key={i}
          icon={GraduationCap}
          primary={edu.school}
          secondary={[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ')}
          meta={
            edu.startYear || edu.endYear
              ? `${edu.startYear || ''}${edu.endYear ? ` – ${edu.endYear}` : ''}`
              : null
          }
        />
      ))}
    </div>
  );
}
