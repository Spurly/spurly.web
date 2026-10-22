import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { REAL, SAMPLE } from "../src/products/pages/website/proof/proof.js";
import { saleFor, currentSaleEnd, SALE } from "../src/products/pages/website/pricing.js";
import CaseStudies from "../src/products/pages/website/components/home/CaseStudies.jsx";

describe("proof data", () => {
  it("never marks a real entry as a sample, and keeps sample text labelled", () => {
    for (const list of [REAL.reviews, REAL.caseStudies, REAL.ratings]) {
      for (const x of list) expect(JSON.stringify(x)).not.toMatch(/sample/i);
    }
    // sample reviews live only in SAMPLE, and reach the page only through the dev/env gate
    const real = JSON.stringify(REAL);
    for (const r of SAMPLE.reviews) expect(real).not.toContain(r.name);
    expect(SAMPLE.ratings).toEqual([]);
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

describe("launch offer", () => {
  it("is seat-based: no countdown, no repeating timer", () => {
    expect(SALE.cycle).toBeNull();
    expect(SALE.endsAt).toBeNull();
    expect(currentSaleEnd(Date.parse("2027-01-01T00:00:00+05:30"))).toBeNull();
    expect(saleFor("IN", Date.now(), { demo: false }).seats).toBe(100);
  });

  it("computes the discount per region against the regular price", () => {
    const now = Date.parse("2026-10-22T12:00:00+05:30");
    expect(saleFor("IN", now, { demo: false })).toMatchObject({ listLabel: "₹2,499", saleLabel: "₹1,499", percentOff: 40, audience: "first 100 members" });
    expect(saleFor("US", now, { demo: false })).toMatchObject({ listLabel: "$24.99", saleLabel: "$14.99", percentOff: 40 });
  });
});
