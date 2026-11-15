---
updatedAt: 2026-10-30T09:27:26.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Retrieving messages

Learn how to retrieve messages of your connected accounts.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

# Get message history of a chat

To get existing messages in a chat, use the [`GET`chats/\{chat\_id}/messages ](https://developer.unipile.com/reference/chatscontroller_listchatmessages) Method or the appropriate SDK Method with a valid `chat_id`.

Most recent messages will be returned first, ordered by date.

By default, the limit of returned messages is set to 100.

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/chats/{CHAT_ID}/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'
```
```javascript
const response = await client.messaging.getAllMessagesFromChat({
  chat_id: "e9d087d67",
});
```

*This method use[pagination](https://developer.unipile.com/docs/api-usage).*

# Get new messages

Unipile's API give you two options to receive messages in your application

## In realtime with Webhooks

The recommended approach to listen for new messages in your application is by using a Webhook because they trigger in real time. Whenever the user account **receives** or **sends** a new message, the Webhook will call your specified URL with the given message that you can store to be displayed.

-> [More informations on new messages webhooks](https://developer.unipile.com/docs/new-messages-webhook)

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /messages](https://developer.unipile.com/reference/messagescontroller_listallmessages) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated messages. In this case, implementing a unique ID verification on your history entry based on the message ID can help prevent duplicate entries.*