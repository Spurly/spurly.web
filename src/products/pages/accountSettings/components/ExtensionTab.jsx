import { Puzzle, RefreshCw, ExternalLink } from 'lucide-react';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button } from 'src/core/primitives';
import { useExtension } from 'src/core/extension/hooks/useExtension';
import { settingsStrings as t } from '../strings.js';

export function ExtensionTab() {
  const { installed, loggedIn, loginKnown, version, checking, recheck } = useExtension();

  const status = checking
    ? { label: t.extension.status.checking, color: 'var(--ui-text-tertiary)', tint: 'var(--ui-surface-sunken)' }
    : !installed
      ? { label: t.extension.status.notInstalled, color: 'var(--ui-danger)', tint: 'var(--ui-danger-tint)' }
      // Installed, but the background worker never answered — unknown, not
      // signed out. Recheck is right there, so say what is actually true.
      : !loginKnown
        ? { label: t.extension.status.notResponding, color: 'var(--ui-text-tertiary)', tint: 'var(--ui-surface-sunken)' }
        : !loggedIn
          ? { label: t.extension.status.notSignedIn, color: 'var(--ui-warning)', tint: 'var(--ui-warning-tint)' }
          : { label: t.extension.status.connected, color: 'var(--ui-success)', tint: 'var(--ui-success-tint)' };

  return (
    <SectionCard title={t.extension.sectionTitle}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
            style={{ background: status.tint, color: status.color }}
          >
            <Puzzle size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[length:var(--ui-t-body)] font-medium" style={{ color: status.color }}>
              {status.label}
            </div>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-0.5">
              {version ? `Version ${version}` : t.extension.defaultCaption}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={recheck}
            disabled={checking}
            leadingIcon={<RefreshCw size={15} />}
          >
            {t.extension.recheck}
          </Button>
        </div>

        {!checking && !installed && (
          <div
            className="rounded-[var(--ui-radius-lg)] p-4"
            style={{ background: 'var(--ui-danger-tint)', border: '1px solid rgba(255,69,58,0.22)' }}
          >
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] leading-relaxed">
              {t.extension.notInstalledBody}
            </p>
            <a
              href={t.extension.installUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[length:var(--ui-t-body)] font-medium"
              style={{ color: 'var(--ui-accent-fg)' }}
            >
              {t.extension.installLink}
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {!checking && installed && loginKnown && !loggedIn && (
          <div
            className="rounded-[var(--ui-radius-lg)] p-4"
            style={{ background: 'var(--ui-warning-tint)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-primary)] leading-relaxed">
              {t.extension.notSignedInBody}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default ExtensionTab;
