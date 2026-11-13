import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "src/core/layout/DashboardLayout";
import { DataTable } from "src/core/DataTable";
import { Button, Dropdown, ExportMenu, PageTabs, SoonTag, WorkingLine } from "src/core/primitives";
import { LEAD_PAGE_SIZES, countLeadFilters } from "src/products/leads/constants/constants.js";
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
import { SendingAsChip } from "src/core/org/components/SendingAsChip.jsx";
import { useSendingAs } from "src/core/org/hooks/useSendingAs.js";
import { useLeadsPage } from "src/products/leads/hooks/useLeadsPage.js";
import { campaignsStrings } from "./../campaigns/strings.js";
import { getKnownAccounts, setActiveAccountId } from "src/shared/orgAccount/activeAccount.js";
import { useActiveAccount } from "src/core/org/hooks/useActiveAccount.js";
import { useAllAccountsView } from "src/core/org/hooks/useAllAccountsView.js";
import { isBusy } from "src/products/leads/hooks/audience.js";
import { ArrowUpRight, PanelRight } from "lucide-react";
import { hubLeadColumns, hubLeadColumnsForAllAccounts, hubLeadEnrichColumns, leadRowTone } from "./components/columns.jsx";
import { LeadDrawer } from "./components/LeadDrawer.jsx";
import { NewAudienceModal } from "./components/NewAudienceModal.jsx";
import { AudiencePicker } from "./components/AudiencePicker.jsx";
import { DegreeFilter } from "./components/DegreeFilter.jsx";
import { ActivityFilter } from "./components/ActivityFilter.jsx";
import { CompanyFilter } from './components/CompanyFilter.jsx';
import { LeadFilterMenu } from './components/LeadFilterMenu.jsx';
import { DuplicateSearchDialog, FetchMoreDialog, NewListDialog } from "./components/SourcingDialogs.jsx";
import { leadsStrings as t } from "./strings.js";

const WORKING_VERBS = ["Sourcing", "Paging", "Reading", "Reconciling"];
/** Sentinel option in the "Add to list" dropdown — never a real audience id. */
const NEW_LIST = "__new_list__";
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
/** Hover quick actions on a lead row: open the drawer, or jump to LinkedIn. */
function makeRowActions(openLead) {
  return (row) => [
    { key: "open", label: "Open", icon: <PanelRight size={13} strokeWidth={2} />, onClick: () => openLead(row) },
    ...(row.profileUrl
      ? [{ key: "linkedin", label: "LinkedIn", icon: <ArrowUpRight size={13} strokeWidth={2} />, href: row.profileUrl }]
      : []),
  ];
}

export function HubLeadsPage() {
  const {
    searches,
    leads,
    pagination,
    activeSearchId,
    setActiveSearchId,
    query,
    setQuery,
    connectionDegree,
    setConnectionDegree,
    activityType,
    setActivityType,
    companies,
    setCompanies,
    leadFilters,
    setLeadFilters,
    loading,
    exporting,
    exportLeads,
    pageSize,
    setPageSize,
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
    usage,
    companyPages,
    duplicate,
    resolveDuplicate,
    fetchMoreTarget,
    setFetchMoreTarget,
    fetchingMore,
    savingList,
    createList,
    addToAudience,
    removeFromActiveAudience,
    activeSearch,
    deleteSearch,
    createCampaign,
    createMessageCampaign,
    createPoolCampaign,
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
  const sending = useSendingAs();
  // An organization with several accounts creates the campaign at once for ALL of them; which accounts actually send is
  // chosen when it is started, and who each account can reach is decided while it runs.
  const knownAccountIds = getKnownAccounts().accounts.map((a) => String(a.id));
  const canPool = sending.isOrg && knownAccountIds.length >= 2;
  // D52: a send/enrol/create action runs through one account; with none in effect they wait (reason shown).
  const sendBlocked = sending.needsPick;
  const sendBlockedReason = sendBlocked ? "Pick an account in 'Acting as' first." : undefined;
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAccountId] = useActiveAccount();
  const [allView, setAllView] = useAllAccountsView();
  const knownAccounts = getKnownAccounts().accounts;
  const activeName = knownAccounts.find((a) => String(a.id) === String(activeAccountId));
  // Every account's leads at once: the single Degree column and filter do not apply, "Found by" does.
  const leadColumns = allView ? hubLeadColumnsForAllAccounts(knownAccounts) : hubLeadColumns;
  // Acting as an account that has found nothing yet looks like an empty app: say so, and offer the way out.
  const hasFilters = Boolean(activeSearchId || query || (companies && companies.length) || (connectionDegree && connectionDegree.length) || activityType || countLeadFilters(leadFilters) > 0);
  const showAllHint = !allView && !loading && leads.length === 0 && !hasFilters && knownAccounts.length >= 2 && sending.isOrg;
  const [searchParams, setSearchParams] = useSearchParams();
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);
  // Bumped per open so the dialog's own name field starts empty every time.
  const [newListKey, setNewListKey] = useState(0);
  const openNewList = useCallback(() => {
    setNewListKey((k) => k + 1);
    setNewListOpen(true);
  }, []);

  /* Arriving from Enrichment's "Enrich leads" lands on the Needs enrichment
     tab. Read once, on arrival. */
  const arrivalTab = location.state?.tab;
  const arrivalNewAudience = Boolean(location.state?.newAudience);
  /* Arriving from Discover's "Find people here": the dialog opens on the
     filters source with that company already chosen. Cleared on close so a
     later manual open starts clean. */
  const arrivalCompanyId = location.state?.newAudienceCompany?.id;
  const arrivalCompanyName = location.state?.newAudienceCompany?.name;
  const [audiencePrefill, setAudiencePrefill] = useState(null);
  useEffect(() => {
    if (arrivalTab === "enrich") setActiveTab("enrich"); // eslint-disable-line react-hooks/set-state-in-effect
    if (arrivalNewAudience) setAudienceOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
    if (arrivalNewAudience && arrivalCompanyId) {
      setAudiencePrefill({ company: { id: String(arrivalCompanyId), title: arrivalCompanyName || "Company" } });
    }
  }, [arrivalTab, arrivalNewAudience, arrivalCompanyId, arrivalCompanyName, setActiveTab]);
  const closeAudience = () => {
    setAudienceOpen(false);
    setAudiencePrefill(null);
    // Arrived through a one-shot "open the dialog" state: drop it so a re-mount (another account) does not reopen it.
    if (location.state?.newAudience) navigate(location.pathname + location.search, { replace: true, state: null });
  };

  // Fetching goes through ONE account. Changing it here re-points the page to that account and reopens this dialog.
  const changeFetchAccount = (id) => {
    setActiveAccountId(id);
    navigate(location.pathname + location.search, { replace: true, state: { newAudience: true } });
  };

  /* Arriving from a notification's "?lead=<id>" deep link (connection
     accepted, enrichment finished) — open that lead's drawer straight away.
     A minimal stub ({ _id } only) is enough: LeadDrawer always resolves the
     full profile on open regardless of what it's handed (see its own
     comment on "ALWAYS fetches on open now"), so there's no extra fetch to
     do here before showing it. The param is stripped right after so a
     refresh, or picking a different row, doesn't reopen it. */
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (!leadId) return;
    setSelectedLead({ _id: leadId });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("lead");
        return next;
      },
      { replace: true },
    );
    // Deliberately only depends on the param's presence, not on
    // setSelectedLead/setSearchParams identity — this should fire once per
    // distinct ?lead= value landed on, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("lead")]);

  const tabs = [
    { id: "all", label: t.tabs.all },
    { id: "enrich", label: t.tabs.enrich, count: enrichPagination.total },
  ];

  const running = searches.filter(isBusy);
  // A fetch with a target reports NEW people found against what was asked
  // for; a legacy row (no target) still reports results read.
  const importedSoFar = running.reduce((sum, s) => sum + (s.fetchTarget ? s.fetchNew ?? 0 : s.importedCount ?? 0), 0);
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

  const picker = (
    <>
      <LeadFilterMenu value={leadFilters} onChange={setLeadFilters} />
      {!allView && <DegreeFilter value={connectionDegree} onChange={setConnectionDegree} />}
      <ActivityFilter value={activityType} onChange={setActivityType} />
      <CompanyFilter value={companies} onChange={setCompanies} searchId={activeSearchId} />
      <AudiencePicker
        searches={searches}
        activeSearchId={activeSearchId}
        onChange={setActiveSearchId}
        onRun={setFetchMoreTarget}
        onDelete={deleteSearch}
        label={t.table.listFilterLabel}
      />
    </>
  );

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={
        <>
          {activeTab === "all" && (
            <ExportMenu
              loading={exporting}
              disabled={loading || leads.length === 0}
              title={t.exportHint}
              items={[
                { key: "page", label: t.exportPage, hint: t.exportPageHint(leads.length), onSelect: () => exportLeads("page") },
                { key: "all", label: t.exportAll, hint: t.exportAllHint(pagination.total), onSelect: () => exportLeads("all"), disabled: !pagination.total },
              ]}
            />
          )}
          <Button
            variant="primary"
            leadingIcon={<PlusIcon size={14} strokeWidth={2} />}
            onClick={() => setAudienceOpen(true)}
            disabled={needsAccount}
          >
            {t.newAudience}
          </Button>
        </>
      }
      tabs={<PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      {connectBanner}

      {activeTab === "all" && (
        <DataTable
          className="flex-1"
          columns={leadColumns}
          data={leads}
          loading={loading}
          banner={workingLine}
          emptyMessage={showAllHint ? t.table.emptyForAccount(activeName?.name || activeName?.publicIdentifier || "this account") : activeSearchId ? t.table.emptyMessageFiltered : t.table.emptyMessageAll}
          emptyHint={showAllHint ? t.table.emptyForAccountHint : searches.length === 0 ? t.table.emptyHintNoAudience : t.table.emptyHintImporting}
          emptyIcon={<LeadsIcon size={22} strokeWidth={1.6} />}
          emptyAction={
            <div className="flex items-center gap-2">
              {showAllHint && (
                <Button variant="secondary" onClick={() => setAllView(true)}>
                  {t.table.viewAllAccounts}
                </Button>
              )}
              <Button variant="primary" onClick={() => setAudienceOpen(true)} disabled={needsAccount}>
                {t.newAudience}
              </Button>
            </div>
          }
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRowClick={setSelectedLead}
          rowTone={leadRowTone}
          rowActions={makeRowActions(setSelectedLead)}
          toolbar={{
            searchValue: query,
            onSearch: setQuery,
            searchPlaceholder: t.table.searchPlaceholder,
            filters: picker,
            bulkActions: (
              <>
                <SendingAsChip />
                <Button
                  size="sm"
                  variant="primary"
                  leadingIcon={<SendIcon size={13} strokeWidth={1.9} />}
                  onClick={canPool ? () => createPoolCampaign({ accountIds: knownAccountIds, type: 'connect' }) : createCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0 || (sendBlocked && !canPool)}
                  title={canPool ? undefined : sendBlockedReason}
                >
                  {t.table.createCampaign}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon={<MessageIcon size={13} />}
                  onClick={canPool ? () => createPoolCampaign({ accountIds: knownAccountIds, type: 'message' }) : createMessageCampaign}
                  loading={creating}
                  disabled={creating || selected.size === 0 || (!canPool && (!selectedAreAllFirstDegree || sendBlocked))}
                  title={
                    canPool
                      ? undefined
                      : sendBlocked
                      ? sendBlockedReason
                      : selected.size > 0 && !selectedAreAllFirstDegree
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
                {activeSearch && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={removeFromActiveAudience}
                    loading={savingList}
                    disabled={savingList || selected.size === 0}
                    title={`Take the selection out of “${activeSearch.name || t.untitledAudience}”. They stay in All leads.`}
                  >
                    {t.table.removeFromList}
                  </Button>
                )}
                <Dropdown
                  variant="dashboard"
                  size="sm"
                  dividerAfterFirst
                  value=""
                  onChange={(val) => (val === NEW_LIST ? openNewList() : addToAudience(val))}
                  disabled={savingList || selected.size === 0}
                  ariaLabel="Add selection to a list"
                  title="Add the selection to a new or existing list"
                  placeholder={savingList ? t.table.addingToList : t.table.addToList}
                  options={[
                    [NEW_LIST, t.table.newList],
                    ...searches
                      .filter((s) => s._id !== activeSearchId)
                      .map((s) => [s._id, s.name || t.untitledAudience]),
                  ]}
                />
                <Dropdown
                  variant="dashboard"
                  size="sm"
                  value=""
                  onChange={(val) => enrollInSequence(val)}
                  disabled={enrolling || selected.size === 0 || sequences.length === 0 || sendBlocked}
                  ariaLabel="Enroll selection in a sequence"
                  title={sendBlocked ? sendBlockedReason : sequences.length === 0 ? t.table.enrollTitleDisabled : t.table.enrollTitleEnabled}
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
            onPageSizeChange: setPageSize,
            pageSizeOptions: LEAD_PAGE_SIZES,
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
          rowTone={leadRowTone}
          rowActions={makeRowActions(setSelectedLead)}
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
        usage={usage}
        companyPages={companyPages}
        prefill={audiencePrefill}
        accounts={sending.isOrg ? knownAccounts : []}
        accountId={activeAccountId}
        onAccountChange={changeFetchAccount}
      />

      <DuplicateSearchDialog duplicate={duplicate} onChoose={resolveDuplicate} submitting={submitting} />

      <FetchMoreDialog
        key={fetchMoreTarget?._id ?? "none"}
        audience={fetchMoreTarget}
        usage={usage}
        onSubmit={runSearch}
        onClose={() => setFetchMoreTarget(null)}
        submitting={fetchingMore}
      />

      <NewListDialog
        key={newListKey}
        open={newListOpen}
        count={selected.size}
        submitting={savingList}
        onClose={() => setNewListOpen(false)}
        onSubmit={(name) => {
          createList(name);
          setNewListOpen(false);
        }}
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
