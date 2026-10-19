import {
  SIM_DAYS, SIM_SEED, SIM_INVITES_PER_DAY, SIM_REPLIES_PER_DAY, SIM_CALLS_PER_WEEK,
} from "../constants/constants.js";

/* Small seeded random generator, so the run is the same on the server and in the
   browser (no hydration mismatch) and in tests. */
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand, [lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));

/** Running totals for every day, index 0 = before day 1 (all zeros).
 *  invites and replies grow a little every day; calls booked land once a week. */
export function buildRun(days = SIM_DAYS, seed = SIM_SEED) {
  const rand = mulberry32(seed);
  const run = { invites: [0], replies: [0], calls: [0] };
  for (let day = 1; day <= days; day += 1) {
    run.invites.push(run.invites[day - 1] + between(rand, SIM_INVITES_PER_DAY));
    run.replies.push(run.replies[day - 1] + Math.min(between(rand, SIM_REPLIES_PER_DAY), SIM_INVITES_PER_DAY[0]));
    run.calls.push(run.calls[day - 1] + (day % 7 === 0 ? between(rand, SIM_CALLS_PER_WEEK) : 0));
  }
  return run;
}
