import PageLayout from "./PageLayout.jsx";
import ConnectionRequestTool from "../tools/components/ConnectionRequestTool.jsx";

/* Tool pages (SEO_CONTENT_PLAN section 6). `tool:` in the frontmatter picks the
   widget shown above the explanatory text. */
const TOOLS = {
  "connection-request-generator": ConnectionRequestTool,
};

export default function ToolTemplate({ meta, body }) {
  const Tool = TOOLS[meta.tool];
  return <PageLayout meta={meta} body={body} eyebrow="Free tool" before={Tool ? <Tool /> : null} inlineCtas={false} />;
}
