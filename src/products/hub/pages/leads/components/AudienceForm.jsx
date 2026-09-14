import { useMemo, useState } from "react";
import { Button, Input, Badge } from "src/ui/primitives";
import { FilterTagPicker } from "./FilterTagPicker.jsx";

/**
 * One form. Not two tabs.
 *
 * WHAT WAS WRONG
 *
 * The page carried three entry points for one job: a "Paste a URL" tab, a
 * "Build filters" tab, and — outside both of them — a "search a company" band
 * that did nothing the Current company field inside the filter tab didn't
 * already do. The same field, built twice, with a tab switch between them.
 * Switching tabs threw away whatever you had typed, and the word "Import"
 * appeared twice on screen meaning two different things.
 *
 * WHY A URL TAKES OVER RATHER THAN COMBINING
 *
 * A LinkedIn results URL already encodes its own filters. There is no way to
 * layer a location on top of a pasted search — the backend would have to
 * reject it, and an interface that offers a combination its server refuses is
 * lying about what the product can do. So the URL field sits on top, and
 * filling it visibly switches the filters off with a line saying why.
 * Clearing it brings them back, with everything still in them.
 *
 * The company shortcut is gone because it turned out to BE the Current
 * company field. It is one of the nine below now.
 */
const NETWORK_DISTANCE_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd+" },
];

/**
 * A profile URL is the mistake people actually make, and it fails deep in the
 * importer rather than here. Caught at the field, with the fix rather than a
 * verdict: "that's a profile, run the search first".
 */
/** Falls back to a same-day-distinguishing label when the user leaves the
 * name field blank -- e.g. "Sep 14, 2026" -- rather than an anonymous
 * "Untitled audience". */
function defaultAudienceName() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function urlProblem(raw) {
  const v = raw.trim();
  if (!v) return null;
  if (!/linkedin\.com/i.test(v))
    return "That doesn't look like a LinkedIn URL.";
  if (/linkedin\.com\/(in|company|school)\//i.test(v)) {
    return "That's a profile, not a search. Run the search on LinkedIn first, then paste the results URL.";
  }
  if (!/\/search\/results\//i.test(v)) {
    return "That's a LinkedIn page, not a search result. Run the search, then paste the URL from the results page.";
  }
  return null;
}

export function AudienceForm({
  initialCompany = null,
  onSubmit,
  submitting = false,
}) {
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState([]);
  const [industry, setIndustry] = useState([]);
  const [company, setCompany] = useState(
    initialCompany ? [initialCompany] : [],
  );
  const [pastCompany, setPastCompany] = useState([]);
  const [school, setSchool] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [title, setTitle] = useState("");
  const [networkDistance, setNetworkDistance] = useState([]);
  const [name, setName] = useState("");

  const usingUrl = url.trim().length > 0;
  const urlError = usingUrl ? urlProblem(url) : null;

  const activeFilters = useMemo(() => {
    const n =
      location.length +
      industry.length +
      company.length +
      pastCompany.length +
      school.length +
      networkDistance.length +
      (keywords.trim() ? 1 : 0) +
      (title.trim() ? 1 : 0);
    return n;
  }, [
    location,
    industry,
    company,
    pastCompany,
    school,
    networkDistance,
    keywords,
    title,
  ]);

  const canSubmit = usingUrl ? !urlError : activeFilters > 0;

  const toggleDistance = (d) =>
    setNetworkDistance((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const buildFilters = () => {
    const filters = {};
    if (keywords.trim()) filters.keywords = keywords.trim();
    if (location.length) filters.location = location.map((v) => v.id);
    if (industry.length) filters.industry = industry.map((v) => v.id);
    if (company.length) filters.company = company.map((v) => v.id);
    if (pastCompany.length) filters.past_company = pastCompany.map((v) => v.id);
    if (school.length) filters.school = school.map((v) => v.id);
    if (networkDistance.length) filters.network_distance = networkDistance;
    if (title.trim()) filters.advanced_keywords = { title: title.trim() };
    return filters;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    // A name is required for every saved audience -- an unnamed search is
    // how "Untitled audience" rows pile up in the dock. Rather than block
    // submission on a blank field, an empty name silently falls back to
    // today's date, which is still a real, distinguishing label.
    const audienceName = name.trim() || defaultAudienceName();
    onSubmit(
      usingUrl
        ? { searchUrl: url.trim(), name: audienceName }
        : { filters: buildFilters(), name: audienceName },
    );
  };

  /* Everything below the URL is off while a URL is present. `inert` would be
     the right primitive but is still uneven across browsers, so: the pickers
     take `disabled`, and the wrapper drops opacity and pointer events so the
     state is legible as well as enforced. */
  const filtersOff = usingUrl || submitting;

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="p-[var(--ui-pad-lg)] flex flex-col gap-2">
        <label
          htmlFor="audience-url"
          className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]"
        >
          Paste a LinkedIn search URL
          <span className="font-normal text-[var(--ui-text-tertiary)]">
            {" "}
            · optional
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="audience-url"
            mono
            fullWidth
            className="flex-1"
            value={url}
            invalid={Boolean(urlError)}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/search/results/people/?keywords=…"
            disabled={submitting}
          />
          {usingUrl && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUrl("")}
              disabled={submitting}
            >
              Clear URL
            </Button>
          )}
        </div>
        {urlError ? (
          <p className="text-[var(--ui-t-label)] text-[var(--ui-danger-fg)] leading-relaxed">
            {urlError}
          </p>
        ) : usingUrl ? (
          <p className="text-[var(--ui-t-label)] text-[var(--ui-accent-fg)] leading-relaxed">
            Using this URL. The filters below are off — a results URL already
            carries its own.
          </p>
        ) : (
          <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-relaxed">
            Run the search on LinkedIn, then paste the results URL. Or leave
            this empty and build the audience from the filters below.
          </p>
        )}
      </div>

      <div className="h-px bg-[var(--ui-border-hairline)]" />

      <div
        className={[
          "p-[var(--ui-pad-lg)] flex flex-col gap-5 transition-opacity duration-[var(--ui-dur-base)]",
          usingUrl ? "opacity-40 pointer-events-none select-none" : "",
        ].join(" ")}
        aria-hidden={usingUrl || undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FilterTagPicker
            type="LOCATION"
            label="Location"
            placeholder="Search a city or region…"
            value={location}
            onChange={setLocation}
            disabled={filtersOff}
          />
          <FilterTagPicker
            type="INDUSTRY"
            label="Industry"
            placeholder="Search an industry…"
            value={industry}
            onChange={setIndustry}
            disabled={filtersOff}
          />
          <FilterTagPicker
            type="COMPANY"
            label="Current company"
            placeholder="Search a company…"
            value={company}
            onChange={setCompany}
            disabled={filtersOff}
          />
          <FilterTagPicker
            type="COMPANY"
            label="Past company"
            placeholder="Search a company…"
            value={pastCompany}
            onChange={setPastCompany}
            disabled={filtersOff}
          />
          <FilterTagPicker
            type="SCHOOL"
            label="School"
            placeholder="Search a school…"
            value={school}
            onChange={setSchool}
            disabled={filtersOff}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]">
              Connection degree
            </span>
            <div
              className="inline-flex self-start gap-1 p-1 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)]"
              role="group"
              aria-label="Connection degree"
            >
              {NETWORK_DISTANCE_OPTIONS.map((opt) => {
                const active = networkDistance.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={filtersOff}
                    onClick={() => toggleDistance(opt.value)}
                    aria-pressed={active}
                    className={[
                      "h-[30px] px-3.5 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-label)] font-medium",
                      "transition-colors duration-[var(--ui-dur-fast)]",
                      "focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]",
                      "disabled:cursor-not-allowed",
                      active
                        ? "bg-[var(--ui-surface-card)] text-[var(--ui-accent-fg)] shadow-[var(--ui-shadow-sm)]"
                        : "text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)]",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="audience-keywords"
              className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]"
            >
              Keywords
            </label>
            <Input
              id="audience-keywords"
              fullWidth
              value={keywords}
              disabled={filtersOff}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. co-founder"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="audience-title"
              className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]"
            >
              Title contains
            </label>
            <Input
              id="audience-title"
              fullWidth
              value={title}
              disabled={filtersOff}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP Sales"
            />
          </div>
        </div>

        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-relaxed">
          Pick from the suggestions as you type — LinkedIn matches its own
          internal ids, not plain text, so a filter only takes effect once you
          have selected a chip.
        </p>
      </div>

      <div className="flex items-center gap-3 p-[var(--ui-pad-lg)] border-t border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)]">
        <Input
          className="flex-1"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this audience — defaults to today's date if left blank"
          aria-label="Audience name"
          disabled={submitting}
        />
        {!usingUrl && activeFilters > 0 && (
          <Badge tone="accent">
            {activeFilters} {activeFilters === 1 ? "filter" : "filters"}
          </Badge>
        )}
        <Button
          type="submit"
          disabled={!canSubmit || submitting}
          loading={submitting}
        >
          {submitting ? "Queueing…" : "Import"}
        </Button>
      </div>
    </form>
  );
}
