/**
 * "Company Website" cell → the registrable domain, or '' when it is not a
 * usable company domain. The web copy of spurly.backend's
 * importedLeads/service/companyDomain.js#normalizeDomain: the import preview
 * must count a row as "Spurly will find" exactly when the backend will queue
 * it, so the two rules (and the generic-domain list) must stay in step.
 *
 *   "https://www.getspurly.com/"   → "getspurly.com"
 *   "http://getspurly.com/pricing" → "getspurly.com"
 *   "WWW.GETSPURLY.COM"            → "getspurly.com"
 *   "gmail.com" / "n/a" / ""       → ""
 */

const GENERIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'yahoo.co.uk',
  'ymail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
  'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'rediffmail.com', 'gmx.com',
  'mail.com', 'yandex.com', 'zohomail.com',
  'linkedin.com', 'lnkd.in', 'facebook.com', 'fb.com', 'instagram.com', 'twitter.com',
  'x.com', 'youtube.com', 'youtu.be', 'tiktok.com', 'github.com', 'wa.me', 'whatsapp.com',
  't.me', 'telegram.me', 'medium.com', 'substack.com',
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'forms.gle', 'linktr.ee', 'calendly.com',
  'wixsite.com', 'wordpress.com', 'blogspot.com', 'business.site', 'notion.site',
  'carrd.co', 'weebly.com',
]);

const SECOND_LEVEL_LABELS = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'or', 'ne', 'nic', 'ltd', 'plc']);
const LABEL = /^(?:[a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$/;
const TLD = /^(?:[a-z]{2,24}|xn--[a-z0-9-]{2,20})$/;

export function normalizeDomain(input) {
  let value = String(input ?? '').trim().toLowerCase();
  if (!value || value.length > 500) return '';

  value = value.replace(/^["'\s]+|["'\s]+$/g, '');
  if (value.includes('@') && !/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = value.slice(value.lastIndexOf('@') + 1);
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.replace(/^[^/?#]*@/, '');
  value = value.split(/[/?#\s]/)[0];
  value = value.replace(/:\d+$/, '').replace(/\.+$/, '');
  value = value.replace(/^www\d?\./, '');

  const labels = value.split('.');
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return '';
  if (!TLD.test(labels[labels.length - 1])) return '';

  const last = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const keep = labels.length >= 3 && last.length === 2 && SECOND_LEVEL_LABELS.has(second) ? 3 : 2;
  const domain = labels.slice(-keep).join('.');

  return GENERIC_DOMAINS.has(domain) ? '' : domain;
}
