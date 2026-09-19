/**
 * Spurly's own icon set — the exact glyphs the Blue Identity handoff draws
 * (docs/design/screens/*.dc.html), so the product and the mockups agree
 * stroke for stroke.
 *
 * Same call shape as lucide-react (`size`, `strokeWidth`, `className`, any
 * aria-* prop), so a lucide icon and one of these are interchangeable at a
 * call site. 24-unit viewBox, currentColor, 1.8 stroke by default — the
 * handoff's weight.
 *
 * Only the glyphs the handoff actually draws live here. Anything it doesn't
 * (a trash can on a row action, a chevron inside a select) still comes from
 * lucide, which shares the same grid and stroke style.
 */

function makeIcon(displayName, children, { cap = 'round', join = 'round', fill = 'none' } = {}) {
  function Icon({ size = 16, strokeWidth = 1.8, className = '', ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke={fill === 'none' ? 'currentColor' : 'none'}
        strokeWidth={strokeWidth}
        strokeLinecap={cap}
        strokeLinejoin={join}
        className={className}
        aria-hidden={rest['aria-label'] ? undefined : 'true'}
        {...rest}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

/* ---- Navigation ------------------------------------------------------ */
export const HomeIcon = makeIcon('HomeIcon', <path d="M3 11l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />);
/** Leads — a signal radiating from a point. */
export const LeadsIcon = makeIcon('LeadsIcon', (
  <>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 5a7 7 0 0 1 7 7" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </>
));
/** Spurly acting: the four-point spark (+ a small one) — enrichment, AI. */
export const EnrichIcon = makeIcon('EnrichIcon', (
  <>
    <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </>
));
export const SparkIcon = makeIcon('SparkIcon', (
  <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
));
export const CampaignIcon = makeIcon('CampaignIcon', (
  <>
    <path d="M21 3L3 10.5l7 2.5 2.5 7z" />
    <path d="M21 3l-11 10" />
  </>
));
export const SendIcon = makeIcon('SendIcon', <path d="M21 3L3 10.5l7 2.5 2.5 7z" />);
export const SequenceIcon = makeIcon('SequenceIcon', (
  <>
    <rect x="3" y="3" width="6" height="6" rx="1.5" />
    <rect x="15" y="15" width="6" height="6" rx="1.5" />
    <path d="M6 9v4a2 2 0 0 0 2 2h7" />
  </>
));
export const InboxIcon = makeIcon('InboxIcon', (
  <>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M4 13l2.5-8h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
  </>
));
export const TemplateIcon = makeIcon('TemplateIcon', (
  <>
    <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
    <path d="M14 3v4h4" />
  </>
));
export const SettingsIcon = makeIcon('SettingsIcon', (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </>
));
/** LinkedIn, drawn as a line glyph so it sits with the rest of the rail. */
export const LinkedInLineIcon = makeIcon('LinkedInLineIcon', (
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7.5 10.5v6" />
    <path d="M7.5 7.6v.1" />
    <path d="M11.5 16.5v-6" />
    <path d="M11.5 13.2a2.7 2.7 0 0 1 5 1.2v2.1" />
  </>
));
export const ImportIcon = makeIcon('ImportIcon', (
  <>
    <path d="M12 15V4" />
    <path d="M8 8l4-4 4 4" />
    <path d="M4 16v3h16v-3" />
  </>
));
export const DownloadIcon = makeIcon('DownloadIcon', (
  <>
    <path d="M12 4v11" />
    <path d="M8 11l4 4 4-4" />
    <path d="M4 18v2h16v-2" />
  </>
));
export const ShieldIcon = makeIcon('ShieldIcon', <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />);
export const SidebarIcon = makeIcon('SidebarIcon', (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </>
));

/* ---- Actions + chrome ----------------------------------------------- */
export const BellIcon = makeIcon('BellIcon', (
  <>
    <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" />
    <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
  </>
));
export const PlusIcon = makeIcon('PlusIcon', (
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
));
export const SearchIcon = makeIcon('SearchIcon', (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.2-3.2" />
  </>
));
export const CloseIcon = makeIcon('CloseIcon', (
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </>
));
export const CheckIcon = makeIcon('CheckIcon', <path d="M4 12.5l5.2 5.2L20 6.8" />);
export const MoreIcon = makeIcon(
  'MoreIcon',
  (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
  { fill: 'currentColor' },
);
export const ChevronDownIcon = makeIcon('ChevronDownIcon', <path d="M6 9l6 6 6-6" />);
export const ChevronUpIcon = makeIcon('ChevronUpIcon', <path d="M6 15l6-6 6 6" />);
export const ChevronLeftIcon = makeIcon('ChevronLeftIcon', <path d="M14 6l-6 6 6 6" />);
export const ChevronRightIcon = makeIcon('ChevronRightIcon', <path d="M10 6l6 6-6 6" />);
export const ChevronsUpDownIcon = makeIcon('ChevronsUpDownIcon', (
  <>
    <path d="M8 9l4-4 4 4" />
    <path d="M16 15l-4 4-4-4" />
  </>
));
export const ArrowLeftIcon = makeIcon('ArrowLeftIcon', (
  <>
    <path d="M19 12H6" />
    <path d="M11 6l-6 6 6 6" />
  </>
));
export const ArrowRightIcon = makeIcon('ArrowRightIcon', (
  <>
    <path d="M5 12h13" />
    <path d="M13 6l6 6-6 6" />
  </>
));
export const ClockIcon = makeIcon('ClockIcon', (
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.4l2.8 1.8" />
  </>
));
export const CheckCircleIcon = makeIcon('CheckCircleIcon', (
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M9 12l2 2 4-4" />
  </>
));
export const BranchIcon = makeIcon('BranchIcon', (
  <>
    <path d="M6 4v6a3 3 0 0 0 3 3h9" />
    <path d="M15 10l3 3-3 3" />
    <path d="M6 13v7" />
  </>
));
export const MessageIcon = makeIcon('MessageIcon', <path d="M4 5h16v11H9l-5 4z" />);
export const TrashIcon = makeIcon('TrashIcon', (
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6 7l1 13h10l1-13" />
  </>
));
export const SlidersIcon = makeIcon('SlidersIcon', (
  <>
    <path d="M4 7h8" />
    <path d="M16 7h4" />
    <circle cx="14" cy="7" r="2" />
    <path d="M4 17h4" />
    <path d="M12 17h8" />
    <circle cx="10" cy="17" r="2" />
  </>
));
export const LinkIcon = makeIcon('LinkIcon', (
  <>
    <path d="M10 13a4 4 0 0 0 6 .5l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 6.6" />
    <path d="M14 11a4 4 0 0 0-6-.5L5.5 13a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </>
));
export const ExternalIcon = makeIcon('ExternalIcon', (
  <>
    <path d="M14 5h5v5" />
    <path d="M19 5l-8 8" />
    <path d="M18 14v5H5V6h5" />
  </>
));
export const LockIcon = makeIcon('LockIcon', (
  <>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>
));
export const LogOutIcon = makeIcon('LogOutIcon', (
  <>
    <path d="M10 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    <path d="M15 16l4-4-4-4" />
    <path d="M19 12H9" />
  </>
));
