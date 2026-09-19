import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DashboardLayout } from "src/core/layout/DashboardLayout";
import { DataTable } from "src/core/DataTable";
import { Button, Dropdown, PageTabs, SoonTag, WorkingLine } from "src/core/primitives";
import {
  PlusIcon,
  SendIcon,
  MessageIcon,
  SparkIcon,
  LeadsIcon,
  EnrichIcon,
  LinkedInLineIcon,
} from "src/core/icons";
import { useAuth } from "src/core/auth/hooks/useAuth.js";
import { useLeadsPage } from "src/products/leads/hooks/useLeadsPage.js";
import { isBusy } from "src/products/leads/hooks/audience.js";
import { hubLeadColumns, hubLeadEnrichColumns } from "./components/columns.jsx";
import { LeadDrawer } from "./components/LeadDrawer.jsx";
import { NewAudienceModal } from "./components/NewAudienceModal.jsx";
import { AudiencePicker } from "./components/AudiencePicker.jsx";
import { leadsStrings as t } from "./strings.js";

const WORKING_VERBS = ["Sourcing", "Paging", "Reading", "Reconciling"];
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

  const { user } = useAuth();
  const location = useLocation();
  const [audienceOpen, setAudienceOpen] = useState(false);

  /* Arriving from Enrichment's "Enrich leads" lands on the Needs enrichment
     tab. Read once, on arrival. */
  const arrivalTab = location.state?.tab;
  const arrivalNewAudience = Boolean(location.state?.newAudience);
  useEffect(() => {
    if (arrivalTab === "enrich") setActiveTab("enrich"); // eslint-disable-line react-hooks/set-state-in-effect
    if (arrivalNewAudience) setAudienceOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [arrivalTab, arrivalNewAudience, setActiveTab]);
  const closeAudience = useCallback(() => setAudienceOpen(false), []);

  const tabs = [
    { id: "all", label: t.tabs.all },
    { id: "enrich", label: t.tabs.enrich, count: enrichPagination.total },
  ];

  const running = searches.filter(isBusy);
  const importedSoFar = running.reduce((sum, s) => sum + (s.importedCount ?? 0), 0);
  const workingLine =
    activeTab === "all" && running.length > 0 ? (
      <WorkingLine variant="band" verbs={WORKING_VERBS} trailing={`${importedSoFar.toLocaleString()} so far`}>
        {running.length === 1 ? running[0].name || "an audience" : `${running.length} audiences`}
        {" · imports run in the background, you can leave the page"}
      </WorkingLine>
    ) : null;

  const connectBanner = needsAccount ? (
    <div className="flex items-start gap-3 px-[var(--ui-card-x)] py-3 bg-[var(--ui-warning-tint)] border-b border-[var(--ui-warning-border)] shadow-[inset_2px_0_0_var(--ui-warning-dot)]">
      <LinkedInLineIcon size={16} className="mt-0.5 shrink-0 text-[var(--ui-warning-fg)]" />
      <div className="min-w-0">
        <p className="text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-primary)]">{t.connectLinkedIn.title}</p>
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mt-0.5">{t.connectLinkedIn.hint}</p>
      </div>
      <Link
        to="/dashboard/settings/linkedin"
        className="ml-auto shrink-0 self-center text-[length:var(--ui-t-label)] font-medium text-[var(--ui-accent-fg)] hover:underline"
      >
        {t.connectLinkedIn.cta}
      </Link>
    </div>
  ) : null;

  /* "+ Filter" — the handoff's status / fit filter popover. Lead-status and
     fit filters need server-side support that isn't built yet, so the
     control is shown in its place, marked SOON. */
  const filterChip = (
    <span
      className="inline-flex items-center gap-1.5 h-[var(--ui-ctl-h)] px-2.5 rounded-[var(--ui-radius-sm)] border border-dashed border-[var(--ui-border-strong)] text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] whitespace-nowrap cursor-not-allowed shrink-0"
      title="Status and fit filters are coming soon"
    >
      <PlusIcon size={12} strokeWidth={2} />
      Filter
      <SoonTag />
    </span>
  );

  const picker = (
    <AudiencePicker
      searches={searches}
      activeSearchId={activeSearchId}
      onChange={setActiveSearchId}
      onRun={runSearch}
      onDelete={deleteSearch}
      label={t.table.listFilterLabel}
    />
  );

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={
        <Button
          variant="primary"
          leadingIcon={<PlusIcon size={14} strokeWidth={2} />}
          onClick={() => setAudienceOpen(true)}
          disabled={needsAccount}
        >
          {t.newAudience}
        </Button>
      }
      tabs={<PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      {connectBanner}

      {activeTab === "all" && (
        <DataTable
          className="flex-1"
          columns={hubLeadColumns}
          data={leads}
          loading={loading}
          banner={workingLine}
          emptyMessage={activeSearchId ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
          emptyHint={searches.length === 0 ? t.table.emptyHintNoAudience : t.table.emptyHintImporting}
          emptyIcon={<LeadsIcon size={22} strokeWidth={1.6} />}
          emptyAction={
            <Button variant="primary" onClick={() => setAudienceOpen(true)} disabled={needsAccount}>
              {t.newAudience}
            </Button>
          }
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRowClick={setSelectedLead}
          toolbar={{
            searchValue: query,
            onSearch: setQuery,
            searchPlaceholder: t.table.searchPlaceholder,
            chips: filterChip,
            filters: picker,
            bulkActions: (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  leadingIcon={<SendIcon size={13} strokeWidth={1.9} />}
                  onClick={createCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0}
                >
                  {t.table.createCampaign}
                </Button>
                {/* A message campaign may only ever be ALL 1st-degree
                    connections — the server rejects a mixed selection
                    (NOT_ALL_FIRST_DEGREE), so the button says so up front. */}
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon={<MessageIcon size={13} />}
                  onClick={createMessageCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0 || !selectedAreAllFirstDegree}
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
                  variant="accentOutline"
                  leadingIcon={<SparkIcon size={13} strokeWidth={1.9} />}
                  disabled
                  title="AI-drafted openers are coming soon"
                >
                  {t.table.draftOpeners}
                  <SoonTag className="ml-1" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={createEnrichmentCampaign}
                  loading={creatingEnrichment}
                  disabled={creatingEnrichment || selected.size === 0}
                >
                  {t.table.createEnrichmentCampaign}
                </Button>
                <div className="flex-1 min-w-1" />
                <Dropdown
                  variant="dashboard"
                  size="sm"
                  value=""
                  onChange={(val) => enrollInSequence(val)}
                  disabled={enrolling || selected.size === 0 || sequences.length === 0}
                  ariaLabel="Enroll selection in a sequence"
                  title={sequences.length === 0 ? t.table.enrollTitleDisabled : t.table.enrollTitleEnabled}
                  placeholder={enrolling ? t.table.enrolling : t.table.enrollPlaceholder}
                  options={sequences.map((s) => [s._id, s.name])}
                />
              </>
            ),
          }}
          pagination={{
            page: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onPageChange: (page) => loadLeads({ page }),
          }}
        />
      )}

      {/* "Needs enrichment" — the same table, server-filtered
          (enrichmentStatus !== 'enriched'), with one bulk action. Selection
          is its own Set so it never bleeds into "All leads". */}
      {activeTab === "enrich" && (
        <DataTable
          className="flex-1"
          columns={hubLeadEnrichColumns}
          data={enrichLeads}
          loading={enrichLoading}
          emptyMessage={t.enrichTab.emptyMessage}
          emptyHint={t.enrichTab.emptyHint}
          emptyIcon={<EnrichIcon size={22} strokeWidth={1.6} />}
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
                leadingIcon={<SparkIcon size={13} strokeWidth={1.9} />}
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
            onPageChange: (page) => loadEnrichLeads({ page }),
          }}
        />
      )}

      <NewAudienceModal
        open={audienceOpen}
        onClose={closeAudience}
        onSubmit={createAudience}
        submitting={submitting}
        creditBalance={user?.creditBalance ?? 0}
      />

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
