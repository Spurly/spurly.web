/* Inline SVG icons for the auth + onboarding pages. Stroke-based, inherit
   currentColor, sized via the `s` prop. Kept local so the auth pages have no
   external icon dependency. */

const base = (s = 20) => ({
  width: s,
  height: s,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const TargetIcon = ({ s }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></svg>
);
export const SendIcon = ({ s }) => (
  <svg {...base(s)}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>
);
export const ChartIcon = ({ s }) => (
  <svg {...base(s)}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></svg>
);
export const ShieldIcon = ({ s }) => (
  <svg {...base(s)}><path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3z" /><path d="m9.5 12 1.8 1.8L15 10" /></svg>
);
export const MailIcon = ({ s }) => (
  <svg {...base(s)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const LockIcon = ({ s }) => (
  <svg {...base(s)}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const UserIcon = ({ s }) => (
  <svg {...base(s)}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
);
export const BriefcaseIcon = ({ s }) => (
  <svg {...base(s)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></svg>
);
export const UsersIcon = ({ s }) => (
  <svg {...base(s)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" /><path d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" /></svg>
);
export const TrendIcon = ({ s }) => (
  <svg {...base(s)}><path d="M3 17 9 11l4 4 8-8" /><path d="M16 7h5v5" /></svg>
);
export const BuildingIcon = ({ s }) => (
  <svg {...base(s)}><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></svg>
);
export const GlobeIcon = ({ s }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></svg>
);
export const GiftIcon = ({ s }) => (
  <svg {...base(s)}><rect x="3" y="9" width="18" height="11" rx="1.5" /><path d="M3 13h18M12 9v11" /><path d="M12 9S10.5 5 8.5 5a2 2 0 0 0 0 4H12zM12 9s1.5-4 3.5-4a2 2 0 0 1 0 4H12z" /></svg>
);
export const StarIcon = ({ s }) => (
  <svg {...base(s)} fill="currentColor" stroke="none"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" /></svg>
);
export const CheckIcon = ({ s }) => (
  <svg {...base(s)}><path d="m20 6-11 11-5-5" /></svg>
);
export const CheckCircleIcon = ({ s }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
);
export const EyeIcon = ({ s }) => (
  <svg {...base(s)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = ({ s }) => (
  <svg {...base(s)}><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.1 6.1A17 17 0 0 0 2 13s3.5 7 10 7a10.8 10.8 0 0 0 4.9-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m2 2 20 20" /></svg>
);
export const ArrowRightIcon = ({ s }) => (
  <svg {...base(s)}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
export const ArrowLeftIcon = ({ s }) => (
  <svg {...base(s)}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></svg>
);
export const ChromeIcon = ({ s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="#fff" />
    <path fill="#4285F4" d="M24 16a8 8 0 0 1 6.9 4H40A20 20 0 0 0 6.3 14.7l4.6 8A8 8 0 0 1 24 16z" opacity="0" />
    <circle cx="24" cy="24" r="8" fill="#fff" />
    <circle cx="24" cy="24" r="6.4" fill="#1a73e8" />
    <path fill="#ea4335" d="M24 16h16A20 20 0 0 0 6.3 14.7l6.1 10.6A8 8 0 0 1 24 16z" />
    <path fill="#34a853" d="M30.9 20A8 8 0 0 1 24 32a8 8 0 0 1-6.9-4L9 41.4A20 20 0 0 0 41.6 28L40 20z" transform="translate(0 0)" />
    <path fill="#fbbc05" d="M17.1 28 9 14.7A20 20 0 0 0 9 41.4L17.1 28z" />
    <path fill="#34a853" d="M24 32a8 8 0 0 0 6.9-12H40a20 20 0 0 1-30.9 21.4L17.1 28A8 8 0 0 0 24 32z" />
  </svg>
);
export const GoogleIcon = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 38 46.5 31.8 46.5 24.5z" />
    <path fill="#FBBC05" d="M10.4 28.3a14.5 14.5 0 0 1 0-8.6l-7.8-6.1a24 24 0 0 0 0 20.8l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.3-7.7 2.3-6.4 0-11.7-3.8-13.6-9.7l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);
