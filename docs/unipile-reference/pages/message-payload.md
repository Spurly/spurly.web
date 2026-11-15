---
updatedAt: 2026-10-08T15:07:21.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Message object

This section will explain in detail each field of the message object so you can properly integrate them in your application

## id

Unique identifier of the message for Unipile.

Can be used to prevent duplicate entries.

## chat\_id

Unique identifier of the parent chat for Unipile.

Can be used to retrieve the parent chat.

## provider\_id

Unique identifier of the message for the provider.

Can be use to reference the message in the native web app of the provider.

## chat\_provider\_id

Unique identifier of the parent chat for the provider.

Can be use to reference the chat in the native web app of the provider. For exemple, if you need a link "Open chat in LinkedIn".

## account\_id

Unique identifier of the parent account.

## text

Textual body of the message.

***Unipile does not support formatted text yet and will return plain text.***

## attachments

List of attachments.

## sender\_id

Unique identifier of the sender for the provider.

The format is specific to each provider, it can be a phone number, an email, a username or an ID.

Can be used to match attendees if any. In cases you don't have the attendee, you can still display this sender\_id to identify the sender.

<Image src="https://files.readme.io/359372b-sender_id.png" align="center" width="500px" />

## timestamp

Provider's server acknowledge datetime.

Can be used as message sent date.

<Image src="https://files.readme.io/4234a93-timestamp.png" align="center" width="500px" />

## is\_sender

Boolean telling if the message sender is the account's user or someone else.

Can be used to design a message bubble.

## seen

> Per provider support

If `is_sender` is true, Boolean telling if the message has been seen / read by at least one recipient.

If `is_sender` is false, Boolean telling if the message has been seen / read by the connected user, which can be the case if the message is get after being seen on another app or device.

## seen\_by

> Per provider support

List of message read receipts.

The key is the provider's user id, and the value can be a boolean telling if the message has been seen / read by this user, or a timestamp telling when it was seen / read.

## delivered

> Per provider support

Boolean telling if the message has been delivered to the recipient. Note that, depending on the provider, it does not guarantee that it's delivered to the recipient, but only to the provider's server.

## hidden

Boolean telling if the message should be hidden in the conversation view.

For exemple, messages of type "John reacted 👍 to your message" are hidden, but visible as last message in chat lists.

<Image src="https://files.readme.io/3a08e4b-hidden.png" align="center" width="800px" />

## deleted

Boolean telling if the message has been deleted.

Can be used to replace the content of a message by a generic "Message deleted"

## deleted\_for

> Per provider support

Who the message was deleted for. Present only when deleted is 1.

* "me": the account deleted the message for itself only (Delete for me).&#x20;

* "everyone": the message was removed for all participants (Delete for everyone).&#x20;

## edited

> Per provider support

Boolean telling if the message has been edited.

## is\_event

Boolean telling the message is not an actual user message, but an event, specified by `event_type`.

## event\_type

If `is_event` is true, the type of event. Unipile support the following events :

* A user reacted to a message (`1`)

* A user reacted to owner message (`2`)

* The group was created (`3`)

* The group has changed title (`4`)

* A new participant was added to the group (`5`)

* A participant was removed from the group (`6`)

* A participant left the group (`7`)

* Missed voice call (`8`)

* Missed video call (`9`)

* A call was received (`10`)

* A call was sent (`11`) (not received with Whatsapp)

* A call ended (`12`)

* A call was accepted (`13`)

Some providers shows other kinds of events. Unipile does not support them yet and will set `event_type` as `0`.

## message\_type

Indicates the subtype of the message when it carries additional semantic meaning beyond a standard text message. null for regular messages.

Supported values:

*LinkedIn*

`MESSAGE` — Standard direct message

`INVITATION` — Connection invitation

`INMAIL` — InMail message

`INMAIL_DECLINE` — InMail declined

`INMAIL_REPLY` — Reply to an InMail

`INMAIL_ACCEPT` — InMail accepted

*Instagram*

`STORY_MENTION` — The sender mentioned the account owner in their story

`STORY_REPLY` — The sender replied at one of the owner story

*WhatsApp*

`STORY_REPLY` — The sender replied at one of the owner story

## reactions

A list of reactions to the message.

| key        | value                                                          |
| :--------- | :------------------------------------------------------------- |
| value      | The reaction, 👍 for exemple                                   |
| sender\_id | The provider's user id of who reacted                          |
| is\_sender | Boolean telling if the reaction was sent by the connected user |

## quoted

Quoted message details if any.

*Note that some providers (ex:WhatsApp) use the term "reply" in their UI, but Unipile prefer to use the term "quote" to distinguish it from threaded replies.*