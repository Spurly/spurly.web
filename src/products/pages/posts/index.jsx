import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, Skeleton, WorkingLine } from 'src/core/primitives';
import { PageTabs } from 'src/core/primitives/PageTabs';
import { usePostsPage } from 'src/products/posts/hooks/usePostsPage.js';
import { Composer } from './components/Composer.jsx';
import { OwnPosts } from './components/OwnPosts.jsx';
import { RulePanel } from './components/RulePanel.jsx';

const TABS = [{ id: 'posts', label: 'Your posts' }, { id: 'rule', label: 'Auto-like' }];
const notice = 'rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4';

function UsageLine({ usage }) {
  const p = usage.create_post;
  if (!p) return null;
  return <p className="text-[var(--ui-text-secondary)]">Posted in the last 24 h: {p.usedDay} of {p.dailyCap}</p>;
}

/**
 * Posts: write and publish (now, scheduled, or with one image/video), see what
 * you have posted with its comments and reactions, and the bulk like rule. Only
 * posts made through Spurly are listed.
 */
export function HubPostsPage() {
  const navigate = useNavigate();
  const { tab, openTab, own, usage, needsAccount, publishing, composerKey, rule, cancelling, publish, publishMedia, cancel, saveRule, refresh } = usePostsPage();

  return (
    <DashboardLayout
      title="Posts"
      subtitle="Publish to LinkedIn, schedule ahead, and see who reacted."
      layout="page"
      actions={tab === 'posts' ? <Button variant="primary" onClick={refresh} disabled={needsAccount}>Refresh</Button> : null}
    >
      <div className="flex flex-col gap-4">
        {needsAccount && (
          <div className={`${notice} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-medium">Connect your LinkedIn account first</p>
              <p className="text-[var(--ui-text-secondary)]">Posts are published through your LinkedIn account, so it needs a working connection.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/dashboard/settings/linkedin')}>Open LinkedIn settings</Button>
          </div>
        )}

        <PageTabs tabs={TABS} activeTab={tab} onTabChange={openTab} />

        {tab === 'posts' && !needsAccount && (
          <div className="flex flex-col gap-4 max-w-[760px]">
            <UsageLine usage={usage} />
            <Composer key={composerKey} publishing={publishing} onPublish={publish} onPublishMedia={publishMedia} />
            {own.failed && <p role="alert" className="text-[var(--ui-text-secondary)]">Could not load your posts. Try Refresh.</p>}
            {own.loading && own.posts.length === 0 && <WorkingLine verbs={['Loading']}>Loading your posts</WorkingLine>}
            {!own.loading && <OwnPosts posts={own.posts} cancelling={cancelling} onCancel={cancel} />}
          </div>
        )}

        {tab === 'rule' && (
          rule.loading && !rule.loaded
            ? <div className="flex flex-col gap-2 max-w-[640px]"><Skeleton width="60%" height={14} /><Skeleton width="80%" height={90} /></div>
            : <RulePanel key={rule.loaded ? 'loaded' : 'default'} rule={rule.data} audiences={rule.audiences} saving={rule.saving} onSave={saveRule} />
        )}
      </div>
    </DashboardLayout>
  );
}

export default HubPostsPage;
