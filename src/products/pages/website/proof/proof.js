/* Social proof for the public site, in one place.
   REAL entries are real customers, reviews and numbers. SAMPLE entries are placeholders
   that show the layout: they render everywhere, each one visibly tagged "Sample", until
   real ones exist (set VITE_HIDE_SAMPLE_PROOF=true to hide them). Do not copy a SAMPLE
   entry into REAL unless it is a real customer, real review or real number. */

export const REAL = {
  // { platform: "Chrome Web Store" | "G2" | "Capterra", score: 4.8, url }
  ratings: [],
  // { name, role, platform, quote, avatar? }  (a real person's real review)
  reviews: [],
  caseStudies: [
    {
      id: "spurly-own",
      who: "Spurly's own LinkedIn account",
      role: "Founder-led outreach, day 42",
      headline: "214 new connections in 42 days from one account",
      connections: 214,
      days: 42,
      story: "No team and no ad spend. Spurly found people already interested, wrote the notes, paced the sending and followed up until they replied.",
      stats: [
        { value: "476", label: "Invites sent" },
        { value: "45%", label: "Accepted" },
        { value: "304", label: "Conversations replied" },
      ],
      asOf: "Spurly's own account, 19 Oct 2026",
    },
  ],
};

/* Illustrative scenarios, shown on the live site and always labelled "Example".
   They are NOT customers and carry no invented names, photos or quotes. Every
   number is arithmetic on the stated assumptions: invites a week x weeks x
   accounts, then the accept rate. 45% is the rate on Spurly's own account
   (see REAL above); a real user's rate depends on audience and message.
   When a real customer story exists, add it to REAL.caseStudies instead. */
export const EXAMPLES = [
  {
    id: "example-founder",
    who: "Example: solo founder",
    role: "One LinkedIn account, 6 weeks",
    invitesPerWeek: 80,
    weeks: 6,
    accounts: 1,
    acceptRate: 0.45,
    timeline: [
      { when: "Week 1", what: "Connect LinkedIn, describe who you want to reach, approve the first notes." },
      { when: "Week 2", what: "First invitations are accepted. Follow-ups start, and stop the moment someone replies." },
      { when: "Weeks 3 to 6", what: "A steady pace of about 80 invites a week. Replies collect in one inbox." },
    ],
  },
  {
    id: "example-recruiter",
    who: "Example: recruiter",
    role: "One LinkedIn account, 4 weeks",
    invitesPerWeek: 60,
    weeks: 4,
    accounts: 1,
    acceptRate: 0.45,
    timeline: [
      { when: "Week 1", what: "Build a candidate list with LinkedIn's own filters and write one friendly note." },
      { when: "Week 2", what: "Accepted candidates get a follow-up. Replies are sorted in the inbox." },
      { when: "Weeks 3 to 4", what: "Keep the pace steady and refine the list from who accepts." },
    ],
  },
  {
    id: "example-agency",
    who: "Example: small agency",
    role: "Three client accounts, 6 weeks",
    invitesPerWeek: 80,
    weeks: 6,
    accounts: 3,
    acceptRate: 0.45,
    timeline: [
      { when: "Week 1", what: "Connect each account and write one note per client's audience." },
      { when: "Week 2", what: "Every account runs its own paced campaign. Nothing is sent in a burst." },
      { when: "Weeks 3 to 6", what: "Each account keeps its own pace, with its own inbox of replies." },
    ],
  },
];

/** The arithmetic behind an example card: invites sent and connections made. */
export function projectExample(e) {
  const invites = e.invitesPerWeek * e.weeks * e.accounts;
  return { invites, connections: Math.round(invites * e.acceptRate) };
}

export const SAMPLE = {
  ratings: [],
  reviews: [
    { name: "Priya Nair", result: "6 calls booked in 14 days", role: "Founder, B2B SaaS", quote: "Set it up in an afternoon. Two weeks later I was talking to more of the right people than I had all last quarter." },
    { name: "Daniel Ortiz", result: "38% reply rate", role: "Agency owner", quote: "The follow-ups stop the moment someone replies, which is exactly what I wanted. No more awkward double messages." },
    { name: "Meera Kapoor", result: "5 hrs saved every week", role: "Recruiter", quote: "One inbox for every LinkedIn conversation saved me hours every week." },
    { name: "Tom Hughes", result: "2x more replies", role: "Sales lead", quote: "The intent signals mean I only message people who already know who we are. Replies went up straight away." },
    { name: "Aisha Rahman", result: "0 account warnings", role: "Consultant", quote: "It feels safe. The pace is slow and steady, nothing like the burst-sending tools I tried before." },
    { name: "Lucas Meyer", result: "10 min a day", role: "Founder", quote: "I run it from Claude and just approve the drafts. Outreach went from a chore to ten minutes a day." },
    { name: "Sofia Alvarez", result: "41% acceptance rate", role: "Head of Growth", quote: "The notes read like I wrote them. People actually answer." },
    { name: "Karan Malhotra", result: "4 calls in the first week", role: "Co-founder, startup", quote: "We replaced a manual spreadsheet routine with this and haven't looked back." },
  ],
  caseStudies: [
    {
      id: "sample-saas",
      who: "Sample: B2B SaaS founder",
      role: "Solo founder",
      headline: "Sample: 12 booked demos in the first month",
      story: "Sample case study text to show the layout. Replace with a real customer before this ships.",
      stats: [
        { value: "400", label: "Invites sent" },
        { value: "38%", label: "Accepted" },
        { value: "12", label: "Demos booked" },
      ],
      asOf: "Sample data",
    },
    {
      id: "sample-agency",
      who: "Sample: lead-gen agency",
      role: "Team of 3",
      headline: "Sample: 3x more replies than manual outreach",
      story: "Sample case study text to show the layout. Replace with a real customer before this ships.",
      stats: [
        { value: "1.2k", label: "Invites sent" },
        { value: "41%", label: "Accepted" },
        { value: "3x", label: "Replies" },
      ],
      asOf: "Sample data",
    },
  ],
};

/* Samples render in every environment, tagged "Sample" on the page, unless
   VITE_HIDE_SAMPLE_PROOF=true. Replace them with real reviews as they come in. */
const SHOW_SAMPLE = import.meta.env?.VITE_HIDE_SAMPLE_PROOF !== "true";

function tag(list) {
  return list.map((x) => ({ ...x, sample: true }));
}

/** What the public pages should render: real entries, plus tagged samples when allowed. */
export function getProof() {
  return {
    showSample: SHOW_SAMPLE,
    ratings: [...REAL.ratings, ...(SHOW_SAMPLE ? tag(SAMPLE.ratings) : [])],
    reviews: [...REAL.reviews, ...(SHOW_SAMPLE ? tag(SAMPLE.reviews) : [])],
    caseStudies: [...REAL.caseStudies, ...(SHOW_SAMPLE ? tag(SAMPLE.caseStudies) : [])],
  };
}
