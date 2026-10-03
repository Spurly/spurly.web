import PageLayout from "./PageLayout.jsx";
import PlanCard from "../components/PlanCard.jsx";
import { SOFTWARE_LD } from "../structuredData.js";

/* /pricing: the single region-aware plan card above the written trial explainer,
   with the SoftwareApplication entity (two real Offers) in the structured data. */
export default function PricingTemplate({ meta, body }) {
  const card = (
    <div className="price-grid single">
      <PlanCard />
    </div>
  );
  return <PageLayout meta={meta} body={body} eyebrow="Pricing" before={card} extraLd={[SOFTWARE_LD]} inlineCtas={false} />;
}
