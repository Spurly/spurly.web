import { Link } from "react-router-dom";
import { Linkedin, Send, MessageSquare, Search, Sparkles } from "lucide-react";
import { DashboardLayout } from "src/platform/layout/DashboardLayout";
import { DataTable } from "src/platform/DataTable";
import { SectionCard } from "src/ui/primitives/SectionCard";
import { PageTabs } from "src/ui/primitives/PageTabs";
import { Button, Dock, Tag } from "src/ui/primitives";
import { useLeadsPage } from "src/products/hub/leads/hooks/useLeadsPage.js";
import { hubLeadColumns, hubLeadEnrichColumns } from "./components/columns.jsx";
import { LeadDrawer } from "./components/LeadDrawer.jsx";
import { AudienceForm } from "./components/AudienceForm.jsx";
import { AudienceList, ImportStrip } from "./components/AudienceList.jsx";
import { leadsStrings as t } from "./strings.js";

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
    query,
    setQuery,
    loading,
    submitting,
    needsAccount,
    selected,
    setSelected,
    creating,
    creatingEnrichment,
    createEnrichmentCampaign,
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
    selectedAreAllFirstDegree,
    enrollInSequence,
    handleLeadResolved,

    // Enrich tab
    activeTab,
    setActiveTab,
    enrichLeads,
    enrichPagination,
    enrichLoading,
    enrichQuery,
    setEnrichQuery,
    enrichSelected,
    setEnrichSelected,
    queuingEnrich,
    loadEnrichLeads,
    queueEnrichment,
  } = useLeadsPage();

  const tabs = [
    { id: "all", label: t.tabs.all },
    { id: "enrich", label: t.tabs.enrich, count: enrichPagination.total },
  ];

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={
        `${pagination.total.toLocaleString()} ${pagination.total === 1 ? "person" : "people"}` +
        (searches.length
          ? ` · ${searches.length} ${searches.length === 1 ? "audience" : "audiences"}`
          : "")
      }
      scrollable={false}
    >
      <div className="flex flex-col gap-4 h-full min-h-0 pb-20">
        {/*
         * Two tabs (HUB_CAPTURE_RESTRUCTURE_PLAN.md §11): "All leads" is
         * this page exactly as it always was; "Needs enrichment" is a
         * server-filtered view of the same HubLead collection with one
         * job — select some, hit Enrich, Unipile fills them in through the
         * bulk queue + enrichJob.js worker, and this same page's polling
         * (useLeadsPage's anyBusy) picks the result up live either way.
         */}
        <PageTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/*
         * The import form moved into the dock at the bottom of the screen.
         *
         * What is left here is the one thing that must interrupt: a missing
         * LinkedIn connection. That is not a form problem, it is a "nothing
         * on this page can work yet" problem, and burying it inside a panel
         * the user has to open first would hide the reason their imports
         * fail behind the very control that fails. Shown regardless of tab —
         * enrichment costs a Unipile call same as importing does, so it
         * needs the same account before either tab's action can work.
         */}
        {needsAccount && (
          <SectionCard title={t.connectLinkedIn.title}>
            <div className="flex items-start gap-3">
              <Linkedin
                size={17}
                className="mt-0.5 shrink-0 text-[var(--ui-text-tertiary)]"
                aria-hidden="true"
              />
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
        {activeTab === "all" && <ImportStrip searches={searches} />}

        {activeTab === "all" && (
          <div className="flex-1 min-h-0">
            <DataTable
              columns={hubLeadColumns}
              data={leads}
              loading={loading}
              emptyMessage={
                activeSearchId
                  ? t.table.emptyMessageFiltered
                  : t.table.emptyMessageAll
              }
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
                // The list picker — was a chip above the table fed by the dock's
                // full audience panel, now a plain dropdown right where the rest
                // of the table's filtering lives. Defaults to "All people"
                // (activeSearchId === null); the dock still owns building and
                // managing (run/delete) a saved search, this is only for
                // choosing which one's results the table is showing.
                filters: (
                  <select
                    value={activeSearchId ?? ""}
                    onChange={(e) => setActiveSearchId(e.target.value || null)}
                    aria-label={t.table.listFilterLabel}
                    className="text-[var(--ui-t-label)] h-7 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 text-[var(--ui-text-secondary)] max-w-[200px]"
                  >
                    <option value="">{t.table.listFilterAll}</option>
                    {searches.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name || t.untitledAudience}
                      </option>
                    ))}
                  </select>
                ),
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
                    {/* A message campaign may only ever be ALL 1st-degree
                      connections -- the server rejects a mixed selection
                      outright (NOT_ALL_FIRST_DEGREE) rather than quietly
                      skipping whoever isn't connected yet, so the button
                      reflects that up front instead of letting the click
                      round-trip to a 400 the Degree column already predicted. */}
                    <Button
                      size="sm"
                      variant="secondary"
                      leadingIcon={<MessageSquare size={13} />}
                      onClick={createMessageCampaign}
                      loading={creating}
                      disabled={
                        creating ||
                        selected.size === 0 ||
                        !selectedAreAllFirstDegree
                      }
                      title={
                        selected.size > 0 && !selectedAreAllFirstDegree
                          ? "Everyone selected must already be a 1st-degree connection to message them"
                          : undefined
                      }
                    >
                      {t.table.createMessageCampaign}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leadingIcon={<Sparkles size={13} />}
                      onClick={createEnrichmentCampaign}
                      loading={creatingEnrichment}
                      disabled={creatingEnrichment || selected.size === 0}
                    >
                      {t.table.createEnrichmentCampaign}
                    </Button>
                    <select
                      value=""
                      onChange={(e) => enrollInSequence(e.target.value)}
                      disabled={
                        enrolling ||
                        selected.size === 0 ||
                        sequences.length === 0
                      }
                      aria-label="Enroll selection in a sequence"
                      title={
                        sequences.length === 0
                          ? t.table.enrollTitleDisabled
                          : t.table.enrollTitleEnabled
                      }
                      className="text-[var(--ui-t-label)] h-7 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)] px-2 text-[var(--ui-text-secondary)] disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {enrolling
                          ? t.table.enrolling
                          : t.table.enrollPlaceholder}
                      </option>
                      {sequences.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
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
        )}

        {/*
         * "Needs enrichment" — same table, server-filtered
         * (enrichmentStatus !== 'enriched'), with one bulk action instead of
         * campaigns/sequences: those act on people you're ready to reach out
         * to, this acts on people you don't have a full profile for yet.
         * Selection is its own Set (enrichSelected) so it never bleeds into
         * "All leads"'s selection or vice versa.
         */}
        {activeTab === "enrich" && (
          <div className="flex-1 min-h-0">
            <DataTable
              columns={hubLeadEnrichColumns}
              data={enrichLeads}
              loading={enrichLoading}
              emptyMessage={t.enrichTab.emptyMessage}
              emptyHint={t.enrichTab.emptyHint}
              selectable
              selectedKeys={enrichSelected}
              onSelectionChange={setEnrichSelected}
              onRowClick={setSelectedLead}
              toolbar={{
                searchValue: enrichQuery,
                onSearch: setEnrichQuery,
                searchPlaceholder: t.enrichTab.searchPlaceholder,
                bulkActions: (
                  <Button
                    size="sm"
                    variant="primary"
                    leadingIcon={<Sparkles size={13} />}
                    onClick={queueEnrichment}
                    loading={queuingEnrich}
                    disabled={queuingEnrich || enrichSelected.size === 0}
                  >
                    {t.enrichTab.enrichSelected} ({enrichSelected.size})
                  </Button>
                ),
              }}
              pagination={{
                page: enrichPagination.page,
                pageSize: enrichPagination.limit,
                total: enrichPagination.total,
                onPageChange: (page) => loadEnrichLeads(undefined, { page }),
              }}
            />
          </div>
        )}
      </div>

      {/* Parked at the bottom of every state of this page, including the
          empty one — the primary action of the screen should not be reachable
          only from inside an empty state that disappears the moment one lead
          arrives. */}
      <Dock
        label={t.dock.label}
        icon={<Search size={16} />}
        badge={
          searches.length > 0 ? (
            <Tag tone="accent">
              {searches.length} {t.dock.saved}
            </Tag>
          ) : null
        }
        disabled={needsAccount}
      >
        <AudienceList
          searches={searches}
          onRun={runSearch}
          onDelete={deleteSearch}
          busy={submitting}
        />

        <div
          className="flex items-center gap-3 px-[var(--ui-pad-lg)] border-y border-[var(--ui-border-hairline)] bg-[var(--ui-surface-sunken)]"
          style={{ height: "var(--ui-band)" }}
        >
          <span className="text-[var(--ui-t-section)] font-semibold">
            {t.dock.buildNew}
          </span>
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
