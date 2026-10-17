import { useState } from 'react';
import { ChipCell } from '../ChipCell';
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
export function LocationCell({ value, tone = 'secondary', flag = false, chip = false }) {
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
  const showFlag = flag && Boolean(code) && !failed;

  if (chip) {
    return (
      <ChipCell
        value={value}
        icon={
          showFlag ? (
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
              className="shrink-0 rounded-[2px] object-cover"
            />
          ) : null
        }
      />
    );
  }

  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${tones[tone] ?? tones.secondary}`}>
      {showFlag && (
        <img
          src={flagUrl(code, 20)}
          srcSet={`${flagUrl(code, 20)} 1x, ${flagUrl(code, 40)} 2x`}
          width={18}
          height={13}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          title={countryNameFromCode(code)}
          className="shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(25,35,95,0.12),0_1px_2px_rgba(25,35,95,0.15)]"
        />
      )}
      <span className="truncate">{value}</span>
    </span>
  );
}
