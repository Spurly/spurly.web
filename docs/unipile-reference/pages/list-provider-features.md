---
updatedAt: 2026-10-02T08:37:05.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# List of provider features

# List of Provider Features

## Messaging

| Feature                                                                                                | WhatsApp | LinkedIn | Instagram | Telegram |
| ------------------------------------------------------------------------------------------------------ | -------- | -------- | --------- | -------- |
| **Account connection**                                                                                 |          |          |           |          |
| [Hosted Auth](https://developer.unipile.com/docs/hosted-auth)                                          | 🟢       | 🟢       | 🟢        | 🟢       |
| [Custom Auth](https://developer.unipile.com/docs/native-auth)                                          | 🟢       | 🟢       | 🟢        | 🟢       |
| **Messages**                                                                                           |          |          |           |          |
| [Send Messages](https://developer.unipile.com/docs/send-messages)                                      | 🟢       | 🟢       | 🟢        | 🟢       |
| [Reply Messages](https://developer.unipile.com/reference/chatscontroller_sendmessageinchat)            | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Message](https://developer.unipile.com/docs/get-messages)                                        | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Chats](https://developer.unipile.com/reference/chatscontroller_listallchats)                     | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Attendees](https://developer.unipile.com/reference/chatattendeescontroller_listallattendees)     | 🟢       | 🟢       | 🟢        | 🟢       |
| [Sync History](https://developer.unipile.com/reference/chatscontroller_syncchathistory)                | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Reactions](https://developer.unipile.com/edit/message-payload)                                   | 🟢       | 🟢       | 🟢        | 🟢       |
| [Read receipts](https://developer.unipile.com/edit/message-payload)                                    | 🟢       | 🟢       | 🟢        | 🟢       |
| **Attachments**                                                                                        |          |          |           |          |
| [Send Files attachments](https://developer.unipile.com/reference/chatscontroller_startnewchat)         | 🟢       | 🟢       | 🟢        | 🟢       |
| [Receive Files attachments](https://developer.unipile.com/reference/messagescontroller_getattachment)  | 🟢       | 🟢       | 🟢        | 🟢       |
| [Send voice notes](https://developer.unipile.com/reference/chatscontroller_startnewchat)               | 🟢       | 🟢       | 🟢        | 🟢       |
| [Send embed video](https://developer.unipile.com/reference/chatscontroller_startnewchat)               | 🟢       | 🟢       |           |          |
| **Profiles**                                                                                           |          |          |           |          |
| [Retrieve Users Profiles](https://developer.unipile.com/docs/retrieving-users)                         | 🟢       | 🟢       | 🟢        | 🟢       |
| [Retrieve Own Profile](https://developer.unipile.com/reference/userscontroller_getaccountownerprofile) | 🟢       | 🟢       | 🟢        | 🔴       |
| [Is number on ?](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier)       | 🟢       |          |           | 🟢       |
| **Webhooks**                                                                                           |          |          |           |          |
| [Account status](https://developer.unipile.com/docs/account-lifecycle)                                 | 🟢       | 🟢       | 🟢        | 🟢       |
| [New message](https://developer.unipile.com/docs/new-messages-webhook)                                 | 🟢       | 🟢       | 🟢        | 🟢       |
| [New reaction / read / event](https://developer.unipile.com/docs/new-messages-webhook)                 | 🟢       | 🟢       | 🟢        | 🟢       |

## LinkedIn/Instagram Specific

| Feature                                                                                                                                                                               | LinkedIn | Instagram |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| **Outreach**                                                                                                                                                                          |          |           |
| [Invite Users](https://developer.unipile.com/docs/invite-users)                                                                                                                       | 🟢       | 🟢        |
| [Send InMail](https://developer.unipile.com/docs/send-messages#linkedin-specific-use-cases)                                                                                           | 🟢       |           |
| [Retrieve InMail credit](https://developer.unipile.com/reference/linkedincontroller_getinmailbalance)                                                                                 | 🟢       |           |
| [Create an Outreach Sequence](https://developer.unipile.com/docs/how-to-create-outreach-sequence)                                                                                     | 🟢       |           |
| [List Pending Invitation](https://developer.unipile.com/reference/userscontroller_listalluserinvitationssent)                                                                         | 🟢       |           |
| [Delete Pending Invitation](https://developer.unipile.com/reference/userscontroller_cancelinvitation)                                                                                 | 🟢       | 🟢        |
| [Detecting Accepted Invitations](https://developer.unipile.com/docs/detecting-accepted-invitations)                                                                                   | 🟢       |           |
| [Following someone](https://developer.unipile.com/docs/get-raw-data-example#following-someone)                                                                                        | 🟢       | 🟢        |
| [List/Accept/Decline incoming invitation](https://developer.unipile.com/reference/userscontroller_listalluserinvitationsreceived)                                                     | 🟢       |           |
| [Endorse Skills](https://developer.unipile.com/reference/linkedincontroller_endorseprofile)                                                                                           | 🟢       |           |
| **Posts & Comment**                                                                                                                                                                   |          |           |
| [List Posts of Users and Companies](https://developer.unipile.com/reference/userscontroller_listallposts)                                                                             | 🟢       | 🟢        |
| [Add reaction on a post or comment](https://developer.unipile.com/reference/postscontroller_addpostreaction)                                                                          | 🟢       | 🟢        |
| [Send Comments](https://developer.unipile.com/reference/postscontroller_sendcomment)                                                                                                  | 🟢       | 🟢        |
| [List Posts Comments](https://developer.unipile.com/reference/postscontroller_listallcomments)                                                                                        | 🟢       | 🟢        |
| [List Posts Reactions](https://developer.unipile.com/reference/postscontroller_listallreactions)                                                                                      | 🟢       | 🟢        |
| [Create a post](https://developer.unipile.com/reference/postscontroller_createpost)                                                                                                   | 🟢       | 🟢        |
| [Retrieve a post](https://developer.unipile.com/reference/postscontroller_getpost)                                                                                                    | 🟢       | 🟢        |
| **Profiles**                                                                                                                                                                          |          |           |
| [Visit and Retrieve Users Profiles](https://developer.unipile.com/docs/retrieving-users)                                                                                              | 🟢       | 🟢        |
| [List of Contacts/Relations](https://developer.unipile.com/reference/userscontroller_getrelations)                                                                                    | 🟢       |           |
| [List of Followers](https://developer.unipile.com/reference/userscontroller_getfollowers)                                                                                             |          | 🟢        |
| [List of Followed accounts](https://developer.unipile.com/reference/userscontroller_getfollowing)                                                                                     |          | 🟢        |
| [Companies Profiles](https://developer.unipile.com/reference/linkedincontroller_getcompanyprofile)                                                                                    | 🟢       |           |
| [Get own profile viewers](https://developer.unipile.com/docs/get-raw-data-example#get-own-profile-viewers)                                                                            | 🟢       |           |
| **Job Posting**                                                                                                                                                                       |          |           |
| [Create Job](https://developer.unipile.com/reference/linkedincontroller_createjobposting) and [Publish](https://developer.unipile.com/reference/linkedincontroller_publishjobposting) | 🟢       |           |
| [List Jobs](https://developer.unipile.com/reference/linkedincontroller_getjobpostings)                                                                                                | 🟢       |           |
| [Retrieve applicants](https://developer.unipile.com/reference/linkedincontroller_getjobapplicants)                                                                                    | 🟢       |           |
| [Get Resume of Applicants](https://developer.unipile.com/reference/linkedincontroller_getjobapplicantresume)                                                                          | 🟢       |           |
| **Inboxes** ([Send](https://developer.unipile.com/docs/send-messages) and [Receive](https://developer.unipile.com/docs/get-messages) in real-time)                                    |          |           |
| Classic                                                                                                                                                                               | 🟢       | 🟢        |
| Sales Navigator                                                                                                                                                                       | 🟢       |           |
| Recruiter & Recruiter Lite                                                                                                                                                            | 🟢       |           |
| Company Page                                                                                                                                                                          | 🟢       |           |
| **[Search by URL or parameters](https://developer.unipile.com/docs/linkedin-search)**                                                                                                 |          |           |
| People (Classic / Recruiter / Sales Navigator)                                                                                                                                        | 🟢       | 🟠        |
| Companies (Classic Sales Navigator)                                                                                                                                                   | 🟢       |           |
| Posts (Classic)                                                                                                                                                                       | 🟢       | 🟠        |
| Jobs (Classic)                                                                                                                                                                        | 🟢       |           |

## Email

| Feature                                                                                    | Google | Microsoft | IMAP |
| ------------------------------------------------------------------------------------------ | ------ | --------- | ---- |
| **Account connection**                                                                     |        |           |      |
| [Hosted Auth](https://developer.unipile.com/docs/hosted-auth)                              | 🟢     | 🟢        | 🟢   |
| [Custom Auth](https://developer.unipile.com/docs/native-auth)                              | 🟢     | 🟢        | 🟢   |
| [OAuth](https://developer.unipile.com/docs/emails)                                         | 🟢     | 🟢        |      |
| [Credentials](https://developer.unipile.com/docs/emails)                                   |        |           | 🟢   |
| **Send/Receive**                                                                           |        |           |      |
| [Send/Reply Email](https://developer.unipile.com/docs/send-email)                          | 🟢     | 🟢        | 🟢   |
| [List Emails](https://developer.unipile.com/docs/retrieving-emails)                        | 🟢     | 🟢        | 🟢   |
| [Create Email Draft](https://developer.unipile.com/reference/draftscontroller_createdraft) | 🟢     | 🟢        | 🟢   |
| **Organize**                                                                               |        |           |      |
| [Delete Email](https://developer.unipile.com/reference/mailscontroller_deletemail)         | 🟢     | 🟢        | 🟢   |
| [Move Email](https://developer.unipile.com/reference/mailscontroller_updatemail)           | 🟢     | 🟢        | 🟢   |
| [List Folders](https://developer.unipile.com/reference/folderscontroller_listfolders)      | 🟢     | 🟢        | 🟢   |
| [Get Folder](https://developer.unipile.com/reference/folderscontroller_getfolder)          | 🟢     | 🟢        | 🟢   |
| **Webhooks**                                                                               |        |           |      |
| [New Email](https://developer.unipile.com/docs/new-emails-webhook)                         | 🟢     | 🟢        | 🟢   |
| [Open and click tracking](https://developer.unipile.com/docs/tracking-email)               | 🟢     | 🟢        | 🟢   |

## Calendar

| Feature                                                                                                         | Google | Microsoft |
| --------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| **Calendars**                                                                                                   |        |           |
| [List Calendars](https://developer.unipile.com/reference/calendarscontroller_listcalendars)                     | 🟢     | 🟢        |
| [Get Calendar](https://developer.unipile.com/reference/calendarscontroller_getcalendar)                         | 🟢     | 🟢        |
| **Events**                                                                                                      |        |           |
| [Retrieve all events](https://developer.unipile.com/reference/calendarscontroller_listcalendareventsbycalendar) | 🟢     | 🟢        |
| [Create an event](https://developer.unipile.com/reference/calendarscontroller_createcalendarevent)              | 🟢     | 🟢        |
| [Retrieve an event](https://developer.unipile.com/reference/calendarscontroller_getcalendarevent)               | 🟢     | 🟢        |
| [Edit an event](https://developer.unipile.com/reference/calendarscontroller_editcalendarevent)                  | 🟢     | 🟢        |
| [Delete an event](https://developer.unipile.com/reference/calendarscontroller_deletecalendarevent)              | 🟢     | 🟢        |