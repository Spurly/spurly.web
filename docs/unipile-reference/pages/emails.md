---
updatedAt: 2026-11-13T16:26:05.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Email & Calendars overview

The Unipile Email API is designed to offer a robust and secure connection to your users' email inboxes, ensuring seamless access to both historical and real-time email data. This API supports comprehensive bi-directional synchronization with full CRUD (Create, Read, Update, Delete) functionalities for a wide range of email providers. Featuring a user-friendly REST interface, the Unipile Email API enables you to execute various operations effectively:

* Retrieve details from email messages and threads, including the content of the message, details about the sender and recipients, and other relevant information.
* Efficiently organize email inboxes by utilizing labels and folders.
* Modify the status of email messages, such as marking them as unread or starring them for importance.
* Send email directly through the API.
* Searches within inboxes to locate specific emails or content.
* Handle and download attachments associated with emails.

With Google and Microsoft accounts, you can also use the Calendar API to:

* Retrieve and manage calendars and events
* Create events with attendees and an online meeting link
* Receive webhook notifications for events

# Google and Microsoft OAuth Setup

Unipile is compatible with all email providers, including those based on IMAP protocols, without the need for any preliminary configuration. For Google and Microsoft accounts, your integration uses Unipile's OAuth applications by default, so your users can connect their accounts right away, in production.

> 📘 Unipile's Google OAuth application is included in the price
>
> **Using Unipile's Google OAuth application is included in the per-account price, with no extra fees.** You don't need to create your own Google Cloud project or go through Google's verification process to connect Gmail and Google Calendar accounts in production.

Creating your own Google and Microsoft applications is optional: it displays your application's name and logo on the OAuth consent screen instead of Unipile's. In that case, store their credentials in the Unipile Dashboard. Note that Google's verification process can take several weeks before your own application can be used in production.

To gain a comprehensive understanding of this process, you can refer to the [Google provider integration guide](https://developer.unipile.com/docs/google-oauth) and the[ Microsoft provider integration guide](https://developer.unipile.com/docs/microsoft-oauth), tailored for Unipile API.

# Email deliverability

In most cases, major email providers like Google, Microsoft, and IMAP providers automatically configure DKIM, SPF and eventually DMARC when users set up their internal email systems. If you're simply creating a system for email sync and manual sending from your app, you can bypass managing these settings. Just instruct users to connect their email, ensuring they experience the same delivery results as with Outlook or Gmail.

However, if your system involves outreach or automatic sending at higher volumes, it's advisable to verify the proper configuration of these parameters to ensure optimal deliverability at scale.

If your company domain sends more than 5000 emails daily to Google or Yahoo, you need to maintain an abuse complaint rate of 0.3% or lower, or all company emails will be blocked by Google.

All traffic for your domain is included in this limit: newsletters, notifications, internal emails, etc.