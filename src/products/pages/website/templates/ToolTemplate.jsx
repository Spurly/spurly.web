import PageLayout from "./PageLayout.jsx";

/* /tool pages (see SEO_CONTENT_PLAN section 6 for the outline). */
export default function ToolTemplate({ meta, body }) {
  return <PageLayout meta={meta} body={body} eyebrow="Free tool" />;
}
