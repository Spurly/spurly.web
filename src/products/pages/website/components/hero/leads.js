/* Sample lead cities for the hero globe. Decorative only: the point is to show
   that "their morning" differs from yours. Local time comes from Intl, so it is
   correct for any visitor without a location lookup. */

export const LEADS = [
  { name: "Lagos", tz: "Africa/Lagos", ll: [6.5, 3.4] },
  { name: "London", tz: "Europe/London", ll: [51.5, -0.1] },
  { name: "New York", tz: "America/New_York", ll: [40.7, -74] },
  { name: "São Paulo", tz: "America/Sao_Paulo", ll: [-23.5, -46.6] },
  { name: "Dubai", tz: "Asia/Dubai", ll: [25.2, 55.3] },
  { name: "Singapore", tz: "Asia/Singapore", ll: [1.35, 103.8] },
  { name: "Sydney", tz: "Australia/Sydney", ll: [-33.9, 151.2] },
  { name: "San Francisco", tz: "America/Los_Angeles", ll: [37.8, -122.4] },
];

/* Origin of every arc. Delhi for now; swap for a detected city when geo lands. */
export const ORIGIN = { name: "You", place: "Delhi", ll: [28.6, 77.2] };

const AWAKE_FROM = 8;
const AWAKE_TO = 18;

/** { text: "09:05", hour: 9 } in the given IANA time zone, right now. */
export function localTime(tz, now = new Date()) {
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return { text, hour: parseInt(text.slice(0, 2), 10) };
}

export function isAwake(hour) {
  return hour >= AWAKE_FROM && hour < AWAKE_TO;
}
