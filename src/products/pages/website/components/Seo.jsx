import { Helmet } from "react-helmet-async";
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from "../seo.js";

/**
 * Every <head> tag a public page needs, in one place: title, description,
 * canonical, Open Graph, Twitter card and JSON-LD.
 *
 * At build time scripts/prerender.mjs renders each public route on the server
 * and writes these tags into that route's static HTML, so crawlers and link
 * previews (LinkedIn, X, Slack) that never run JavaScript still get the right
 * per-page title and card. In the browser Helmet keeps them in step on
 * client-side navigation.
 */
export default function Seo({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  jsonLd = [],
  publishedTime,
  modifiedTime,
}) {
  const url = absoluteUrl(path);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
