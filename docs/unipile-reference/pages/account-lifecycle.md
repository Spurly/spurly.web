---
updatedAt: 2026-10-30T09:27:26.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Account status updates

Learn how to handle account status.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram, Google, Microsoft, IMAP**.*

Unipile's Account Status Webhook is a powerful feature that allows you to monitor the life cycle of an account's status and take actions based on changes in the status. This Webhook provides real-time updates on the synchronization status of your accounts, and on the connection creation.

# Synchronization status

Here is an example payload for a synchronization request:

```json Json payload
{  
  "AccountStatus": {  
    "account_id": "h_EKCy2lRLef5NzHp0iw4A",  
    "account_type": "LINKEDIN",  
    "message": "CREDENTIALS"  
  }  
}
```

Here is the different Synchronization status that can be notified by the Webhook.

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Status
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        OK
      </td>

      <td>
        Everything seems to be in good order.

        When the account status is **not** `OK`:

        * You can still retrieve any data (chats, messages...) using GET Methods, **but this data is no more guaranteed to be up to date with the messaging provider**.
        * You will not receive anymore updates on new messages through Webhooks.
      </td>
    </tr>

    <tr>
      <td>
        ERROR /STOPPED
      </td>

      <td>
        Account synchronization has stopped due to an unexpected error during data fetching.
      </td>
    </tr>

    <tr>
      <td>
        CREDENTIALS
      </td>

      <td>
        Synchronization of accounts has been interrupted due to invalid or missing credentials required for retrieving new data. This situation may arise in several scenarios, including, but not limited to:

        **IMAP:**:

        * User updates their provider's password.

        **Email (Google/Microsoft) :**

        * User revokes your application's authorization from their account center

        * Admin of user revoke permissions of App or current tokens for security reason

        * User change his credentials and check option to revoke current token

        * Account not exist anymore or email configured changed

        * OAuth keys changed in your  settings

        * Not enough scopes checked by enduser

        **WhatsApp/Telegram:**

        * Users terminating the session via the app settings

        * Excessive requests to sensitive endpoints (such as fetching profiles or sending message without good answer rate or high report by user) can cause temporary of definitive restriction

        * Phone have no network for long period

        **Instagram**

        * Instagram ask for security checkpoint you need to validate on UI and reconnect

        * The session expiration after one year

        * Users terminating the session via the preference settings

        * User change his credentials and check option to revoke current token

        * Excessive, repetitive, or non-randomized requests to sensitive endpoints (such as fetching profiles or list of relations every day at same hour, check [this page](https://developer.unipile.com/docs/provider-limits-and-restrictions)   to view recommendations) may trigger automation warnings and result in the account being disconnected.

        * Your proxy is too slow or down for extended period

        **LinkedIn:**

        * The session expiration after one year

        * Users terminating the session via the preference settings

        * User change his credentials and check option to revoke current token or activate 2FA

        * Excessive, repetitive, or non-randomized requests to sensitive endpoints (such as fetching profiles or list of relations every day at same hour, check [this page](https://developer.unipile.com/docs/provider-limits-and-restrictions)   to view recommendations) may trigger automation warnings and result in the account being disconnected.

        * Too many request with with reject code (invalid_attendee, insufficient_credit..) (you need to handle error code and stop/adapt sequence)

        * Users may be prompted to select a session (Only with Recruiter account connected with "Credentials, use "Cookies" method to bypass)

        * When connected with "Cookies" : User logs out in their browser (for example to switch account).

        * When connected with "Cookies" and  "Custom Auth": Providing an incorrect user agent, you need to provide 'user_agent' field, LinkedIn account of user will be disconnected quickly  in his browser of user too.

        * When connected with "Cookies" and  "Hosted Auth": Collecting cookie in another browser of paste cookie from another user, LinkedIn account of user will be disconnected quickly  in browser of user too.

        * Your proxy is too slow or down for extended period
      </td>
    </tr>

    <tr>
      <td>
        CONNECTING
      </td>

      <td>
        The account is attempting to connect. If your credentials are correct, it may be because the provider is temporarily down, your proxy or a synchronization catch-up. It's temporary status.
      </td>
    </tr>

    <tr>
      <td>
        DELETED
      </td>

      <td>
        You deleted the account
      </td>
    </tr>

    <tr>
      <td>
        CREATION_SUCCESS
      </td>

      <td>
        The account was successfully added and the initial data synchronization has begun. CREATION_SUCCESS can be notified by the Webhook and/or "notify_url" in hosted auth (not with same format). Account can take few seconds to be able to perform requests, you can wait for "OK" status to be sure all is ready.
      </td>
    </tr>

    <tr>
      <td>
        RECONNECTED
      </td>

      <td>
        Account has been reconnected with success. Can be notified by the Webhook and/or "notify_url" in hosted auth (not with same format).
      </td>
    </tr>

    <tr>
      <td>
        SYNC_SUCCESS
      </td>

      <td>
        Only for LinkedIn/IMAP/WhatsApp/Instagram/Telegram  | The account (re)synchronization is finished. For LinkedIn accounts with a premium option (Recruiter or Sales Navigator), you will receive two payloads: one for Classic and another for the premium option. These can be identified under "product".
      </td>
    </tr>
  </tbody>
</Table>