import { useState } from 'react';
import { countryCodeFromLocation, countryNameFromCode, flagUrl } from 'src/shared/utils/location';

/**
 * Location with a country flag.
 *
 * Like TextCell it does NOT truncate — Cell owns that — but it needs its own
 * flex row so the flag sits outside the truncating text span, otherwise the
 * ellipsis eats the flag on narrow columns.
 *
 * The flag is decorative: the country is already spelled out in the text beside
 * it, so it carries an empty alt and the row stays readable if flagcdn is
 * unreachable. A load failure hides the image rather than leaving a broken-image
 * glyph in the middle of the table.
 */
export function LocationCell({ value, tone = 'secondary' }) {
  const [failed, setFailed] = useState(false);

  if (value === null || value === undefined || value === '') {
    return <span className="text-[var(--ui-text-tertiary)]">—</span>;
  }

  const tones = {
    primary: 'text-[var(--ui-text-primary)]',
    secondary: 'text-[var(--ui-text-secondary)]',
    tertiary: 'text-[var(--ui-text-tertiary)]',
  };

  const code = countryCodeFromLocation(value);
  const showFlag = Boolean(code) && !failed;

  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${tones[tone] ?? tones.secondary}`}>
      {showFlag && (
        <img
          src={flagUrl(code, 20)}
          srcSet={`${flagUrl(code, 20)} 1x, ${flagUrl(code, 40)} 2x`}
          width={14}
          height={11}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          title={countryNameFromCode(code)}
          className="shrink-0 rounded-[var(--ui-radius-xs)] object-cover ring-1 ring-[var(--ui-border-hairline)]"
        />
      )}
      <span className="truncate">{value}</span>
    </span>
  );
}
