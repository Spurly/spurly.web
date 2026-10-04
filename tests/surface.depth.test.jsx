import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Surface, SurfaceLayer, DepthProvider, StatTile, SectionCard, Card, MetricCard } from 'src/core/primitives';

/**
 * Surface's depth prop: flat by default (zero change for every existing page),
 * tilt only when the environment can show it, page default via DepthProvider,
 * and an explicit prop always wins over the page default.
 */
const realMatchMedia = globalThis.matchMedia;

function allowMotion(on) {
  globalThis.matchMedia = (query) => ({
    matches: on,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
}

afterEach(() => {
  globalThis.matchMedia = realMatchMedia;
  cleanup();
});

describe('Surface depth', () => {
  it('is flat by default: no depth classes, no glare', () => {
    allowMotion(true);
    render(<Surface data-testid="s">x</Surface>);
    const el = screen.getByTestId('s');
    expect(el.className).not.toMatch(/(^| )ui-surface( |$)/);
    expect(el.querySelector('.ui-surface__glare')).toBeNull();
  });

  it('tilts when asked and the device allows motion', () => {
    allowMotion(true);
    render(<Surface depth="tilt" data-testid="s">x</Surface>);
    const el = screen.getByTestId('s');
    expect(el.className).toMatch(/ui-surface--tilt/);
    expect(el.querySelector('.ui-surface__glare')).not.toBeNull();
  });

  it('falls back to flat for reduced-motion / touch', () => {
    allowMotion(false);
    render(<Surface depth="tilt" data-testid="s">x</Surface>);
    const el = screen.getByTestId('s');
    expect(el.className).not.toMatch(/(^| )ui-surface( |$)/);
    expect(el.querySelector('.ui-surface__glare')).toBeNull();
  });

  it('DepthProvider sets the page default; an explicit prop wins', () => {
    allowMotion(true);
    render(
      <DepthProvider value="tilt">
        <Surface data-testid="inherits">a</Surface>
        <Surface data-testid="flattened" depth="flat">b</Surface>
      </DepthProvider>,
    );
    expect(screen.getByTestId('inherits').className).toMatch(/ui-surface--tilt/);
    expect(screen.getByTestId('flattened').className).not.toMatch(/(^| )ui-surface( |$)/);
  });

  it('ignores an unknown depth value instead of crashing', () => {
    allowMotion(true);
    render(<Surface depth="wobble" data-testid="s">x</Surface>);
    expect(screen.getByTestId('s').className).not.toMatch(/(^| )ui-surface( |$)/);
  });

  it('float adds the idle bob on top of tilt', () => {
    allowMotion(true);
    render(<Surface depth="float" data-testid="s">x</Surface>);
    expect(screen.getByTestId('s').className).toMatch(/ui-surface--float/);
  });

  it('writes tilt variables on pointer move and clears them on leave', () => {
    allowMotion(true);
    vi.stubGlobal('requestAnimationFrame', (cb) => { cb(0); return 1; });
    render(<Surface depth="tilt" data-testid="s">x</Surface>);
    const el = screen.getByTestId('s');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100 });
    fireEvent.pointerMove(el, { clientX: 300, clientY: 0, pointerType: 'mouse' });
    expect(el.dataset.tilting).toBe('true');
    expect(Number(el.style.getPropertyValue('--ry'))).toBeGreaterThan(0);
    expect(Number(el.style.getPropertyValue('--rx'))).toBeGreaterThan(0);
    fireEvent.pointerLeave(el);
    expect(el.dataset.tilting).toBeUndefined();
    expect(el.style.getPropertyValue('--rx')).toBe('0');
    vi.unstubAllGlobals();
  });

  it('ignores touch pointers', () => {
    allowMotion(true);
    render(<Surface depth="tilt" data-testid="s">x</Surface>);
    const el = screen.getByTestId('s');
    fireEvent.pointerMove(el, { clientX: 10, clientY: 10, pointerType: 'touch' });
    expect(el.dataset.tilting).toBeUndefined();
  });

  it('SurfaceLayer renders its children with a z variable', () => {
    render(<SurfaceLayer z={24} data-testid="l">hi</SurfaceLayer>);
    expect(screen.getByTestId('l').style.getPropertyValue('--z')).toBe('24px');
  });
});

describe('cards render through Surface and keep their chrome', () => {
  it('Card / SectionCard / MetricCard / StatTile keep radius, border and shadow', () => {
    render(
      <>
        <Card data-testid="card">c</Card>
        <SectionCard title="T">body</SectionCard>
        <MetricCard label="L" value="1" />
        <StatTile label="S" value="2" />
      </>,
    );
    expect(screen.getByTestId('card').className).toMatch(/rounded-\[var\(--ui-radius-lg\)\]/);
    expect(screen.getByTestId('card').className).toMatch(/border-\[var\(--ui-border\)\]/);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('Card keeps its sunken and interactive variants', () => {
    render(<Card variant="sunken" interactive data-testid="c">x</Card>);
    const cls = screen.getByTestId('c').className;
    expect(cls).toMatch(/surface-sunken/);
    expect(cls).toMatch(/cursor-pointer/);
  });
});
