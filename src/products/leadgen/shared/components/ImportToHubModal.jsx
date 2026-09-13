import { useState } from 'react';
import { Dialog, Button, Input } from 'src/ui/primitives';

/**
 * "Import to Hub" naming prompt.
 *
 * Shared by the People page and the CSV Import page — both build a list of
 * `seeds` (profile URL + whatever fields they already have) from whatever the
 * user selected, and this modal's only job is to ask what to call the
 * resulting Hub audience before handing those seeds to
 * `hubSourcingGateway.createManualAudience`. It replaces the old
 * `CreateCampaignModal`'s spot in the flow, but there is nothing to configure
 * here beyond a name — the import itself runs as a background job the Hub
 * leads page already knows how to show progress for.
 */
export function ImportToHubModal({ open, onClose, seedCount, onSubmit, submitting = false }) {
  const [name, setName] = useState('');

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(name.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import to Hub"
      description={`${seedCount} ${seedCount === 1 ? 'profile' : 'profiles'} will be imported as a new Hub audience.`}
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="import-to-hub-form" loading={submitting} disabled={submitting}>
            {submitting ? 'Importing…' : 'Import'}
          </Button>
        </>
      }
    >
      <form id="import-to-hub-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label
          htmlFor="import-to-hub-name"
          className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-secondary)]"
        >
          Name this audience
        </label>
        <Input
          id="import-to-hub-name"
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q3 outbound list"
          disabled={submitting}
        />
        <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] leading-relaxed">
          Each profile is looked up again through your connected LinkedIn account so it arrives in
          Hub as complete as a profile Hub found itself. This can take a few minutes for a large
          list — you'll see progress on the Hub leads page.
        </p>
      </form>
    </Dialog>
  );
}
