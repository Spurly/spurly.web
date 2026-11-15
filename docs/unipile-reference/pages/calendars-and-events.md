---
updatedAt: 2025-11-21T15:59:49.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Calendars & Events

Learn how to manage calendars & events of your connected accounts.

*Feature available for : **Google, Microsoft***

<Callout icon="📘" theme="info">
  Calendar permissions are not enabled by default on your Unipile account. You need to activate the relevant scopes in the Settings section of your dashboard and reconnect your account to grant these permissions before you can use these API requests..
</Callout>

# Get calendars

To get existing emails, use the [`GET`calendars](https://developer.unipile.com/reference/calendarscontroller_listcalendars#/) Method .

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/calendars?limit=10&account_id=5D586za6a-aAaasqXX \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'

```

*This method use [pagination](https://developer.unipile.com/docs/api-usage).*

# Get events

Unipile's API give you two options to retrieve events in your application

## In realtime with Webhooks

The recommended approach to listen for event in your application is by using a Webhook because they trigger in real time. Whenever the user account **create** or **update** a calendar event, the Webhook will call your specified URL with the given calendar event that you can store to be displayed.

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /events](https://developer.unipile.com/reference/calendarscontroller_listcalendareventsbycalendar#/) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated emails. In this case, implementing a unique ID verification on your history entry based on the event ID can help prevent duplicate entries.*

<br />

# Create and update events

You can create, update, delete or retrieve an event:

* [Create an event](https://developer.unipile.com/reference/calendarscontroller_createcalendarevent#/)
* [Update an event](https://developer.unipile.com/reference/calendarscontroller_editcalendarevent#/)
* [Delete an event](https://developer.unipile.com/reference/calendarscontroller_deletecalendarevent#/)
* [Retrieve an event](https://developer.unipile.com/reference/calendarscontroller_getcalendarevent#/)

<br />