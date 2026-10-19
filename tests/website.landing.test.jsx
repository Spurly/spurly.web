// @vitest-environment node
/** The landing-page home: what the prerendered HTML must contain. */
import { describe, it, expect } from 'vitest';
import { render } from 'src/entry-server.jsx';
import { saleFor } from 'src/products/pages/website/pricing.js';

describe('home as a landing page', () => {
  it('leads with the real outcome and Book a call, and keeps Features and Intent signals', async () => {
    const { html } = await render('/');
    expect(html).toContain('AI SDR</em>');
    expect(html).toContain('LinkedIn leads.');
    expect(html).toContain('LinkedIn automation for founders and B2B sales teams');
    expect(html).toContain('href="#book"');
    expect(html).toContain('id="book"');
    expect(html).toContain('id="tour"');
    expect(html).toContain('id="signals"');
    expect(html).toContain('id="pricing"');
    expect(html).toContain('id="faq"');
  });

  it('shows the launch sale bar while the sale is on, with the countdown added in the browser only', async () => {
    const { html } = await render('/');
    if (saleFor('US')) {
      expect(html).toContain('urgency-bar');
    } else {
      expect(html).not.toContain('urgency-bar');
    }
    // the timer ticks client-side, so the prerendered HTML never freezes a stale time
    expect(html).not.toMatch(/Ends in/);
  });

  it('shows the review wall without ratings or review-site names', async () => {
    const { html } = await render('/');
    expect(html).toContain('rv-card');
    expect(html).not.toMatch(/\bG2\b|Capterra|rv-stars|out of 5/);
  });

  it('has one main hero button, and the sale only in the top bar', async () => {
    const { html } = await render('/');
    const hero = html.slice(html.indexOf('hero-lander'), html.indexOf('hero-video'));
    expect((hero.match(/btn btn-primary/g) || []).length).toBe(1);
    expect(hero).not.toContain('sale-pill');
    expect(hero).not.toContain('pt-sale');
  });

  it('labels the flip-clock numbers as a simulation', async () => {
    const { html } = await render('/');
    expect(html).toContain('Simulation · not live data');
    expect(html).toContain('flip-grid');
    expect(html).toContain('Calls booked');
  });
});
