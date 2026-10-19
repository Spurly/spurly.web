import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { REAL, SAMPLE } from "../src/products/pages/website/proof/proof.js";
import { saleFor } from "../src/products/pages/website/pricing.js";
import CaseStudies from "../src/products/pages/website/components/home/CaseStudies.jsx";

describe("proof data", () => {
  it("never marks a real entry as a sample, and keeps sample text labelled", () => {
    for (const list of [REAL.reviews, REAL.caseStudies, REAL.ratings]) {
      for (const x of list) expect(JSON.stringify(x)).not.toMatch(/sample/i);
    }
    for (const r of SAMPLE.reviews) expect(r.quote).toMatch(/^Sample/);
  });

  it("the real case study's numbers are consistent", () => {
    const c = REAL.caseStudies[0];
    expect(c.stats.map((s) => s.value)).toEqual(["476", "45%", "304"]);
    expect(Math.round((214 / 476) * 100)).toBe(45);
  });

  it("renders case studies with the sample tag only for sample entries", () => {
    const html = renderToStaticMarkup(<MemoryRouter><CaseStudies /></MemoryRouter>);
    expect(html).toContain("214 new connections in 42 days");
    const samples = (html.match(/rv-sample/g) || []).length;
    expect(samples).toBe(SAMPLE.caseStudies.length);
  });
});

describe("launch sale", () => {
  it("computes the discount per region", () => {
    expect(saleFor("IN")).toMatchObject({ listLabel: "₹2,499", saleLabel: "₹499", percentOff: 80 });
    expect(saleFor("US")).toMatchObject({ listLabel: "$24.99", saleLabel: "$11", percentOff: 56 });
  });
});
