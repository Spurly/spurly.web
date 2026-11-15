---
updatedAt: 2025-08-31T19:05:53.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Tracking email

Get real-time click and open  on sent email using Unipile's Webhook.

*Feature available for :**Google, Microsoft, IMAP***

Unipile's email tracking Webhook is a powerful feature that provides real-time notification on open email or click link in email you sent..

You need to activate parameter on send : <https://developer.unipile.com/docs/send-email#tracking-options>

And create webhook "email\_tracking" from api or directly in dashboard  to start receive event.

Here is an example request payload you will received.

```json
{
  "event": "mail_link_clicked", // "mail_opened"
  "event_id": "s-5DTo49QZ-uGZFij4qQcA",
  "tracking_id": "JRekFgKASkenrTYuB-Myog",
  "date": "2024-05-07T15:12:45.073Z",
  "email_id": "QRN8tKYAXfKv3qilPVNG7w",
  "account_id": "w72IOm5dRCCO2dW4wJUAhw",
  "ip": "123.123.123.123",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "url": "https://mylandingpage.com",
  "label": "My label",
  "custom_domain": "https://mytrackingdomain.com"
}
```

### Custom Domain URL (White-label)

You can establish a CNAME using your own URL (e.g., link.yourapp.com) pointing to s1.lnk-fllw\.com

Once set up, please contact us for authorization. Following approval, you can set the URL in your code in send email request to replace defaut domain link of tracking