---
updatedAt: 2026-09-02T09:46:59.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Email object

This section will explain in detail each field of the email object so you can properly integrate them in your application

## object

Fixed value "Email"

## id

Unique identifier of the email for Unipile.

Can be used to prevent duplicate entries.

## account\_id

Unique identifier of the parent account.

## date

Provider's server acknowledge datetime.

## from\_attendee

Information on the sender

### from\_attendee.display\_name

Name set by the sender

### from\_attendee.identifier

Email of the sender

### from\_attendee.identifier\_type

Fixed value "EMAIL\_ADDRESS

## to\_attendees

List of "to" recipients of email

### to\_attendees.display\_name

Name of recipient set by the sender

### to\_attendees.identifier

Email of the recipient

### to\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## cc\_attendees

List of "cc" recipients of email

### cc\_attendees.display\_name

Name of recipient set by the sender

### cc\_attendees.identifier

Email of the recipient

### cc\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## bcc\_attendees

List of "bcc" recipients of email

### bcc\_attendees.display\_name

Name of recipient set by the sender

### bcc\_attendees.identifier

Email of the recipient

### bcc\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## reply\_to\_attendees

List of "reply\_to" of email

### reply\_to\_attendees.display\_name

Name of recipient set by the sender

### reply\_to\_attendees.identifier

Email of the recipient

### reply\_to\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS"

## provider\_id

String of provider\_id value

## subject

Subject of the email.

## body

Content of the email.

## body\_plain

Text content of the email.

## has\_attachments

Boolean, true if have attachment

## attachments

List of attachments

### attachments.id

Unique identifier of the attachment

### attachments.name

Name of the attachment, including extension

### attachments.extension

Extension of the attachment

### attachments.size

Size of the attachment in bytes

### attachments.mime

Mime type of the attachment

## folders

Folders of the email

## role

Role of the folder of the email

## read\_date

Date of first API get email

## is\_complete

Status of email fetching

## headers

Headers of the email if requested

### headers.name

Name of the header

### headers.value

Value of the header