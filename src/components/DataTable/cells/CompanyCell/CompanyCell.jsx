import { Avatar } from 'src/ui/primitives';
import { resolveDensity } from 'src/ui/tokens';
import { useCompanyLogo, companyLogoUrl } from 'src/common/utils/companyLogo';

/**
 * Company name with its logo.
 *
 * The logo is looked up here rather than passed in, so every table with a
 * company column gets logos without knowing anything about them — see
 * common/utils/companyLogo.js for why. An explicit `logo` prop still wins,
 * for callers that already hold a URL.
 *
 * Failure is invisible by design. Unresolvable company, missing token, dead
 * CDN, 404 from logo.dev — all of them land on Avatar's tinted initial, which
 * is what this cell drew before logos existed and is a perfectly good cell.
 */
export function CompanyCell({ value, logo = null, density = 'default' }) {
  const domain = useCompanyLogo(value);
  const d = resolveDensity(density);

  if (!value) return <span className="text-[var(--ui-text-tertiary)]">—</span>;

  const src = logo || companyLogoUrl(domain, 64) || null;

  return (
    <span className="flex items-center gap-2 min-w-0">
      <Avatar src={src} name={value} size={d.avatar - 3} shape="square" />
      <span className="truncate text-[var(--ui-text-secondary)]">{value}</span>
    </span>
  );
}
