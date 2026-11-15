---
updatedAt: 2026-03-31T16:15:43.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Detecting Accepted Invitations

Learn how to identify when a user accepts your LinkedIn invitation, enabling you to initiate subsequent actions.

You can  monitor acceptance through 3 methods:

## Webhook: "New relation"

We provide a webhook to track new connections, including accepted invitations (with or without a note) and users accepted via linked accounts.

Please note that this webhook is not real-time, as LinkedIn does not support real-time events for this action. We poll the relation list at random intervals to avoid any suspicious activity. As a result, the webhook event may be triggered up to 8 hours after the connection is accepted.

You can create this webhook using the API. The webhook is called "USERS WEBHOOK", and the event type is "new\_relation" (included by default in the USERS webhook): [Create Webhook](https://developer.unipile.com/reference/webhookscontroller_createwebhook)

```curl Create webhook
curl --request POST \
  --url https://apiX.unipile.com:XXXX/api/v1/webhooks \
  --header 'Content-Type: application/json' \
  --header 'X-API-KEY: XXXXX' \
  --data '{
  "source": "users",
  "request_url": "https://yourendpoint",
  "name": "New relation",
	"headers": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ]
}'
```

```json Payload when new relation trigger
{
  "event":"new_relation",
  "account_id":"SDF4tGaPSPSzNe1D1xsOs",
  "account_type":"LINKEDIN",
  "webhook_name":"",
  "user_full_name":"Satya Nadella",
  "user_provider_id":"ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
  "user_public_identifier":"satyanadella",
  "user_profile_url":"https://www.linkedin.com/in/satyanadella/",
  "user_picture_url":"https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1579726625423?e=1775088000&v=beta&t=Ke9Wy1fa4eAgmuIdSmUPQg85GN-VoyFApO_SsW5cE5I"
}
```

## Real-Time Method: Applicable for Invitations who includes notes only

If your invitation includes a message, accepting the invitation generates a new chat containing only your invitation message. Leverage the ['new message' webhook ](https://developer.unipile.com/docs/new-messages-webhook)to detect this event.  It's beneficial to maintain a record of your sent invitations for effective comparison of chat recipient. Alternatively you can test that you are the message sender and that it is the initial message in the chat to infer an accepted invitation.

*One specific case to consider is that the recipient may reply to the invitation without accepting it. In that case, the chat will still be created. You can use Retrieve Profile to verify the relation level.*

## Periodic Check Method: For Invitations Without Text or Alternative Approach

You can use the [list of your relations](https://developer.unipile.com/reference/userscontroller_getrelations), sorted by the most recently added. Regularly comparing this list against your sent invitations can help identify new connections, suggesting that your invitation was accepted.

Alternatively, we provides a [list of sent invitations](https://developer.unipile.com/reference/userscontroller_listalluserinvitationssent). By periodically reviewing this list, you can detect which invitations are no longer pending, indicating acceptance or rejection. You can verify relation with someone with route retrieve a profile. However, if you have many pending invitations, this could result in a large number of API calls.

It's crucial to maintain a record of your sent invitations for effective comparison.\
**To avoid overwhelming LinkedIn's limits or automation detection, it's recommended to space out these checks only few times by day with random delay, not at fixed time.**

By integrating these strategies, you can effectively detect when your LinkedIn invitations are accepted, paving the way for prompt and appropriate follow-up actions.