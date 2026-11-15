---
updatedAt: 2026-01-16T17:03:46.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Calendar webhook

Unipile can notify your server in real time when a calendar event is created, updated, or deleted.  Calendar webhooks allow you to synchronize events, trigger automation workflows, or maintain a local cache of calendar data without polling.

# Available events

* calendar\_event\_created	->  A calendar event is created
* calendar\_event\_updated	 -> A calendar event is updated
* calendar\_event\_deleted	 -> A calendar event is deleted

<br />

# Create a calendar webhook

cURL

```json
curl --request POST \
     --url https://<YOUR_DSN>/api/v1/webhooks \
     --header 'X-API-KEY: <YOUR_API_KEY>' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "source": "calendar_event",
  "events": [
    "calendar_event_created",
    "calendar_event_updated",
    "calendar_event_deleted"
  ],
  "request_url": "https://webhook.site/53e1cfca-35e7-4fd6-8790-78e03d03daaa",
  "name": "CALENDAR_EVENTS_WEBHOOK"
}
'

```

✅ request\_url must be a public HTTPS endpoint able to receive POST requests.

<br />

<br />

# Webhook payloads

All calendar webhook payloads include at least:

* event: the event type
* webhook\_name
* account\_id
* calendar\_id (calendar owner email/identifier)
* id (calendar event id)

<br />

# Payload: calendar\_event\_created

```json
{
  "event": "calendar_event_created",
  "webhook_name": "CALENDAR_EVENTS_WEBHOOK",
  "account_id": "a4qFy0liRAGo-oZ2YFpirQ",
  "id": "5m8lnvb64dt2uuaq99k4685eeq",
  "master_event_id": "",
  "calendar_id": "xxxxxxxxxn@gmail.com",
  "created_at": "2026-01-16T16:14:01.000Z",
  "updated_at": "2026-01-16T16:14:02.021Z",
  "title": "Meeting with customer",
  "is_cancelled": false,
  "is_all_day": false,
  "is_attendees_list_hidden": false,
  "attendees": [],
  "start": {
    "date_time": "2026-01-20T14:30:00+01:00",
    "time_zone": "Europe/Paris"
  },
  "end": {
    "date_time": "2026-01-20T15:30:00+01:00",
    "time_zone": "Europe/Paris"
  },
  "organizer": {
    "email": "pierre.nice.sun@gmail.com",
    "display_name": ""
  },
  "visibility": "private",
  "transparency": "transparent",
  "event_type": "default",
  "color": "#039BE5"
}

```

# Payload: calendar\_event\_updated

```json
{
  "event": "calendar_event_updated",
  "webhook_name": "CALENDAR_EVENTS_WEBHOOK",
  "account_id": "a4qFy0liRAGo-oZ2YFpirQ",
  "id": "5m8lnvb64dt2uuaq99k4685eeq",
  "master_event_id": "",
  "calendar_id": "xxxxxxxxxxx@gmail.com",
  "created_at": "2026-01-16T16:14:01.000Z",
  "updated_at": "2026-01-16T16:15:41.115Z",
  "title": "Meeting with customer",
  "body": "Important",
  "location": "Meets",
  "is_cancelled": false,
  "is_all_day": false,
  "is_attendees_list_hidden": false,
  "attendees": [],
  "start": {
    "date_time": "2026-01-20T14:30:00+01:00",
    "time_zone": "Europe/Paris"
  },
  "end": {
    "date_time": "2026-01-20T15:30:00+01:00",
    "time_zone": "Europe/Paris"
  },
  "organizer": {
    "email": "pierre.nice.sun@gmail.com",
    "display_name": ""
  },
  "visibility": "private",
  "transparency": "transparent",
  "event_type": "default",
  "color": "#039BE5"
}

```

<br />

# Payload: calendar\_event\_deleted

```json
{
  "event": "calendar_event_deleted",
  "webhook_name": "CALENDAR_EVENTS_WEBHOOK",
  "account_id": "a4qFy0liRAGo-oZ2YFpirQ",
  "id": "5m8lnvb64dt2uuaq99k4685eeq",
  "calendar_id": "xxxxxxxxxxx@gmail.com"
}

```

<br />

# Common fields

| Field          | Type   | Description                                    |
| -------------- | ------ | ---------------------------------------------- |
| `event`        | string | Webhook event name                             |
| `webhook_name` | string | Name given when creating the webhook           |
| `account_id`   | string | Unipile account id                             |
| `calendar_id`  | string | Calendar identifier (often the calendar email) |
| `id`           | string | Calendar event id                              |

<br />

# Event-specific fields

These fields may be present depending on the event type:

| Field                      | Type    | Notes                                                        |
| -------------------------- | ------- | ------------------------------------------------------------ |
| `title`                    | string  | Event title                                                  |
| `body`                     | string  | Event description                                            |
| `location`                 | string  | Event location                                               |
| `is_cancelled`             | boolean | Event cancellation status                                    |
| `is_all_day`               | boolean | `true` if all-day event                                      |
| `is_attendees_list_hidden` | boolean | Attendee list visibility                                     |
| `attendees`                | array   | List of attendees                                            |
| `start.date_time`          | string  | Start datetime with offset                                   |
| `start.time_zone`          | string  | Start timezone                                               |
| `end.date_time`            | string  | End datetime with offset                                     |
| `end.time_zone`            | string  | End timezone                                                 |
| `organizer.email`          | string  | Organizer email                                              |
| `recurrence`               | string  | Recurrence rules (RRULE). Present only for recurring events. |
| `organizer.display_name`   | string  | Organizer display name                                       |
| `visibility`               | string  | `private`, etc.                                              |
| `transparency`             | string  | `opaque` or `transparent`                                    |
| `event_type`               | string  | `default`, etc.                                              |
| `color`                    | string  | Event color (hex)                                            |
| `created_at`               | string  | ISO timestamp                                                |
| `updated_at`               | string  | ISO timestamp                                                |
| `master_event_id`          | string  | Present in payload but often empty (provider-dependent).     |

<br />

# Best practices

✅ Always respond quickly with HTTP 2xx (within a few seconds).

✅ Process the payload asynchronously (queue).

<br />