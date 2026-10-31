import apiGateway from 'src/shared/gateway/apiGateway.js';
import { DEFAULT_RULE } from '../constants/constants.js';

/** Thin wrappers over /hub/posts and /hub/leads/:id/posts/*. Shapes are the server's own. */

const data = (res, fallback = null) => res.data?.data ?? fallback;

async function listLeadPosts(leadId) {
  return data(await apiGateway.get(`/hub/leads/${leadId}/posts`, { params: { limit: 10 } }), { items: [] });
}
async function likeLeadPost(leadId, { socialId, reactionType }) {
  return data(await apiGateway.post(`/hub/leads/${leadId}/posts/like`, { socialId, reactionType }));
}
async function commentOnLeadPost(leadId, { socialId, text }) {
  return data(await apiGateway.post(`/hub/leads/${leadId}/posts/comment`, { socialId, text }));
}
/** An AI draft is a model call: slower than the usual 10 s ceiling. */
async function draftComment(leadId, { postText, instruction }) {
  return data(await apiGateway.post(`/hub/leads/${leadId}/posts/comment-draft`, { postText, instruction }, { timeout: 60000 }));
}
async function listComments({ socialId, cursor }) {
  return data(await apiGateway.get('/hub/posts/comments', { params: { socialId, ...(cursor ? { cursor } : {}) } }), { items: [], cursor: null });
}
async function listReactions({ socialId, cursor }) {
  return data(await apiGateway.get('/hub/posts/reactions', { params: { socialId, ...(cursor ? { cursor } : {}) } }), { items: [], cursor: null });
}
async function listOwn() {
  return data(await apiGateway.get('/hub/posts'), { posts: [] });
}
/** Publishing waits on LinkedIn, so a long timeout; scheduling is a plain write. */
async function publish({ text, scheduledFor }) {
  return data(await apiGateway.post('/hub/posts', { text, ...(scheduledFor ? { scheduledFor } : {}) }, { timeout: 60000 }));
}
/** The request body IS the file; the server validates type and size from headers. */
async function publishMedia({ kind, file, text }) {
  const params = { kind, filename: file.name, ...(text ? { text } : {}) };
  return data(await apiGateway.post('/hub/posts/media', file, { params, headers: { 'Content-Type': file.type || 'application/octet-stream' }, timeout: 300000 }));
}
async function cancel(postId) {
  return data(await apiGateway.delete(`/hub/posts/${postId}`));
}
async function getUsage() {
  return data(await apiGateway.get('/hub/posts/usage'), { connected: false, usage: {} });
}
async function getRule() {
  return { ...DEFAULT_RULE, ...(data(await apiGateway.get('/hub/posts/engagement-rule'), {})) };
}
async function saveRule(rule) {
  return { ...DEFAULT_RULE, ...(data(await apiGateway.put('/hub/posts/engagement-rule', rule), {})) };
}

/** The audiences the bulk-like rule can target (same list the leads page shows). */
async function listAudiences() {
  const res = await apiGateway.get('/hub/searches');
  return (res.data?.data?.searches ?? []).map((a) => ({ _id: a._id, name: a.name || 'Untitled audience' }));
}

const hubPostsGateway = { listAudiences, listLeadPosts, likeLeadPost, commentOnLeadPost, draftComment, listComments, listReactions, listOwn, publish, publishMedia, cancel, getUsage, getRule, saveRule };
export default hubPostsGateway;
