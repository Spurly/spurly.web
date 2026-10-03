import { useLocation } from "react-router-dom";
import { CONTENT_META } from "../content/content.meta.generated.js";
import { CONTENT_BODIES } from "../content/content.bodies.generated.js";
import NotFound from "./NotFound.jsx";
import ArticleTemplate from "../templates/ArticleTemplate.jsx";
import ProductTemplate from "../templates/ProductTemplate.jsx";
import SolutionsTemplate from "../templates/SolutionsTemplate.jsx";
import ComparisonTemplate from "../templates/ComparisonTemplate.jsx";
import PricingTemplate from "../templates/PricingTemplate.jsx";
import ToolTemplate from "../templates/ToolTemplate.jsx";
import PageTemplate from "../templates/PageTemplate.jsx";

/* One route component for every page built from a content file. The path picks
   the page, its `template` frontmatter picks the layout. */
const TEMPLATE_COMPONENTS = {
  article: ArticleTemplate,
  product: ProductTemplate,
  solutions: SolutionsTemplate,
  comparison: ComparisonTemplate,
  pricing: PricingTemplate,
  tool: ToolTemplate,
  page: PageTemplate,
};

export default function ContentPage() {
  const { pathname } = useLocation();
  const meta = CONTENT_META.find((p) => p.path === pathname);
  if (!meta) return <NotFound />;
  const Template = TEMPLATE_COMPONENTS[meta.template];
  return <Template meta={meta} body={CONTENT_BODIES[meta.path] || []} />;
}
