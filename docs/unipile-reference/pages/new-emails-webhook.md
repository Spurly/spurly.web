---
updatedAt: 2026-09-02T09:43:22.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# New email

Get real-time updates on new email using Unipile's Webhook.

*Feature available for :****Google, Microsoft, IMAP***

Unipile's New email Webhook is a powerful feature that provides real-time notification on new email, received or sent.

Sent emails are included because they can be sent by the connected user from another device.

Here is an example request payload:

```json
{
  "email_id": "--R9___qXQKIu80oAF0lJA",
  "account_id": "GxwlUMaZTHefegva16XcWw",
  "event": "mail_received", // "mail_sent" | "mail_moved"
  "webhook_name": "webhook name",
  "date": "2023-06-14T23:54:12.000Z",
  "from_attendee": {
    "display_name": "Julien Crépieux",
    "identifier": "julien@unipile.com",
    "identifier_type": "EMAIL_ADDRESS"
  },
  "to_attendees": [
    {
      "display_name": "Arnaud Hartmann",
      "identifier": "arnaud@unipile.com",
      "identifier_type": "EMAIL_ADDRESS"
    }
  ],
  "bcc_attendees": [],
  "cc_attendees": [],
  "reply_to_attendees": [],
  "provider_id": "a3ZWYmFFbE9RazlZLjI4ATe",
  "message_id": "<D8.08.07528.0034A846@unipile.com>",
  "has_attachments": false,
  "subject": "Hello",
  "body": "Hello World",
  "body_plain": "",
  "attachments": [],
  "folders": ["Inbox"],
  "role": "inbox",
  "read_date": null,
  "is_complete": false,
  "in_reply_to": {
    "message_id": "<DB9P251MB0524C459227C8A2AF82CC523C21A2@unipile.com>",
    "id": "GxwlUMaZTHefegva16XcWw"
  },
  "tracking_id": "Z-4Nx5bMR86b9NVCloU1gg",
  "origin": "unipile" // "external"
}
```