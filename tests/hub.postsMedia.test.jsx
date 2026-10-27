import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * Your posts: the image/video on a post and its full text must be visible.
 * Shapes are the server's own (spurly.backend hub/posts listOwnPosts returns the raw HubPost).
 */
const HOUR = 3600_000;
const LONG = `${'A long LinkedIn post. '.repeat(30)}THE-END`;

const posts = [
  { _id: 'p1', status: 'scheduled', text: 'Scheduled with a picture', mediaKind: 'image', mediaName: 'visual.png', assetId: 'a1', scheduledFor: new Date(Date.now() + 3 * HOUR).toISOString() },
  { _id: 'p2', status: 'published', text: LONG, mediaKind: '', socialId: 's2', publishedAt: new Date(Date.now() - HOUR).toISOString() },
  { _id: 'p3', status: 'published', text: 'Sent from the browser', mediaKind: 'image', mediaName: 'photo.png', socialId: 's3', publishedAt: new Date(Date.now() - 2 * HOUR).toISOString() },
  { _id: 'p4', status: 'published', text: 'Deleted file', mediaKind: 'image', mediaName: 'gone.png', assetId: 'a-gone', socialId: 's4', publishedAt: new Date(Date.now() - 3 * HOUR).toISOString() },
];

const requested = [];
vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/posts': { success: true, data: { posts } },
  'GET /hub/posts/usage': { success: true, data: { connected: true, usage: {} } },
  'GET /hub/content/assets/a1/preview': async (url) => { requested.push(url); return new Blob(['x'], { type: 'image/jpeg' }); },
  'GET /hub/content/assets/a1/file': async (url) => { requested.push(url); return new Blob(['x'], { type: 'image/png' }); },
  'GET /hub/content/assets/a-gone/preview': async () => { throw Object.assign(new Error('gone'), { code: 'ASSET_NOT_FOUND' }); },
  'GET /*': { success: true, data: {} },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubPostsPage } = await import('src/products/pages/posts/index.jsx');

describe('Posts page media', () => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();

  it('shows the stored image on a scheduled post and opens it full size', async () => {
    renderWithProviders(<HubPostsPage />);
    const img = await screen.findByAltText('visual.png');
    expect(img).toHaveAttribute('src', 'blob:preview');
    expect(requested.some((u) => u.endsWith('/a1/preview'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'View full image' }));
    await waitFor(() => expect(requested.some((u) => u.endsWith('/a1/file'))).toBe(true));
  });

  it('puts the scheduled post under Up next and keeps the rest as History', async () => {
    renderWithProviders(<HubPostsPage />);
    expect(await screen.findByRole('region', { name: 'Up next' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'History' })).toBeInTheDocument();
  });

  it('keeps the whole text reachable behind Show more', async () => {
    renderWithProviders(<HubPostsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Show more' }));
    expect(screen.getByText(/THE-END/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('says so, instead of showing nothing, when there is no file to preview', async () => {
    renderWithProviders(<HubPostsPage />);
    expect(await screen.findByText(/no preview is kept/i)).toBeInTheDocument();
    expect(await screen.findByText('Preview unavailable: gone')).toBeInTheDocument();
  });
});
