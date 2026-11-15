---
updatedAt: 2026-10-30T09:27:26.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# New messages

Get real-time updates on new messages using Unipile's Webhook.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

Unipile's New messages Webhook is a powerful feature that provides real-time notification on new messages, received or sent.

Sent messages are included in message\_received, they can be sent by the connected user from another device or from API. You can compare "account\_info.user\_id" with "sender.attendee\_provider\_id" to know if linked Unipile account is the sender or not.

You will not receive webhooks for old messages upon account connection. However, in the case of reconnection, you will receive messages that arrived during the disconnection period.

Here is an example request payload:

```json
{
  "account_id": "dfXlh46vQYCsMbVarumWlg",
  "account_type": "LINKEDIN", // 'LINKEDIN' | 'INSTAGRAM' | 'WHATSAPP' | 'TELEGRAM'
  "account_info":{
    "type":"LINKEDIN", // 'LINKEDIN' | 'INSTAGRAM'
    "feature":"classic", // 'organization' | 'sales_navigator' | 'recruiter' | 'classic'
    "user_id":"ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E" 
},
  "event":  "message_received", // 'message_reaction' | 'message_read' | 'message_received' | 'message_edited' | 'message_deleted' | 'message_delivered'
  "chat_id": "R8J-xM9WX7eoHLp6gSVtWQ",
  "timestamp": "2023-09-24T13:49:07.965Z",
  "webhook_name": "Webhook demo",
  "message_id": "ykmhfXlRW0W_cqReJYrfBw",
  "message": "Hello World !",
  "sender": {
    "attendee_id": "C8zaRZTlVcmfnke_Vai4Gg",
    "attendee_name": "Kim Unipile",
    "attendee_provider_id": "ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
    "attendee_profile_url": "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/",
  },
 "attendees": [
    {
      "attendee_id": "12Siz1Vcmfnke_Vai4Gg",
      "attendee_name": "Bastien Unipile ",
      "attendee_provider_id": "AA1212sqqsMQBODyLwZrRcgYhrkCafURGqva0U4E",
      "attendee_profile_url": "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/"
    }
	],
  "attachments": [
    {
      "id": "2-MTY5MzQ3ODM0MTgxOWI4MDA4My0wMDMmNjg2M2E2MTgtNjM2Yi01OWNkLWFjNmQtYjE3Y2NjNTU5ZWZkXzAxMw==",
      "size": {
        "height": "150",
        "width": "150"
      },
      "sticker": false,
      "unavailable": false,
      "mimetype": "image/jpeg",
      "type": "img",
      "url": "att://iWfwCtGXSr288YQm5MbWVaeGtYNHQyaEZQcVpPbW5PdGNsQQ=="
    },
    {
      "id": "2-SECOND_ATTACHMENT_ID_EXAMPLE",
      "size": {
        "height": "1080",
        "width": "1920"
      },
      "sticker": false,
      "unavailable": false,
      "mimetype": "image/png",
      "type": "img",
      "url": "att://SECOND_ATTACHMENT_URL_EXAMPLE"
    }
  ],
  "reaction": "😄", // only for event "message_reaction"
  "reaction_sender": { // only for event "message_reaction"
    "attendee_id": "C8zaRZTlVcmfnke_Vai4Gg",
    "attendee_name": "Kim Unipile",
    "attendee_provider_id": "ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
    "attendee_profile_url: "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/",
  }
}
```