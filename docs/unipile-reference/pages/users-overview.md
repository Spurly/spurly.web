---
updatedAt: 2026-03-16T09:08:58.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Users overview

A user is a provider's user. They are the Attendees in chats.

# Identifiers

Users have 2 identifiers:

* A **Provider internal ID**, which is the ID used internally by the provider to identify the user and used in Unipile to reference attendees of resources. For exemple in [Message object](https://developer.unipile.com/docs/message-payload).
  * *Linkedin*   (regular user): Last part of the **internal** profile URL : linkedin.com/in/**ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ**
    *Each user has a multiple fixed provider ID for Classic, Recruiter and Sales Navigator, they start differently and you need to convert it with get profile route using the right "api" parameter for sending message in each product.:
    Sales Navigator: ACw\...
    Recruiter: AE...
    Classic: ACo...*(and since few time ADo...)
  * *Whatsapp* : 0000000000\@lid
  * *Instagram*: A sequence of numbers like 013456789 (You can get the Instagram provider’s internal ID from a username by using the `GET /users/{identifier}` route.)
  * *Telegram*: A sequence of numbers like 013456789 (You can get the Telegram provider’s internal ID from a username by using the `GET /users/{identifier}` route.)
  * *X - Twitter :*  A sequence of numbers like 013456789 (You can get the X provider’s internal ID from a username by using the `GET /users/{identifier}` route.)

* A **Provider public ID**, which is the public ID used by the users to share their profile. It can be found as:
  * *Linkedin*  (regular user) : Last part of the **public** profile URL : linkedin.com/in/**satyanadella**
  * *Linkedin* (company) : Last part of the **public** profile URL : linkedin.com/company/**microsoft**
  * *Whatsapp* : [33600000000@s.whatsapp.net](#)  *(The WhatsApp provider's internal ID is deterministic, its number + suffix @s.whatsapp.net. You can test if a number has WhatsApp by using the`GET /users/{identifier}` route.)*
  * *Instagram*: A username : unipile
  * *Telegram*: Phone number: 33600000000
  * *X - Twitter*: A username : @UnipileApp (with or without the @)

# Attendees

Since it's impossible to sync the millions of users of a provider, Unipile only sync "know users" that we call Attendees.

They have an additional identifier, a **Unipile ID**, which is a unique ID used in Unipile to reference attendees of resources, for exemple in Group Participants.

Unipile consider users as known (therefore as Attendees) if you have a relation with them (through contacts or chats) so you can easily retrieve them from those relational elements. Therefore, they are one of the following

* Contacts of the connected account (known as ***Relations*** in LinkedIn, known as ***Friends*** in Facebook)
* Public non-contacts with whom the connected account has an existing chat
* Public non-contacts who participate in the same groups as the connected account

# Unknown Users

Unknown are all the rest:

* Public non-contact without an existing chat
* Private users

They become known (therefore a synced Attendee) as soon as you start a chat with them.