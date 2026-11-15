---
updatedAt: 2025-11-21T15:38:55.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Retrieving emails

Learn how to retrieve messages of your connected accounts.

*Feature available for :**Google, Microsoft, IMAP***

# Get emails history

To get existing emails, use the [`GET`emails](https://developer.unipile.com/reference/mailscontroller_listmails) Method or the appropriate SDK Method .

Most recent messages will be returned first, ordered by date.

By default, the limit of returned messages is set to 100.

You can use lot of parameters to get only a folder, date, recipient, sender, see [`GET`emails](https://developer.unipile.com/reference/mailscontroller_listmails)

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/emails?limit=10&account_id=5D586za6a-aAaasqXX \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'

```
```javascript
const response = await client.email.getAll({
  account_id: "5D586za6a-aAaasqXX",
  limit: 10
});
```

*This method use[pagination](https://developer.unipile.com/docs/api-usage).*

# Get new emails

Unipile's API give you two options to receive emails in your application

## In realtime with Webhooks

The recommended approach to listen for new messages in your application is by using a Webhook because they trigger in real time. Whenever the user account **receives** or **sends** a new email, the Webhook will call your specified URL with the given email that you can store to be displayed.

-> [More informations on new emails webhooks](https://developer.unipile.com/docs/new-emails-webhook)

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /emails](https://developer.unipile.com/reference/mailscontroller_listmails) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated emails. In this case, implementing a unique ID verification on your history entry based on the email ID can help prevent duplicate entries.*