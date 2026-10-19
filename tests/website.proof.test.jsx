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

describe("launch sale", () => {
  it("ends at one fixed moment for everyone, then the list price returns", () => {
    const off = { demo: false };
    expect(saleFor("US", Date.parse("2026-10-21T22:59:59+05:30"), off)).not.toBeNull();
    expect(saleFor("US", Date.parse("2026-10-21T23:00:01+05:30"), off)).toBeNull();
    // demo mode (local dev) never ends the sale; the countdown rolls instead
    expect(saleFor("US", Date.parse("2027-01-01T00:00:00+05:30"), { demo: true })).not.toBeNull();
  });

  it("computes the discount per region", () => {
    const during = Date.parse("2026-10-20T12:00:00+05:30");
    expect(saleFor("IN", during, { demo: false })).toMatchObject({ listLabel: "₹2,499", saleLabel: "₹499", percentOff: 80 });
    expect(saleFor("US", during, { demo: false })).toMatchObject({ listLabel: "$24.99", saleLabel: "$11", percentOff: 56 });
  });
});

import { EXAMPLES, projectExample } from "../src/products/pages/website/proof/proof.js";
import { getDemoDeadline } from "../src/products/pages/website/sale/controller/demoDeadline.js";
import { timeLeft } from "../src/products/pages/website/hooks/useCountdown.js";
import ExampleScenarios from "../src/products/pages/website/components/home/ExampleScenarios.jsx";

describe("example scenarios", () => {
  it("are plain arithmetic on their stated assumptions", () => {
    const [founder, recruiter, agency] = EXAMPLES.map(projectExample);
    expect(founder).toEqual({ invites: 480, connections: 216 });
    expect(recruiter).toEqual({ invites: 240, connections: 108 });
    expect(agency).toEqual({ invites: 1440, connections: 648 });
  });

  it("use the real account's accept rate and carry no invented people or quotes", () => {
    const real = REAL.caseStudies[0];
    const rate = Number(real.stats[1].value.replace("%", "")) / 100;
    for (const e of EXAMPLES) {
      expect(e.acceptRate).toBe(rate);
      expect(e.who).toMatch(/^Example: /);
      expect(JSON.stringify(e)).not.toMatch(/“|"quote"|rating/i);
    }
  });

  it("render with an Example label on every card and the sum shown", () => {
    const html = renderToStaticMarkup(<ExampleScenarios />);
    expect((html.match(/Example · not a customer result/g) || []).length).toBe(EXAMPLES.length);
    expect(html).toContain("80 invites a week × 6 weeks = 480 invites, at 45% accepted");
  });
});

describe("sale countdown", () => {
  it("shows no countdown without a real deadline, and none once it has passed", () => {
    expect(timeLeft(null, Date.now())).toBeNull();
    expect(timeLeft("2020-01-01T00:00:00+05:30", Date.now())).toBeNull();
  });

  it("counts down from a fixed end date", () => {
    const end = "2026-11-01T00:00:00+05:30";
    const now = Date.parse("2026-10-30T22:58:55+05:30");
    expect(timeLeft(end, now)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 5 });
  });
});

describe("demo rolling countdown (local only)", () => {
  it("falls back to 2 days from now when storage is unavailable", () => {
    const now = Date.parse("2026-10-20T10:00:00Z");
    const end = Date.parse(getDemoDeadline(now));
    expect(end - now).toBe(2 * 24 * 60 * 60 * 1000);
  });
});

import { buildRun } from "../src/products/pages/website/simulation/controller/buildRun.js";
import {
  SIM_DAYS, SIM_INVITES_PER_DAY, SIM_REPLIES_PER_DAY, SIM_CALLS_PER_WEEK,
} from "../src/products/pages/website/simulation/constants/constants.js";

describe("flip-clock simulation", () => {
  const run = buildRun();

  it("is the same every time (server and browser agree) and starts from zero", () => {
    expect(buildRun()).toEqual(run);
    expect([run.invites[0], run.replies[0], run.calls[0]]).toEqual([0, 0, 0]);
    expect(run.invites).toHaveLength(SIM_DAYS + 1);
  });

  it("stays inside the configured ranges", () => {
    for (let d = 1; d <= SIM_DAYS; d += 1) {
      const inv = run.invites[d] - run.invites[d - 1];
      const rep = run.replies[d] - run.replies[d - 1];
      const calls = run.calls[d] - run.calls[d - 1];
      expect(inv).toBeGreaterThanOrEqual(SIM_INVITES_PER_DAY[0]);
      expect(inv).toBeLessThanOrEqual(SIM_INVITES_PER_DAY[1]);
      expect(rep).toBeGreaterThanOrEqual(SIM_REPLIES_PER_DAY[0]);
      expect(rep).toBeLessThanOrEqual(SIM_REPLIES_PER_DAY[1]);
      if (d % 7 === 0) {
        expect(calls).toBeGreaterThanOrEqual(SIM_CALLS_PER_WEEK[0]);
        expect(calls).toBeLessThanOrEqual(SIM_CALLS_PER_WEEK[1]);
      } else {
        expect(calls).toBe(0);
      }
    }
  });

  it("never claims more replies than invites, and keeps to a safe weekly pace", () => {
    expect(run.replies[SIM_DAYS]).toBeLessThan(run.invites[SIM_DAYS]);
    expect(SIM_INVITES_PER_DAY[1] * 7).toBeLessThanOrEqual(100);
  });
});
