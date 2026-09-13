import { Link } from 'react-router-dom';
import { Linkedin, Send, MessageSquare, Search } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { DataTable } from 'src/platform/DataTable';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Dock, Tag } from 'src/ui/primitives';
import { useLeadsPage } from 'src/products/hub/leads/hooks/useLeadsPage.js';
import { hubLeadColumns } from './components/columns.jsx';
import { LeadDrawer } from './components/LeadDrawer.jsx';
import { AudienceForm } from './components/AudienceForm.jsx';
import { AudienceList, ImportStrip } from './components/AudienceList.jsx';
import { leadsStrings as t } from './strings.js';

/**
 * Hub leads — paste a LinkedIn search, get an audience.
 *
 * The page is built around one fact: importing takes minutes, not
 * milliseconds. Ten results per call against LinkedIn means a thousand leads is
 * about a hundred calls, so submitting a URL only queues an audience — a worker
 * pages it in the background and this page polls.
 *
 * Which is why progress here is a COUNT and never a bar. Classic search returns
 * no total, so the honest answer to "how far along is it?" is "412 so far", and
 * a progress bar would have to invent the denominator.
 */
export function HubLeadsPage() {
  const {
    searches,
    leads,
    pagination,
    activeSearchId,
    setActiveSearchId,
    activeSearch,
    query,
    setQuery,
    loading,
    submitting,
    needsAccount,
    selected,
    setSelected,
    creating,
    selectedLead,
    setSelectedLead,
    sequences,
    enrolling,
    loadLeads,
    createAudience,
    runSearch,
    deleteSearch,
    createCampaign,
    createMessageCampaign,
    enrollInSequence,
    handleLeadResolved,
  } = useLeadsPage();

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={
        `${pagination.total.toLocaleString()} ${pagination.total === 1 ? 'person' : 'people'}` +
        (searches.length ? ` · ${searches.length} ${searches.length === 1 ? 'audience' : 'audiences'}` : '')
      }
    >
      <div className="flex flex-col gap-4 pb-20">
        {/*
          * The import form moved into the dock at the bottom of the screen.
          *
          * What is left here is the one thing that must interrupt: a missing
          * LinkedIn connection. That is not a form problem, it is a "nothing
          * on this page can work yet" problem, and burying it inside a panel
          * the user has to open first would hide the reason their imports
          * fail behind the very control that fails.
          */}
        {needsAccount && (
          <SectionCard title={t.connectLinkedIn.title}>
            <div className="flex items-start gap-3">
              <Linkedin size={17} className="mt-0.5 shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
              <div>
                <p className="text-[var(--ui-t-body)] text-[var(--ui-text-primary)]">
                  {t.connectLinkedIn.body}
                </p>
                <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-1">
                  {t.connectLinkedIn.hint}
                </p>
                <Link
                  to="/dashboard/settings/linkedin"
                  className="inline-block mt-3 text-[var(--ui-t-body)] font-semibold text-[var(--ui-accent-fg)] hover:underline"
                >
                  {t.connectLinkedIn.cta}
                </Link>
              </div>
            </div>
          </SectionCard>
        )}

        {/*
          * What is left of the Audiences card, and why.
          *
          * The card was doing four jobs at once — filtering the table,
          * reporting progress, managing the audience, and surfacing the
          * stopped-short error — from a permanent box sitting between the page
          * header and the thing you came to look at.
          *
          * Only progress earns a permanent place: an import runs for minutes
          * and somebody is waiting on it, so hiding it behind a closed panel
          * would be worse than the card was. ImportStrip exists exactly while
          * something is running and then disappears, rather than taking up
          * space to report that nothing is happening.
          *
          * The filter is one chip. Management moved into the dock.
          */}
        <ImportStrip searches={searches} />

        {activeSearch && (
          <div className="flex items-center gap-2">
            <span className="ui-micro">{t.filteredBy}</span>
            <Tag
              tone="accent"
              removable
              onRemove={() => setActiveSearchId(null)}
              title={activeSearch.name || t.untitledAudience}
            >
              {activeSearch.name || t.untitledAudience}
            </Tag>
          </div>
        )}

        <DataTable
          columns={hubLeadColumns}
          data={leads}
          loading={loading}
          emptyMessage={activeSearchId ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
          emptyHint={
            searches.length === 0
              ? t.table.emptyHintNoAudience
              : t.table.emptyHintImporting
          }
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRowClick={setSelectedLead}
          toolbar={{
            searchValue: query,
            onSearch: setQuery,
            searchPlaceholder: t.table.searchPlaceholder,
            bulkActions: (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  leadingIcon={<Send size={13} />}
                  onClick={createCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0}
                >
                  {t.table.createCampaign}
                </Button>
                {/* A message campaign is scoped to leads who are already
                    1st-degree connections — see createMessageCampaign's own
                    comment. Selecting a mix is fine: anyone not yet connected
                    is simply skipped once the campaign runs, same as every
                    other skip reason on the detail page's member table. */}
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon={<MessageSquare size={13} />}
                  onClick={createMessageCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0}
                >
                  {t.table.createMessageCampaign}
                </Button>
                <select
                  value=""
                  onChange={(e) => enrollInSequence(e.target.value)}
                  disabled={enrolling || selected.size === 0 || sequences.length === 0}
                  aria-label="Enroll selection in a sequence"
                  title={sequences.length === 0 ? t.table.enrollTitleDisabled : t.table.enrollTitleEnabled}
                  className="text-[var(--ui-t-label)] h-7 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 text-[var(--ui-text-secondary)] disabled:opacity-50"
                >
                  <option value="" disabled>{enrolling ? t.table.enrolling : t.table.enrollPlaceholder}</option>
                  {sequences.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ),
          }}
          pagination={{
            page: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => loadLeads(undefined, { page }),
          }}
        />
      </div>

      {/* Parked at the bottom of every state of this page, including the
          empty one — the primary action of the screen should not be reachable
          only from inside an empty state that disappears the moment one lead
          arrives. */}
      <Dock
        label={t.dock.label}
        icon={<Search size={16} />}
        badge={
          searches.length > 0
            ? <Tag tone="accent">{searches.length} {t.dock.saved}</Tag>
            : null
        }
        disabled={needsAccount}
      >
        <AudienceList
          searches={searches}
          activeSearchId={activeSearchId}
          onSelect={setActiveSearchId}
          onRun={runSearch}
          onDelete={deleteSearch}
          busy={submitting}
        />

        <div
          className="flex items-center gap-3 px-[var(--ui-pad-lg)] border-y border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)]"
          style={{ height: 'var(--ui-band)' }}
        >
          <span className="text-[var(--ui-t-section)] font-semibold">{t.dock.buildNew}</span>
        </div>

        <AudienceForm onSubmit={createAudience} submitting={submitting} />
      </Dock>

      {selectedLead && (
        <LeadDrawer
          /* Remounts on a different row so LeadDrawer's own state resets
             cleanly instead of syncing via an effect. */
          key={selectedLead._id}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onResolved={handleLeadResolved}
        />
      )}
    </DashboardLayout>
  );
}
