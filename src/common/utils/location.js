/**
 * Location → country resolution.
 *
 * LinkedIn location strings are free text with no country field, so the country
 * has to be inferred from the string itself. The shapes we actually see:
 *
 *   "Bengaluru, Karnataka, India"         → last segment is the country
 *   "London, England, United Kingdom"     → last segment is the country
 *   "Dubai, United Arab Emirates"         → last segment is the country
 *   "San Francisco Bay Area"              → no country at all; a US metro alias
 *   "New York, NY"                        → US state abbreviation, no country
 *
 * Strategy, in order: exact match on the whole string, then the last comma
 * segment, then a trailing US state abbreviation, then any earlier segment.
 * We never guess: an unresolved location renders exactly as it does today.
 */

/** ISO 3166-1 alpha-2 by canonical country name (keys are already lowercase). */
const COUNTRY_BY_NAME = {
  afghanistan: 'af', albania: 'al', algeria: 'dz', andorra: 'ad', angola: 'ao',
  argentina: 'ar', armenia: 'am', australia: 'au', austria: 'at', azerbaijan: 'az',
  bahamas: 'bs', bahrain: 'bh', bangladesh: 'bd', barbados: 'bb', belarus: 'by',
  belgium: 'be', belize: 'bz', benin: 'bj', bermuda: 'bm', bhutan: 'bt',
  bolivia: 'bo', 'bosnia and herzegovina': 'ba', botswana: 'bw', brazil: 'br',
  brunei: 'bn', bulgaria: 'bg', 'burkina faso': 'bf', burundi: 'bi', cambodia: 'kh',
  cameroon: 'cm', canada: 'ca', 'cape verde': 'cv', 'cayman islands': 'ky',
  chad: 'td', chile: 'cl', china: 'cn', colombia: 'co', 'costa rica': 'cr',
  croatia: 'hr', cuba: 'cu', cyprus: 'cy', czechia: 'cz', 'czech republic': 'cz',
  denmark: 'dk', 'dominican republic': 'do', ecuador: 'ec', egypt: 'eg',
  'el salvador': 'sv', estonia: 'ee', eswatini: 'sz', ethiopia: 'et', fiji: 'fj',
  finland: 'fi', france: 'fr', gabon: 'ga', gambia: 'gm', georgia: 'ge',
  germany: 'de', ghana: 'gh', gibraltar: 'gi', greece: 'gr', greenland: 'gl',
  guatemala: 'gt', guinea: 'gn', guyana: 'gy', haiti: 'ht', honduras: 'hn',
  'hong kong': 'hk', 'hong kong sar': 'hk', hungary: 'hu', iceland: 'is',
  india: 'in', indonesia: 'id', iran: 'ir', iraq: 'iq', ireland: 'ie',
  israel: 'il', italy: 'it', 'ivory coast': 'ci', jamaica: 'jm', japan: 'jp',
  jordan: 'jo', kazakhstan: 'kz', kenya: 'ke', kuwait: 'kw', kyrgyzstan: 'kg',
  laos: 'la', latvia: 'lv', lebanon: 'lb', liberia: 'lr', libya: 'ly',
  liechtenstein: 'li', lithuania: 'lt', luxembourg: 'lu', macau: 'mo',
  madagascar: 'mg', malawi: 'mw', malaysia: 'my', maldives: 'mv', mali: 'ml',
  malta: 'mt', mauritania: 'mr', mauritius: 'mu', mexico: 'mx', moldova: 'md',
  monaco: 'mc', mongolia: 'mn', montenegro: 'me', morocco: 'ma', mozambique: 'mz',
  myanmar: 'mm', namibia: 'na', nepal: 'np', netherlands: 'nl',
  'new zealand': 'nz', nicaragua: 'ni', niger: 'ne', nigeria: 'ng',
  'north macedonia': 'mk', norway: 'no', oman: 'om', pakistan: 'pk',
  palestine: 'ps', panama: 'pa', 'papua new guinea': 'pg', paraguay: 'py',
  peru: 'pe', philippines: 'ph', poland: 'pl', portugal: 'pt',
  'puerto rico': 'pr', qatar: 'qa', romania: 'ro', russia: 'ru', rwanda: 'rw',
  'saudi arabia': 'sa', senegal: 'sn', serbia: 'rs', seychelles: 'sc',
  'sierra leone': 'sl', singapore: 'sg', slovakia: 'sk', slovenia: 'si',
  somalia: 'so', 'south africa': 'za', 'south korea': 'kr', 'south sudan': 'ss',
  spain: 'es', 'sri lanka': 'lk', sudan: 'sd', suriname: 'sr', sweden: 'se',
  switzerland: 'ch', syria: 'sy', taiwan: 'tw', tajikistan: 'tj', tanzania: 'tz',
  thailand: 'th', togo: 'tg', 'trinidad and tobago': 'tt', tunisia: 'tn',
  turkey: 'tr', turkmenistan: 'tm', uganda: 'ug', ukraine: 'ua',
  'united arab emirates': 'ae', 'united kingdom': 'gb', 'united states': 'us',
  uruguay: 'uy', uzbekistan: 'uz', venezuela: 've', vietnam: 'vn', yemen: 'ye',
  zambia: 'zm', zimbabwe: 'zw',
};

/**
 * Alternate spellings LinkedIn actually emits. Kept separate from the canonical
 * table so the canonical names stay the single source of truth for display.
 */
const COUNTRY_ALIASES = {
  usa: 'us', 'u.s.': 'us', 'u.s.a.': 'us', 'united states of america': 'us',
  america: 'us', 'the united states': 'us',
  uk: 'gb', 'u.k.': 'gb', 'great britain': 'gb', britain: 'gb',
  england: 'gb', scotland: 'gb', wales: 'gb', 'northern ireland': 'gb',
  uae: 'ae', 'u.a.e.': 'ae', emirates: 'ae',
  'republic of ireland': 'ie', 'republic of india': 'in', bharat: 'in',
  'republic of korea': 'kr', korea: 'kr', 'russian federation': 'ru',
  'the netherlands': 'nl', holland: 'nl', deutschland: 'de', espana: 'es',
  brasil: 'br', turkiye: 'tr', "people's republic of china": 'cn',
  'mainland china': 'cn', 'viet nam': 'vn', 'swiss confederation': 'ch',
  'kingdom of saudi arabia': 'sa', ksa: 'sa', "cote d'ivoire": 'ci',
};

/**
 * Country-less strings that still identify a country unambiguously: metro areas
 * LinkedIn uses without a country suffix. Only entries that can mean exactly
 * one country belong here.
 */
const REGION_ALIASES = {
  'san francisco bay area': 'us', 'greater seattle area': 'us',
  'greater new york city area': 'us', 'greater boston': 'us',
  'greater boston area': 'us', 'greater chicago area': 'us',
  'greater los angeles area': 'us', 'washington dc-baltimore area': 'us',
  'greater philadelphia': 'us', 'dallas-fort worth metroplex': 'us',
  'greater houston': 'us', 'greater phoenix area': 'us',
  'greater denver area': 'us', 'miami-fort lauderdale area': 'us',
  'greater sacramento': 'us', 'atlanta metropolitan area': 'us',
  'greater london': 'gb', 'greater london area': 'gb',
  'greater toronto area': 'ca', 'greater montreal metropolitan area': 'ca',
  'greater vancouver': 'ca', 'greater sydney area': 'au',
  'greater melbourne area': 'au', 'greater delhi area': 'in',
  'greater bengaluru area': 'in', 'national capital region': 'in',
  'greater hyderabad area': 'in', 'greater chennai area': 'in',
  'greater kolkata area': 'in', 'metro manila': 'ph',
  'greater munich metropolitan area': 'de',
  'greater paris metropolitan region': 'fr',
  'greater madrid metropolitan area': 'es', 'greater zurich area': 'ch',
  'greater amsterdam area': 'nl', 'greater dublin': 'ie',
  'greater tel aviv area': 'il', 'greater tokyo area': 'jp',
};

/** Trailing US state abbreviations: "Austin, TX" has no country segment. */
const US_STATES = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il',
  'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt',
  'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri',
  'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc',
]);

/** Display names, derived from the canonical table so the two can't drift. */
const NAME_BY_CODE = Object.entries(COUNTRY_BY_NAME).reduce((acc, [name, code]) => {
  if (!acc[code]) acc[code] = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return acc;
}, {});

/**
 * Lowercase, strip diacritics and trailing punctuation, collapse whitespace.
 * Diacritic folding is what lets "Türkiye" and "España" hit the alias table.
 */
function normalize(segment) {
  return segment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookup(segment) {
  const key = normalize(segment);
  if (!key) return null;
  return COUNTRY_BY_NAME[key] ?? COUNTRY_ALIASES[key] ?? REGION_ALIASES[key] ?? null;
}

/**
 * Resolve a free-text location to an ISO 3166-1 alpha-2 code, or null when the
 * string doesn't name a country we recognise. Never throws, never guesses.
 *
 * Known limitation: a bare trailing "IN" is read as Indiana, not India, because
 * LinkedIn writes countries out in full and US rows are the only ones that
 * abbreviate. Change US_STATES if that ever stops being true.
 *
 * @param {string} location
 * @returns {string|null} lowercase ISO2 code, e.g. 'in'
 */
export function countryCodeFromLocation(location) {
  if (!location || typeof location !== 'string') return null;

  const whole = lookup(location);
  if (whole) return whole;

  const segments = location.split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  // The country, when present, is the last segment. Check it first so
  // "Georgia, United States" resolves to US and not to the country Georgia.
  const last = lookup(segments[segments.length - 1]);
  if (last) return last;

  const tail = normalize(segments[segments.length - 1]);
  if (tail.length === 2 && US_STATES.has(tail)) return 'us';

  // Fall back to earlier segments, right to left, so a country that isn't last
  // ("India, Remote") still resolves.
  for (let i = segments.length - 2; i >= 0; i -= 1) {
    const hit = lookup(segments[i]);
    if (hit) return hit;
  }

  return null;
}

/**
 * Human-readable country name for a code — used for tooltips and image alt text.
 *
 * @param {string|null} code lowercase ISO2
 * @returns {string|null}
 */
export function countryNameFromCode(code) {
  if (!code) return null;
  return NAME_BY_CODE[code] ?? code.toUpperCase();
}

/**
 * Flag image URL. flagcdn.com serves free, key-less flag rasters; w20 is a
 * ~1KB file that renders crisply at the 14px we draw it at, with w40 as the 2x
 * source so it stays sharp on retina.
 *
 * @param {string} code lowercase ISO2
 * @param {number} width one of flagcdn's supported widths (20, 40, 80, ...)
 */
export function flagUrl(code, width = 20) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}
