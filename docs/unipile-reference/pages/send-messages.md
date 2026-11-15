---
updatedAt: 2026-10-30T09:27:26.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Send Messages

Learn how to send messages with Unipile

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

# Send a message in an existing Chat / Group

Use the [`POST chats/{chat_id}/messages`](https://developer.unipile.com/reference/chatscontroller_sendmessageinchat) Method or use the appropriate SDK Method, to send a message by providing a `chat_id` you can find by retrieving chats lists, or when receiving a message to automate replies on Webhook trigger.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats/9f9uio56sopa456s/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form 'text=Hello world !'
```
```javascript
const response = await client.messaging.sendMessage({
  chat_id: "9f9uio56sopa456s",
  text: "Hello world !"
})
```

<Callout icon="📘" theme="info">
  If you want to send a message into an existing chat using an attendee identifier, you can read the next section, but if you have the choice, always prefer the usage of `chat_id`.
</Callout>

***

# Send a message to a User

There is two cases where you want to send a message to a User instead of in a Chat:

* You don't have access to the id of the existing chat
* The connected account does not have a conversation history this specific user, so there is no existing chat and you must start a new chat.

To send a message to a User, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method.

In the `account_id` field, provide the ID of the connected account to send the message from. In the `attendees_ids` field, give one user's **Provider internal ID**. Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The method will send a message in a 1 to 1 chat, and:

* If the chat does not exist, it will be created, synced, and returned
* If the user was not an attendee yet, it will be synced

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Yk08cDzzdsqs9_8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
```
```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
})
```

## LinkedIn specific use cases

With Linkedin, unless InMail, you can start new chats only with your Relations. You can use Unipile to invite people to be in your Relations : [Send a contact invitation](https://developer.unipile.com/reference/userscontroller_adduserbyidentifier)

If you have a Premium LinkedIn account and want to send InMails, set the `inmail` property to true in the payload. You have to consider the account type of user (with /me route or GET account) to use to good API (classic/recruiter/sales\_navigator)

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Asdq-j08dsqQS89QSD \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form linkedin[api]=classic \
     --form linkedin[inmail]=true \
```
```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
  options: {
    linkedin: {
      api: 'classic',
      inmail: true
    }
  }
})
```

***

# Send attachments

You can provide an additional attachment to the request body to send attachments along your text message.

Limitations may vary depending on the provider, but the standard maximum size is 15MB. You can send documents in PDF, image, or video formats.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=sSR22ds5dd_ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form 'attachments=@C:\Documents\cute_dog.png'
```

***

# Create a group chat

To start a new group chat, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method and provider a list of user's **Provider internal ID** in `attendees_ids` along an optional `title` for the group name.

Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The chat and its group participants will be synced.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=k0_s8cdss9Dz8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=33600000000@s.whatsapp.net \
     --form attendees_ids=33600000001@s.whatsapp.net \
     --form subject=Vacation
```

***