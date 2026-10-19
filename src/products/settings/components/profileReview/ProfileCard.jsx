import { Avatar } from "src/core/primitives";

/**
 * "This is what LinkedIn shows about you." Read-only: the point of the screen
 * is for the user to see what Spurly can see and confirm it is them, not to
 * edit their LinkedIn.
 *
 * Takes the server's profile view: `snapshot` (the owner's full profile) and
 * `profile` (the /users/me copy, where the picture lives). Every section hides
 * itself when LinkedIn gave nothing for it -- an empty "Skills" heading would
 * read as a bug, and several of these lists are legitimately empty.
 */

const SHOWN = { experience: 4, education: 3, skills: 12 };
const ABOUT_CHARS = 320;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** LinkedIn dates arrive as strings like "1/1/2024" or "2019-05"; only the year is dependable. */
function yearOf(value) {
  const match = /(19|20)\d{2}/.exec(value || "");
  return match ? match[0] : "";
}

function span(entry) {
  const from = yearOf(entry.start);
  const to = entry.current ? "Present" : yearOf(entry.end);
  if (!from && !to) return "";
  return [from, to].filter(Boolean).join(" – ");
}

function clip(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function Stat({ value, label }) {
  if (!Number.isFinite(value)) return null;
  return (
    <div className="sp-prof__stat">
      <b>{compact.format(value)}</b>
      <span>{label}</span>
    </div>
  );
}

export function ProfileCard({ snapshot, profile }) {
  const { name, headline, location, summary, profileUrl, flags = {}, experience = [], education = [], skills = [], totals = {} } = snapshot;
  const displayName = name || profile?.name || "Your LinkedIn profile";

  const extra = (shown, listed, total) => Math.max((Number.isFinite(total) ? total : listed) - shown, 0);
  const moreExperience = extra(Math.min(experience.length, SHOWN.experience), experience.length, totals.experience);
  const moreSkills = extra(Math.min(skills.length, SHOWN.skills), skills.length, totals.skills);

  return (
    <div className="sp-prof" aria-label="Your LinkedIn profile">
      <div className="sp-prof__head">
        <Avatar src={profile?.pictureUrl || null} name={displayName} size={56} />
        <div>
          <div className="sp-prof__name">{displayName}</div>
          {headline && <div className="sp-prof__headline">{headline}</div>}
          <div className="sp-prof__meta">
            {location && <span>{location}</span>}
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noreferrer noopener">
                View on LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="sp-prof__stats">
        <Stat value={snapshot.connectionsCount} label="Connections" />
        <Stat value={snapshot.followerCount} label="Followers" />
        {flags.premium && (
          <div className="sp-prof__stat"><b>Premium</b><span>LinkedIn plan</span></div>
        )}
        {flags.creator && (
          <div className="sp-prof__stat"><b>Creator</b><span>Creator mode on</span></div>
        )}
        {flags.openProfile && (
          <div className="sp-prof__stat"><b>Open</b><span>Open profile</span></div>
        )}
      </div>

      {summary && (
        <section className="sp-prof__sec">
          <div className="sp-prof__h">About</div>
          <p className="sp-prof__about">{clip(summary, ABOUT_CHARS)}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="sp-prof__sec">
          <div className="sp-prof__h">Experience</div>
          <ul className="sp-prof__list">
            {experience.slice(0, SHOWN.experience).map((e, i) => (
              <li key={`${e.company}-${e.position}-${i}`}>
                <div className="sp-prof__row-t">{e.position || e.company}</div>
                <div className="sp-prof__row-d">
                  {[e.position ? e.company : "", span(e)].filter(Boolean).join(" · ")}
                </div>
              </li>
            ))}
          </ul>
          {moreExperience > 0 && <div className="sp-prof__more">+{moreExperience} more</div>}
        </section>
      )}

      {education.length > 0 && (
        <section className="sp-prof__sec">
          <div className="sp-prof__h">Education</div>
          <ul className="sp-prof__list">
            {education.slice(0, SHOWN.education).map((e, i) => (
              <li key={`${e.school}-${i}`}>
                <div className="sp-prof__row-t">{e.school}</div>
                <div className="sp-prof__row-d">
                  {[[e.degree, e.field].filter(Boolean).join(", "), span({ start: e.start, end: e.end })]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="sp-prof__sec">
          <div className="sp-prof__h">Skills</div>
          <div className="sp-chips">
            {skills.slice(0, SHOWN.skills).map((s) => (
              <span className="sp-chip" key={s}>{s}</span>
            ))}
          </div>
          {moreSkills > 0 && <div className="sp-prof__more">+{moreSkills} more</div>}
        </section>
      )}

      <p className="sp-prof__note">
        This is read from your own LinkedIn account. Spurly uses it to set up
        your outreach and never posts or edits anything on your profile.
      </p>
    </div>
  );
}
