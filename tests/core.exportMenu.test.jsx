import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportMenu } from 'src/core/primitives/ExportMenu';

/** The Export button's menu: hover or click opens it, a pick runs once and closes it, Escape and outside clicks close. */

const items = (onPage = vi.fn(), onAll = vi.fn()) => [
  { key: 'page', label: 'Export this page', hint: '50 leads', onSelect: onPage },
  { key: 'all', label: 'Bulk export', onSelect: onAll, disabled: false },
];

describe('ExportMenu', () => {
  it('is closed until hovered or clicked', () => {
    render(<ExportMenu items={items()} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Export/ }).parentElement);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('click opens it too (touch and keyboard), and a pick runs once and closes it', () => {
    const onPage = vi.fn();
    render(<ExportMenu items={items(onPage)} />);
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Export this page/ }));
    expect(onPage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('a real mouse (hover, then click) leaves it open: the click must not close what the hover opened', async () => {
    render(<ExportMenu items={items()} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /Export/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('Escape and a click outside close it', () => {
    render(<div><span>outside</span><ExportMenu items={items()} /></div>);
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('a disabled or busy button never opens, and a disabled item cannot be picked', () => {
    const { rerender } = render(<ExportMenu items={items()} disabled />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Export/ }).parentElement);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const onAll = vi.fn();
    rerender(<ExportMenu items={[{ key: 'all', label: 'Bulk export', onSelect: onAll, disabled: true }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Bulk export/ }));
    expect(onAll).not.toHaveBeenCalled();
  });
});
