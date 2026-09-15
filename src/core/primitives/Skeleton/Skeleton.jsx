/**
 * Loading placeholder. Width accepts a number (px) or any CSS length, so
 * skeleton rows can vary their widths and not read as a striped block.
 */
export function Skeleton({ width = '100%', height = 10, radius = 'var(--ui-radius-xs)', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block bg-[var(--ui-surface-active)] animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
      }}
    />
  );
}
