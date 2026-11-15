---
updatedAt: 2025-08-31T19:05:42.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# IMAP Guide

Learn how to implement a custom IMAP authentication form into your application.
Find the [Developper IMAP API Guide](https://www.unipile.com/the-developers-guide-to-imap-api-solution/)

# Step 1: Authenticate to IMAP

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "MAIL",
  "imap_user": "yourmail@unipile.com",
  "smtp_user": "yourmail@unipile.com",
  "imap_password": "***",
  "smtp_password": "***",
  "imap_host": "your imap server provider",
  "smtp_host": "your smtp server provider",
  "imap_port": 993,
  "smtp_port": 465,
  "imap_encryption": "SSL"
}
'
```