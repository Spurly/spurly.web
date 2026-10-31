export const POSTS_EVENTS = {
  LEAD_POSTS_SUCCESS: 'POSTS_LEAD_POSTS_SUCCESS',
  LEAD_POSTS_FAILURE: 'POSTS_LEAD_POSTS_FAILURE',
  LIKE_SUCCESS: 'POSTS_LIKE_SUCCESS',
  LIKE_FAILURE: 'POSTS_LIKE_FAILURE',
  COMMENT_SUCCESS: 'POSTS_COMMENT_SUCCESS',
  COMMENT_FAILURE: 'POSTS_COMMENT_FAILURE',
  DRAFT_SUCCESS: 'POSTS_DRAFT_SUCCESS',
  DRAFT_FAILURE: 'POSTS_DRAFT_FAILURE',
  COMMENTS_SUCCESS: 'POSTS_COMMENTS_SUCCESS',
  COMMENTS_FAILURE: 'POSTS_COMMENTS_FAILURE',
  REACTIONS_SUCCESS: 'POSTS_REACTIONS_SUCCESS',
  REACTIONS_FAILURE: 'POSTS_REACTIONS_FAILURE',
  OWN_SUCCESS: 'POSTS_OWN_SUCCESS',
  OWN_FAILURE: 'POSTS_OWN_FAILURE',
  PUBLISH_SUCCESS: 'POSTS_PUBLISH_SUCCESS',
  PUBLISH_FAILURE: 'POSTS_PUBLISH_FAILURE',
  CANCEL_SUCCESS: 'POSTS_CANCEL_SUCCESS',
  CANCEL_FAILURE: 'POSTS_CANCEL_FAILURE',
  USAGE_SUCCESS: 'POSTS_USAGE_SUCCESS',
  USAGE_FAILURE: 'POSTS_USAGE_FAILURE',
  AUDIENCES_SUCCESS: 'POSTS_AUDIENCES_SUCCESS',
  AUDIENCES_FAILURE: 'POSTS_AUDIENCES_FAILURE',
  RULE_SUCCESS: 'POSTS_RULE_SUCCESS',
  RULE_FAILURE: 'POSTS_RULE_FAILURE',
  RULE_SAVE_SUCCESS: 'POSTS_RULE_SAVE_SUCCESS',
  RULE_SAVE_FAILURE: 'POSTS_RULE_SAVE_FAILURE',
};

export const POST_MAX = 3000;
export const COMMENT_MAX = 1250;

export const POST_REACTIONS = [
  { value: 'like', label: 'Like' },
  { value: 'celebrate', label: 'Celebrate' },
  { value: 'support', label: 'Support' },
  { value: 'love', label: 'Love' },
  { value: 'insightful', label: 'Insightful' },
  { value: 'funny', label: 'Funny' },
];

/** What the media button offers on a new post (mirrors the server's limits). */
export const POST_MEDIA = {
  image: { label: 'Image', accept: '.png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif', maxMb: 8 },
  video: { label: 'Video (.mp4)', accept: '.mp4,video/mp4', maxMb: 100 },
};

export const DEFAULT_RULE = { enabled: false, audienceId: null, reaction: 'like', lastRunAt: null, lastRun: null };
