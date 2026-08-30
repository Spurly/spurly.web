import { useMemo, useState } from 'react';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';
import { Avatar, Badge, Drawer, EmptyState, Tabs } from 'src/ui/primitives';
import { LinkedInIcon } from 'src/ui/icons';
import { OutreachTimeline } from 'src/components/OutreachTimeline';
import { OutreachStatusCell } from 'src/features/people/cells/OutreachStatusCell';
import { ResearchPanel } from 'src/features/research/ResearchPanel.jsx';
import { absoluteTime } from 'src/common/utils/outreach';
import { countryCodeFromLocation, countryNameFromCode, flagUrl } from 'src/common/utils/location';
import { useProfilePhoto } from 'src/common/utils/profilePhoto';
import { resolveTabs } from './personDetailTabs';
import {
  Section,
  ContactRow,
  FactList,
  ChipList,
  ExperienceList,
  EducationList,
} from './sections.jsx';

const SCRAPING_STATUS = {
  complete: { label: 'Complete', tone: 'success' },
  success: { label: 'Complete', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

/** Skills and languages arrive as either strings or `{ name, ... }` objects. */
function names(list = []) {
  return list
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter(Boolean);
}

function languageLabels(list = []) {
  return list
    .map((item) =>
      typeof item === 'string'
        ? item
        : [item?.name, item?.proficiency].filter(Boolean).join(' · '),
    )
    .filter(Boolean);
}

/** Everything about the person themselves. The landing tab. */
function OverviewPanel({ lead }) {
  const skills = names(lead.skills);
  const languages = languageLabels(lead.languages);
  const facts = [
    { label: 'Connections', value: lead.connectionCount || null },
    { label: 'Followers', value: lead.followerCount || null },
    { label: 'Source', value: lead.source === 'sales-navigator' ? 'Sales Navigator' : 'LinkedIn' },
    { label: 'Captured', value: lead.capturedOn ? absoluteTime(lead.capturedOn) : null },
  ];

  const enriched =
    lead.headline || lead.about || lead.experiences?.length || lead.education?.length || skills.length;

  return (
    <>
      {lead.headline && (
        <Section title="Headline">
          <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed">
            {lead.headline}
          </p>
        </Section>
      )}

      {lead.about && (
        <Section title="About">
          <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed whitespace-pre-line">
            {lead.about}
          </p>
        </Section>
      )}

      <Section title="Details">
        <FactList facts={facts} />
      </Section>

      {lead.experiences?.length > 0 && (
        <Section title="Experience">
          <ExperienceList experiences={lead.experiences} />
        </Section>
      )}

      {lead.education?.length > 0 && (
        <Section title="Education">
          <EducationList education={lead.education} />
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <ChipList items={skills} />
        </Section>
      )}

      {languages.length > 0 && (
        <Section title="Languages">
          <ChipList items={languages} />
        </Section>
      )}

      {/* A row captured from a search page has a name and a title and nothing
          else until it is visited. Say so, rather than showing a Details block
          floating alone. */}
      {!enriched && (
        <EmptyState
          compact
          title="Not enriched yet"
          hint="Headline, experience, education and skills appear once this profile has been visited and enriched."
        />
      )}
    </>
  );
}

function ContactPanel({ lead }) {
  const linkedInHref = lead.linkedin || lead.linkedInUrl || lead.profileUrl;

  return (
    <Section>
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
        <ContactRow
          icon={Globe}
          value={lead.website}
          href={lead.website || undefined}
          empty="No website on file"
        />
        {linkedInHref && (
          <ContactRow icon={LinkedInIcon} value="View profile" href={linkedInHref} empty="" />
        )}
      </div>
    </Section>
  );
}

function ResearchTabPanel({ lead }) {
  return (
    <>
      <Section title="Web research" action={<Badge size="sm" tone="accent">Beta</Badge>}>
        <ResearchPanel personId={lead._id} />
      </Section>

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
    </>
  );
}

/** What we've actually sent this person, and when. */
function ActivityPanel({ lead }) {
  return (
    <Section title="Outreach activity">
      <OutreachTimeline
        personId={lead._id || lead.id}
        profileUrl={lead.linkedInUrl || lead.profileUrl}
      />
    </Section>
  );
}

/**
 * Profile detail drawer, shared by the Contacts and Connections tables.
 *
 * Built on the `Drawer` primitive, so it inherits the focus trap, scroll lock,
 * Escape handling and focus restoration rather than reimplementing them.
 *
 * TABS, not one long scroll. Two reasons, and the second is the load-bearing
 * one:
 *
 * 1. The panel mixes four unrelated questions — who is this, how do I reach
 *    them, what does the web say, what have I sent them. Stacked, the answer
 *    you want is always below the fold.
 * 2. Research and Activity each fetch from their own endpoint on mount. As
 *    stacked sections that meant opening ANY row fired two requests, even when
 *    the user only wanted the email. Mounted behind a tab, they fetch when the
 *    tab is opened and not before.
 *
 * The identity block stays ABOVE the strip: "who am I looking at" must not
 * disappear when you switch tabs. Which sections live in which tab is data —
 * see ./personDetailTabs.js, which also explains why this grouping is not an
 * API concern.
 *
 * @param {boolean} [showOutreach=true] Render the status pill and the
 *   person-only tabs. Must be false for a Connection: outreach is a People-only
 *   concept and both endpoints resolve `personId` against the People
 *   collection, so passing a Connection's id would 404.
 */
export function LeadDetailSidebar({ lead, onClose, showOutreach = true }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = useMemo(
    () => resolveTabs(lead, { showOutreach }),
    [lead, showOutreach],
  );

  const locationCountry = useMemo(
    () => countryCodeFromLocation(lead?.location),
    [lead?.location],
  );

  /* Above the `if (!lead)` bail on purpose — hooks can't run conditionally.
     Usually already cached by the table row behind this drawer, so opening a
     person costs no request. */
  const capturedPhoto = useProfilePhoto(lead?.linkedInUrl || lead?.profileUrl);

  /* Callers render this conditionally, so mounted means open. Kept rather than
     lifting `open` into every call site — one less thing for a page to get
     wrong. */
  if (!lead) return null;

  const scraping = SCRAPING_STATUS[lead.scrapingStatus];
  /* A row can be reselected while the drawer is open. If the previously active
     tab doesn't exist for the new row, fall back rather than render nothing. */
  const current = tabs.some((t) => t.id === activeTab) ? activeTab : 'overview';

  return (
    /* No header band: the identity block below already leads with the name, and
       a band repeating it above cost 40px to say the same thing twice. `title`
       still gives the dialog its accessible name; the close button floats. */
    <Drawer open onClose={onClose} title={lead.name} showHeader={false} size="md">
      <div className="px-4 py-4 pr-10">
        <div className="flex items-start gap-3">
          <Avatar src={lead.avatar || capturedPhoto || null} name={lead.name} size={44} shape="square" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] leading-tight">
              {lead.name}
            </h2>
            {(lead.title || lead.company) && (
              <p className="text-[13px] text-[var(--ui-text-secondary)] mt-0.5 leading-snug">
                {lead.title}
                {lead.company ? ` · ${lead.company}` : ''}
              </p>
            )}
            {lead.location && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--ui-text-tertiary)] mt-1">
                {/* The flag replaces the pin rather than joining it: two glyphs
                    before one short line of text is noise, and the flag says
                    "place" at least as clearly as the pin did. */}
                {locationCountry ? (
                  <img
                    src={flagUrl(locationCountry, 20)}
                    srcSet={`${flagUrl(locationCountry, 20)} 1x, ${flagUrl(locationCountry, 40)} 2x`}
                    width={14}
                    height={11}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    title={countryNameFromCode(locationCountry)}
                    className="shrink-0 rounded-[var(--ui-radius-xs)] object-cover ring-1 ring-[var(--ui-border-hairline)]"
                  />
                ) : (
                  <MapPin size={12} aria-hidden="true" />
                )}
                {lead.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {showOutreach && (
            <OutreachStatusCell outreach={lead.outreach} connectedAt={lead.connectedAt} />
          )}
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

      {/* Sticky so the strip is still reachable a long way down the About text
          or a twelve-role experience list. */}
      <div
        className="sticky top-0 z-10 flex items-stretch px-4 bg-[var(--ui-surface-card)] border-b border-[var(--ui-border-hairline)]"
        style={{ height: 'var(--ui-band)' }}
      >
        <Tabs tabs={tabs} activeTab={current} onTabChange={setActiveTab} ariaLabel="Person details" />
      </div>

      {current === 'overview' && <OverviewPanel lead={lead} />}
      {current === 'contact' && <ContactPanel lead={lead} />}
      {current === 'research' &&
        (lead._id ? (
          <ResearchTabPanel lead={lead} />
        ) : (
          <EmptyState
            compact
            title="Research unavailable"
            hint="This row has no saved person record to research against."
          />
        ))}
      {current === 'activity' && <ActivityPanel lead={lead} />}
    </Drawer>
  );
}
