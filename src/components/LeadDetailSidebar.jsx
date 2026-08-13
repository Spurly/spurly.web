import { MapPin, Mail, Phone, Linkedin, Briefcase } from 'lucide-react';
import { Avatar, Badge, Drawer } from 'src/ui/primitives';
import { OutreachTimeline } from 'src/components/OutreachTimeline';
import { OutreachStatusCell } from 'src/features/people/cells/OutreachStatusCell';

function Section({ title, children, action = null }) {
  return (
    <section className="px-4 py-3 border-t border-[var(--ui-border-hairline)]">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ContactRow({ icon: Icon, value, empty, href }) {
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

const SCRAPING_STATUS = {
  complete: { label: 'Complete', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

/**
 * Profile detail drawer, shared by the People and Connections tables.
 *
 * Built on the `Drawer` primitive, so it inherits the focus trap, scroll lock,
 * Escape handling and focus restoration rather than reimplementing them. The
 * previous version was a hand-rolled absolutely-positioned panel with a
 * backdrop that only covered the page body — the sidebar stayed interactive
 * behind it, and nothing trapped focus.
 *
 * @param {boolean} [showOutreach=true] Render the status pill and activity
 *   timeline. Must be false for a Connection: outreach is a People-only concept
 *   and the timeline resolves `personId` against the People collection, so
 *   passing a Connection's id would 404. A connection also has no outreach
 *   state, so the pill would always read "Not contacted" — implying a pipeline
 *   that doesn't apply to someone you already know.
 * @param {string} [heading='Person'] Eyebrow label above the name.
 */
export function LeadDetailSidebar({
  lead,
  onClose,
  showOutreach = true,
  heading = 'Person',
}) {
  /* Callers render this conditionally, so mounted means open. Kept rather than
     lifting `open` into every call site — one less thing for a page to get
     wrong. */
  if (!lead) return null;

  const scraping = SCRAPING_STATUS[lead.scrapingStatus];
  const linkedInHref = lead.linkedin || lead.linkedInUrl || lead.profileUrl;

  return (
    <Drawer open onClose={onClose} eyebrow={heading} title={lead.name} size="md">
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <Avatar src={lead.avatar} name={lead.name} size={44} shape="square" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-medium tracking-[-0.01em] text-[var(--ui-text-primary)] leading-tight">
              {lead.name}
            </h2>
            {(lead.title || lead.company) && (
              <p className="text-[13px] text-[var(--ui-text-secondary)] mt-0.5 leading-snug">
                {lead.title}
                {lead.company ? ` · ${lead.company}` : ''}
              </p>
            )}
            {lead.location && (
              <p className="flex items-center gap-1 text-[12px] text-[var(--ui-text-tertiary)] mt-1">
                <MapPin size={12} aria-hidden="true" /> {lead.location}
              </p>
            )}
          </div>
        </div>

        {lead.headline && (
          <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed mt-3">
            {lead.headline}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {showOutreach && <OutreachStatusCell outreach={lead.outreach} />}
          {lead.connectionDegree && (
            <Badge size="sm" tone="neutral">
              {lead.connectionDegree} degree
            </Badge>
          )}
          {scraping && (
            <Badge size="sm" tone={scraping.tone} dot>
              {scraping.label}
            </Badge>
          )}
          {lead.badges?.map((badge) => (
            <Badge key={badge} size="sm" tone="accent">
              {badge}
            </Badge>
          ))}
        </div>
      </div>

      {lead.aiSummary && (
        <Section title="Summary" action={<Badge size="sm" tone="accent">Beta</Badge>}>
          <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed">
            {lead.aiSummary}
          </p>
        </Section>
      )}

      {lead.signals?.length > 0 && (
        <Section title="Key signals">
          <ul className="flex flex-col gap-1.5">
            {lead.signals.map((signal, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] text-[var(--ui-text-secondary)]"
              >
                <span
                  className="w-1 h-1 rounded-full shrink-0 mt-2 bg-[var(--ui-success-dot)]"
                  aria-hidden="true"
                />
                {signal}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* What we've actually sent this person, and when. */}
      {showOutreach && (
        <Section title="Outreach activity">
          <OutreachTimeline
            personId={lead._id || lead.id}
            profileUrl={lead.linkedInUrl || lead.profileUrl}
          />
        </Section>
      )}

      <Section title="Contact">
        <div className="flex flex-col">
          <ContactRow
            icon={Mail}
            value={lead.email}
            href={lead.email ? `mailto:${lead.email}` : undefined}
            empty="No email — enrich to reveal"
          />
          <ContactRow
            icon={Phone}
            value={lead.phone}
            href={lead.phone ? `tel:${lead.phone}` : undefined}
            empty="No phone on file"
          />
          {linkedInHref && (
            <ContactRow icon={Linkedin} value="View profile" href={linkedInHref} empty="" />
          )}
        </div>
      </Section>

      {lead.experiences?.length > 0 && (
        <Section title="Experience">
          <div className="flex flex-col gap-2.5">
            {lead.experiences.map((exp, i) => (
              <div key={i} className="flex gap-2.5">
                <span
                  className="grid place-items-center w-7 h-7 shrink-0 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]"
                  aria-hidden="true"
                >
                  <Briefcase size={13} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--ui-text-primary)] leading-snug">
                    {exp.title}
                  </p>
                  <p className="text-[12.5px] text-[var(--ui-text-secondary)] leading-snug">
                    {exp.company}
                  </p>
                  {(exp.startDate || exp.duration) && (
                    <p className="text-[11.5px] text-[var(--ui-text-tertiary)] leading-snug mt-0.5">
                      {exp.startDate}
                      {exp.endDate ? ` – ${exp.endDate}` : ''}
                      {exp.duration ? ` · ${exp.duration}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </Drawer>
  );
}
