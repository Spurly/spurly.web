# Content files

Every page in here is a `.md` file: frontmatter + a small Markdown subset. Adding one adds a prerendered page,
a route and a sitemap entry, with no JSX. `npm run content` (also run by predev/prebuild/pretest) turns them into the
git-ignored `content.*.generated.js` modules; the Vite dev server rebuilds them when a `.md` changes.

Required frontmatter: `title` (the H1), `description` (<=155 chars), `path` (lowercase, starts with `/`),
`date` (YYYY-MM-DD), `template` (article | product | solutions | comparison | pricing | tool | page).
Optional: `updated`, `seoTitle` (full <title>, <=60 chars; default is `title | Spurly`), `shortTitle` (breadcrumb),
`excerpt`, `readTime`, `cluster`, `author`, `target_query`, `faq:` list of `- q:` / `  a:`, `changefreq`, `priority`,
`draft: true` (validated but not built or routed).

Body: `##`/`###` headings (the title is the only H1), paragraphs, `-` and `1.` lists, `| tables |`, `> quotes`,
`![alt](/path.webp)` images, and inline `**bold**`, `*italic*`, `` `code` ``, `[text](href)`. Raw HTML is rejected.
Rules for what to write: docs/SEO_MASTER_PLAN.md section 7 (content rules) and docs/SEO_CONTENT_PLAN.md.
