/**
 * Poll interval while anything in this feature is live (a running campaign,
 * an in-progress send). 10s: sending is measured in a handful an hour, so
 * anything faster is a lot of requests to watch a number that barely moves.
 *
 * One constant, not one per hook — useCampaigns.js and useCampaignDetail.js
 * both poll on this same cadence and used to each define their own copy of
 * the same number.
 */
export const POLL_MS = 10000;
