import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button } from 'src/core/primitives';
import { formatCompactNumber } from 'src/shared/utils/formatCompactNumber.js';
import { companyPath, findPeopleState } from 'src/products/discover/format.js';
import { discoverStrings } from '../strings.js';

const t = discoverStrings.company;

const row = 'flex items-start gap-3 px-4 py-3.5 border-b border-[var(--ui-border)] last:border-b-0';

export function CompanyRow({ company, onOpen, onFindPeople }) {
  const isSchool = company.kind === 'school';
  const meta = [company.industry, company.location].filter(Boolean).join(' · ');
  return (
    <li className={row}>
      <Avatar src={company.logoUrl} name={company.name} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[var(--ui-text-primary)]">{company.name}</span>
          {isSchool && <Badge tone="neutral">{t.school}</Badge>}
          {company.followersCount > 0 && (
            <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">
              {t.followers(formatCompactNumber(company.followersCount))}
            </span>
          )}
        </div>
        {meta && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{meta}</p>}
        {company.summary && (
          <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] line-clamp-2 mt-0.5">{company.summary}</p>
        )}
        {isSchool && <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] mt-1">{t.schoolNote}</p>}
      </div>
      {!isSchool && (
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => onOpen(company)}>{t.openCompany}</Button>
          <Button size="sm" variant="primary" onClick={() => onFindPeople(company)}>{t.findPeople}</Button>
        </div>
      )}
    </li>
  );
}

/** Company search results. Schools come back in the same list; they are hidden until asked for. */
export function CompanyList({ companies }) {
  const navigate = useNavigate();
  const [showSchools, setShowSchools] = useState(false);
  const schoolCount = useMemo(() => companies.filter((c) => c.kind === 'school').length, [companies]);
  const shown = showSchools ? companies : companies.filter((c) => c.kind !== 'school');

  const open = (company) => {
    const path = companyPath(company);
    if (path) navigate(path);
  };
  const findPeople = (company) => navigate('/hub/leads', { state: findPeopleState(company) });

  return (
    <div>
      {schoolCount > 0 && (
        <div className="flex justify-end px-4 py-2 border-b border-[var(--ui-border)]">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSchools((v) => !v)}>
            {showSchools ? t.hideSchools : `${t.showSchools} (${schoolCount})`}
          </Button>
        </div>
      )}
      <ul>
        {shown.map((c) => (
          <CompanyRow key={c.companyId} company={c} onOpen={open} onFindPeople={findPeople} />
        ))}
      </ul>
    </div>
  );
}
