import { useState } from 'react';
import { Dialog, Button, Checkbox, Dropdown } from 'src/core/primitives';
import { campaignsStrings } from '../strings.js';
import { refusalText, poolErrorText } from './refusalCopy.js';

const t = campaignsStrings.pool;

/**
 * "Send from several accounts": tick the accounts, preview who would send to whom, then create.
 * The preview is read-only. Nothing here pre-checks 1st-degree for the acting account: the server decides per person
 * which ticked account can reach them and the table says who is left out and why.
 *
 * `pool` is the useSenderPool state; `onConfirm({ accountIds, type })` creates (the page owns what happens next).
 */
export function SenderPoolDialog({ open, onClose, pool, leadCount = 0, allowTypeChoice = true, defaultType = 'connect', previewParams = {}, onConfirm, creating = false, createError = null }) {
  const [type, setType] = useState(defaultType);
  const { accounts, selected, toggle, validation, preview, loading, error, requestPreview } = pool;
  const noLeads = leadCount === 0;
  const canPreview = validation.ok && !noLeads && !loading;
  const nothingToSend = preview && (preview.total ?? 0) === 0;
  const canCreate = canPreview && !!preview && !nothingToSend && !creating;

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onClose} disabled={creating}>{t.cancel}</Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onConfirm({ accountIds: selected, type })}
        loading={creating}
        disabled={!canCreate}
        title={!validation.ok ? validation.reason : noLeads ? t.needSelection : !preview ? t.previewButton : nothingToSend ? t.previewEmpty : undefined}
      >
        {creating ? t.creating : t.create}
      </Button>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} title={t.title} description={t.description} size="lg" footer={footer}>
      <div className="space-y-4 px-5 pb-4">
        {accounts.length < 2 ? (
          <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{t.noAccounts}</p>
        ) : (
          <fieldset>
            <legend className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-1.5">{t.accountsLabel}</legend>
            <div className="grid gap-1.5">
              {accounts.map((a) => (
                <Checkbox
                  key={a.id}
                  checked={selected.includes(String(a.id))}
                  onChange={() => toggle(a.id)}
                  label={a.name || a.publicIdentifier || 'LinkedIn account'}
                />
              ))}
            </div>
            {!validation.ok && selected.length > 0 && (
              <p className="mt-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{validation.reason}</p>
            )}
          </fieldset>
        )}

        {allowTypeChoice && (
          <div>
            <span className="block text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)] mb-1.5">{t.typeLabel}</span>
            <Dropdown
              variant="dashboard"
              size="sm"
              value={type}
              onChange={(v) => { setType(v); pool.reset?.(); }}
              ariaLabel={t.typeLabel}
              options={[['connect', t.typeConnect], ['message', t.typeMessage]]}
            />
          </div>
        )}

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => requestPreview({ ...previewParams, type })}
            loading={loading}
            disabled={!canPreview}
            title={!validation.ok ? validation.reason : noLeads ? t.needSelection : undefined}
          >
            {t.previewButton}
          </Button>
        </div>

        {loading && <p role="status" className="text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">{t.previewing}</p>}
        {error && !loading && <p role="alert" className="text-[length:var(--ui-t-control)] text-[var(--ui-danger-fg,inherit)]">{poolErrorText(error) === campaignsStrings.errors.fallback ? t.previewError : poolErrorText(error)}</p>}
        {createError && <p role="alert" className="text-[length:var(--ui-t-control)]">{poolErrorText(createError) === campaignsStrings.errors.fallback ? t.createFailed : poolErrorText(createError)}</p>}

        {preview && !loading && (
          <div data-testid="pool-preview" className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-3 space-y-2">
            <p className="font-medium text-[length:var(--ui-t-control)]">{t.total(preview.total ?? 0)}</p>
            {nothingToSend && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.previewEmpty}</p>}
            <ul className="space-y-0.5 text-[length:var(--ui-t-control)]">
              {(preview.perAccount || []).map((row) => (
                <li key={row.accountId}>{t.perAccount(row.name, row.count)}</li>
              ))}
            </ul>
            {(preview.alreadyConnected ?? 0) > 0 && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.alreadyConnected(preview.alreadyConnected)}</p>}
            {(preview.refusedOtherAccount ?? 0) > 0 && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{t.otherAccount(preview.refusedOtherAccount)}</p>}
            {(preview.refused || []).length > 0 && (
              <div>
                <p className="text-[length:var(--ui-t-label)] font-medium mt-1">{t.refusedHeading}</p>
                <ul className="space-y-1">
                  {preview.refused.map((r) => (
                    <li key={r.reason} className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                      {r.count.toLocaleString()} — {refusalText(r.reason)}
                      {r.accountNames?.length ? ` (${r.accountNames.join(', ')})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
