/* Social proof for the public site, in one place.
   REAL entries are shown everywhere. SAMPLE entries exist only so the layout can be
   judged: they render in dev (or with VITE_SHOW_SAMPLE_PROOF=true) with a visible
   "Sample" tag, and never in a production build. Do not copy a SAMPLE entry into
   REAL unless it is a real customer, real review or real number. */

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

export const SAMPLE = {
  ratings: [
    { platform: "Chrome Web Store", score: 4.8 },
    { platform: "G2", score: 4.5 },
    { platform: "Capterra", score: 4.5 },
  ],
  reviews: [
    { name: "Sample A.", role: "Founder, B2B SaaS", platform: "G2", quote: "Sample review text: set up in an afternoon and replies started the same week." },
    { name: "Sample B.", role: "Agency owner", platform: "Chrome Web Store", quote: "Sample review text: the follow-ups stop when someone replies, which is what I wanted." },
    { name: "Sample C.", role: "Recruiter", platform: "Capterra", quote: "Sample review text: one inbox for every LinkedIn conversation saved me hours." },
    { name: "Sample D.", role: "Sales lead", platform: "G2", quote: "Sample review text: the intent signals meant I only messaged people who already knew us." },
    { name: "Sample E.", role: "Consultant", platform: "Chrome Web Store", quote: "Sample review text: feels safe, the pace is slow and steady." },
    { name: "Sample F.", role: "Founder", platform: "G2", quote: "Sample review text: I run it from Claude and approve the drafts." },
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

const SHOW_SAMPLE = Boolean(import.meta.env?.DEV) || import.meta.env?.VITE_SHOW_SAMPLE_PROOF === "true";

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
