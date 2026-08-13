import { useState } from 'react';
import { Plus, Trash2, Search, Linkedin } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Badge,
  Avatar,
  Checkbox,
  Tooltip,
  Tabs,
  Skeleton,
  EmptyState,
  Dialog,
  Drawer,
  useToast,
} from 'src/ui/primitives';
import { DataTable, TextCell, PersonCell, LinkCell } from 'src/components/DataTable';

/**
 * Every primitive, in every state, on one page.
 *
 * This exists because "does the design system still work" is otherwise only
 * answerable by clicking through 31 surfaces. Here it's one scroll. It is the
 * cheapest regression check available and it covers the states that never get
 * exercised in normal use — empty, loading, error, overflowing content,
 * stacked overlays.
 *
 * Dev-only: the route is registered behind `import.meta.env.DEV`, so it never
 * reaches production.
 */

function Row({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <span className="w-40 shrink-0 text-[12px] text-[var(--ui-text-tertiary)] pt-1.5">{label}</span>
      <div className="flex items-center gap-2 flex-wrap min-w-0">{children}</div>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-[13px] font-medium text-[var(--ui-text-primary)] mb-1">{title}</h2>
      <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-4 py-1">
        {children}
      </div>
    </section>
  );
}

const LONG =
  'Helping tech talent in the UK to unlock their full potential by connecting them with opportunities that sparkle innovation and growth. #TalentSpecialist #TechRecruiter';

const SAMPLE_ROWS = [
  { _id: '1', name: 'Pranay Singh Shekhawat', title: LONG, company: 'Solvex Solutions', url: 'https://linkedin.com' },
  { _id: '2', name: 'Di', title: 'Recruiter', company: '', url: '' },
  { _id: '3', name: 'Charlotte Jeffrey', title: 'Yes, we are hiring', company: 'Sofia Tech', url: 'https://linkedin.com' },
];

const SAMPLE_COLUMNS = [
  { key: 'url', label: <Linkedin size={14} />, width: 44, align: 'center', render: (v) => <LinkCell href={v} icon={<Linkedin size={14} />} label="Open" /> },
  { key: 'name', label: 'Name', width: 200, sortable: true, render: (v, r) => <PersonCell name={v} avatar={r.avatar} /> },
  { key: 'title', label: 'Title', width: 240, sortable: true, render: (v) => <TextCell value={v} tone="secondary" /> },
  { key: 'company', label: 'Company', width: 160, render: (v) => <TextCell value={v} tone="secondary" /> },
];

export function UiPreview() {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(new Set());

  return (
    <div className="min-h-screen bg-[var(--ui-surface-page)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[18px] font-medium text-[var(--ui-text-primary)] mb-1">UI preview</h1>
        <p className="text-[13px] text-[var(--ui-text-tertiary)] mb-8">
          Every primitive in every state. Dev only.
        </p>

        <Group title="Button">
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="accentSoft">Accent soft</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="dangerSoft">Danger soft</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row label="With icons">
            <Button leadingIcon={<Plus size={14} />}>Leading</Button>
            <Button trailingIcon={<Plus size={14} />}>Trailing</Button>
            <Button variant="primary" leadingIcon={<Plus size={14} />}>Both sides</Button>
          </Row>
          <Row label="States">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="primary" loading>Saving</Button>
          </Row>
          <Row label="Icon only">
            <IconButton label="Add" icon={<Plus size={15} />} />
            <IconButton label="Delete" variant="secondary" icon={<Trash2 size={15} />} />
            <IconButton label="Small" size="sm" icon={<Plus size={14} />} />
          </Row>
        </Group>

        <Group title="Input">
          <Row label="Default">
            <Input placeholder="name@company.com" />
          </Row>
          <Row label="With icon">
            <Input placeholder="Search" leadingIcon={<Search size={14} />} />
          </Row>
          <Row label="States">
            <Input placeholder="Invalid" invalid defaultValue="not-an-email" />
            <Input placeholder="Disabled" disabled />
          </Row>
          <Row label="Sizes">
            <Input size="sm" placeholder="Small" />
            <Input size="md" placeholder="Medium" />
            <Input size="lg" placeholder="Large" />
          </Row>
        </Group>

        <Group title="Badge">
          <Row label="Tint">
            {['neutral', 'accent', 'success', 'warning', 'danger', 'info'].map((t) => (
              <Badge key={t} tone={t}>{t}</Badge>
            ))}
          </Row>
          <Row label="Minimal">
            {['neutral', 'accent', 'success', 'warning', 'danger', 'info'].map((t) => (
              <Badge key={t} variant="minimal" tone={t} dot>{t}</Badge>
            ))}
          </Row>
          <Row label="Solid">
            {['neutral', 'accent', 'success', 'warning', 'danger', 'info'].map((t) => (
              <Badge key={t} variant="solid" tone={t}>{t}</Badge>
            ))}
          </Row>
          <Row label="Pulsing (in flight)">
            <Badge variant="minimal" tone="info" dot pulse>Enriching</Badge>
            <Badge variant="minimal" tone="warning" dot pulse>Sending</Badge>
            <Badge variant="minimal" tone="success" dot>Done — no pulse</Badge>
          </Row>
          <Row label="Legacy aliases">
            <Badge tone="primary">primary</Badge>
            <Badge tone="error">error</Badge>
            <Badge variant="default">default</Badge>
          </Row>
          <Row label="Overflowing">
            <span className="w-32 flex">
              <Badge tone="accent">A label far too long for its container</Badge>
            </span>
          </Row>
        </Group>

        <Group title="Avatar, Checkbox, Tabs, Tooltip">
          <Row label="Avatar — identity">
            {['Pranay Singh', 'Charlotte Jeffrey', 'Diana Pavel', 'Qurat-ul-Ain', 'Satendra Kumar', 'Irena Pavic', 'Onica Jones', 'Joe Griffin', 'Samantha Howe'].map((n) => (
              <Avatar key={n} name={n} size={28} />
            ))}
          </Row>
          <Row label="Avatar — other">
            <Avatar name="Pranay Singh" size={20} />
            <Avatar name="Pranay Singh" size={44} shape="square" />
            <Avatar name="Neutral" size={28} tone="neutral" />
            <Avatar name="Accent" size={28} tone="accent" />
            <Avatar src="https://invalid.example/x.png" name="Broken src" size={28} />
            <Avatar name="" size={28} />
          </Row>
          <Row label="Checkbox">
            <Checkbox checked={checked} onChange={() => setChecked(!checked)} label="Interactive" />
            <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
            <Checkbox checked onChange={() => {}} label="Checked" />
            <Checkbox indeterminate onChange={() => {}} label="Indeterminate" />
            <Checkbox disabled onChange={() => {}} label="Disabled" />
          </Row>
          <Row label="Tabs">
            <Tabs
              tabs={[
                { id: 'all', label: 'All', count: 428 },
                { id: '1', label: '1st', count: 38 },
                { id: '2', label: '2nd', count: 0 },
              ]}
              activeTab={tab}
              onTabChange={setTab}
            />
          </Row>
          <Row label="Tooltip (hover)">
            <Tooltip content="Top placement"><Button size="sm">Top</Button></Tooltip>
            <Tooltip content="Bottom placement" placement="bottom"><Button size="sm">Bottom</Button></Tooltip>
            <Tooltip content="Right placement" placement="right"><Button size="sm">Right</Button></Tooltip>
            <Tooltip content={LONG}><Button size="sm">Long text</Button></Tooltip>
          </Row>
        </Group>

        <Group title="Overlays">
          <Row label="Dialog">
            <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          </Row>
          <Row label="Drawer">
            <Button onClick={() => setDrawerOpen(true)}>Open drawer</Button>
          </Row>
          <Row label="Toast">
            <Button size="sm" onClick={() => toast.success('Campaign created')}>Success</Button>
            <Button size="sm" onClick={() => toast.error("Couldn't reach the extension", { description: 'Open Spurly in your browser and sign in.' })}>Error</Button>
            <Button size="sm" onClick={() => toast.info('12 of 15 moved', { action: { label: 'View the 3 that failed', onClick: () => {} } })}>With action</Button>
            <Button size="sm" onClick={() => { toast.success('One'); toast.info('Two'); toast.error('Three'); }}>Stacked</Button>
          </Row>
        </Group>

        <Group title="Feedback states">
          <Row label="Skeleton">
            <div className="flex flex-col gap-1.5 w-52">
              <Skeleton width="70%" />
              <Skeleton width="45%" />
              <Skeleton width="85%" />
            </div>
          </Row>
          <Row label="Empty state">
            <div className="w-full"><EmptyState compact title="No people captured yet" hint="People you capture from LinkedIn will appear here" action={<Button size="sm" variant="secondary">Install the extension</Button>} /></div>
          </Row>
        </Group>

        <Group title="DataTable">
          <Row label="With data">
            <div className="w-full h-56 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
              <DataTable
                columns={SAMPLE_COLUMNS}
                data={SAMPLE_ROWS}
                rowKey={(r) => r._id}
                selectable
                selectedKeys={selected}
                onSelectionChange={setSelected}
              />
            </div>
          </Row>
          <Row label="Loading">
            <div className="w-full h-40 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
              <DataTable columns={SAMPLE_COLUMNS} data={[]} loading />
            </div>
          </Row>
          <Row label="Empty">
            <div className="w-full h-40 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
              <DataTable columns={SAMPLE_COLUMNS} data={[]} emptyMessage="No people match your search" emptyHint="Try a different search term" />
            </div>
          </Row>
          <Row label="Error">
            <div className="w-full h-40 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
              <DataTable columns={SAMPLE_COLUMNS} data={[]} error="Couldn't load people. Check your connection and retry." />
            </div>
          </Row>
          <Row label="Compact density">
            <div className="w-full h-40 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
              <DataTable columns={SAMPLE_COLUMNS} data={SAMPLE_ROWS} rowKey={(r) => r._id} density="compact" />
            </div>
          </Row>
        </Group>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Delete campaign"
          description="This removes the campaign and its member list. Sends already made are kept in each person's history."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>Delete</Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Input placeholder="Type the campaign name to confirm" fullWidth />
            <Button variant="secondary" onClick={() => setNestedOpen(true)}>
              Open a second dialog (tests stacking)
            </Button>
            <p className="text-[12.5px] text-[var(--ui-text-tertiary)]">
              Escape should close only the topmost. Tab should never leave this panel.
            </p>
          </div>
        </Dialog>

        <Dialog
          open={nestedOpen}
          onClose={() => setNestedOpen(false)}
          size="sm"
          title="Second dialog"
          footer={<Button onClick={() => setNestedOpen(false)}>Close</Button>}
        >
          <p className="text-[13px] text-[var(--ui-text-secondary)]">
            Closing this should leave the first dialog open, and the page behind should still be
            scroll-locked.
          </p>
        </Dialog>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          eyebrow="Person"
          title="Pranay Singh Shekhawat"
          footer={<Button variant="secondary" onClick={() => setDrawerOpen(false)}>Close</Button>}
        >
          <div className="p-4 flex flex-col gap-3">
            <p className="text-[13px] text-[var(--ui-text-secondary)] leading-relaxed">{LONG}</p>
            <Input placeholder="Focus should start here or on the close button" fullWidth />
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i} className="text-[13px] text-[var(--ui-text-tertiary)]">
                Scroll row {i + 1} — the drawer body scrolls, the header and footer don't.
              </p>
            ))}
          </div>
        </Drawer>
      </div>
    </div>
  );
}
