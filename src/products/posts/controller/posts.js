import hubPostsGateway from '../gateway/posts.js';
import { POSTS_EVENTS as E } from '../constants/constants.js';

/** The one thing the Posts page and the lead drawer may call: a call never throws into a component; the outcome is an event. */

function run(eventEmitter, work, success, failure, extra = {}) {
  return work().then(
    (data) => eventEmitter.emit(success, { ...extra, data }),
    (error) => eventEmitter.emit(failure, { ...extra, error, code: error?.code }),
  );
}

const g = hubPostsGateway;
const listLeadPosts = (em, leadId) => run(em, () => g.listLeadPosts(leadId), E.LEAD_POSTS_SUCCESS, E.LEAD_POSTS_FAILURE);
const likeLeadPost = (em, leadId, p) => run(em, () => g.likeLeadPost(leadId, p), E.LIKE_SUCCESS, E.LIKE_FAILURE, { socialId: p.socialId });
const commentOnLeadPost = (em, leadId, p) => run(em, () => g.commentOnLeadPost(leadId, p), E.COMMENT_SUCCESS, E.COMMENT_FAILURE, { socialId: p.socialId });
const draftComment = (em, leadId, p) => run(em, () => g.draftComment(leadId, p), E.DRAFT_SUCCESS, E.DRAFT_FAILURE, { socialId: p.socialId });
const listComments = (em, p) => run(em, () => g.listComments(p), E.COMMENTS_SUCCESS, E.COMMENTS_FAILURE, { socialId: p.socialId, append: Boolean(p.cursor) });
const listReactions = (em, p) => run(em, () => g.listReactions(p), E.REACTIONS_SUCCESS, E.REACTIONS_FAILURE, { socialId: p.socialId, append: Boolean(p.cursor) });
const listOwn = (em) => run(em, () => g.listOwn(), E.OWN_SUCCESS, E.OWN_FAILURE);
const publish = (em, p) => run(em, () => g.publish(p), E.PUBLISH_SUCCESS, E.PUBLISH_FAILURE, { scheduled: Boolean(p.scheduledFor) });
const publishMedia = (em, p) => run(em, () => g.publishMedia(p), E.PUBLISH_SUCCESS, E.PUBLISH_FAILURE, { scheduled: false });
const cancel = (em, postId) => run(em, () => g.cancel(postId), E.CANCEL_SUCCESS, E.CANCEL_FAILURE, { postId });
const getUsage = (em) => run(em, () => g.getUsage(), E.USAGE_SUCCESS, E.USAGE_FAILURE);
const getRule = (em) => run(em, () => g.getRule(), E.RULE_SUCCESS, E.RULE_FAILURE);
const saveRule = (em, rule) => run(em, () => g.saveRule(rule), E.RULE_SAVE_SUCCESS, E.RULE_SAVE_FAILURE);

const listAudiences = (em) => run(em, () => g.listAudiences(), E.AUDIENCES_SUCCESS, E.AUDIENCES_FAILURE);

const hubPostsController = { listAudiences, listLeadPosts, likeLeadPost, commentOnLeadPost, draftComment, listComments, listReactions, listOwn, publish, publishMedia, cancel, getUsage, getRule, saveRule };
export default hubPostsController;
