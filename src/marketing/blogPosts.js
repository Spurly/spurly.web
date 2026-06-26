/* Blog post metadata — used by the blog index and for cross-linking
   between posts. Each post's full body lives in app/blog/<slug>/page.jsx. */

export const POSTS = [
  {
    slug: "personalize-linkedin-connection-requests",
    title:
      "How to Personalize LinkedIn Connection Requests at Scale (Without Sounding Like a Bot)",
    shortTitle: "Personalize LinkedIn requests at scale",
    description:
      "Personalized LinkedIn connection requests get accepted far more often than generic ones. Here's how to personalize them at scale without spending hours per message.",
    date: "2026-06-10",
    readTime: "6 min read",
    excerpt:
      "Generic connection requests get ignored. Learn a repeatable system for sending personal, relevant requests to hundreds of people — without copy-pasting.",
  },
  {
    slug: "free-linkedin-outreach-pipeline-founders",
    title: "How Founders Can Build a Free LinkedIn Outreach Pipeline in 2026",
    shortTitle: "Build a free outreach pipeline",
    description:
      "You don't need an SDR or an expensive CRM to fill your pipeline. Here's how founders can build a repeatable, mostly-free LinkedIn outreach system in 2026.",
    date: "2026-06-14",
    readTime: "7 min read",
    excerpt:
      "No SDR, no bloated CRM. A step-by-step playbook for founders to build a repeatable LinkedIn outreach pipeline — starting free.",
  },
  {
    slug: "sales-navigator-candidate-pipelines-recruiters",
    title:
      "How Recruiters Use LinkedIn Sales Navigator to Build Candidate Pipelines Faster",
    shortTitle: "Sales Navigator for recruiters",
    description:
      "Sales Navigator isn't just for sales. Recruiters can use its search and filters to build candidate shortlists in minutes. Here's the workflow.",
    date: "2026-06-18",
    readTime: "6 min read",
    excerpt:
      "Sales Navigator's filters are a recruiter's secret weapon. Here's how to turn a search into a personalized candidate pipeline in minutes.",
  },
];

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug);
}

export function otherPosts(slug) {
  return POSTS.filter((p) => p.slug !== slug);
}

export function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
