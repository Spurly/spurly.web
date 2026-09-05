/**
 * Shown while a lazily-loaded route chunk is in flight.
 *
 * Deliberately matches SubscribeGate's loader rather than introducing a second
 * loading look — a user navigating between guarded pages would otherwise see
 * two different spinners for the same wait.
 */
export function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ui-surface-page)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ui-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--ui-text-secondary)] text-[13px]">Loading...</p>
      </div>
    </div>
  );
}
