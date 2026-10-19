/* Flip-clock results simulation. Change the ranges here; nothing else needs touching.
   Defaults follow the real pace of Spurly's own account (476 invites in 42 days, about
   80 a week) and stay inside LinkedIn's weekly invite limits. Replies can never exceed
   invites. These are generated numbers: the section is labelled "Simulation". */
export const SIM_DAYS = 42;
export const SIM_SEED = 7;
export const SIM_INVITES_PER_DAY = [10, 13];
export const SIM_REPLIES_PER_DAY = [3, 5];
export const SIM_CALLS_PER_WEEK = [2, 3];
export const SIM_STEP_MS = 210;
