---
updatedAt: 2026-10-30T09:22:46.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Custom authentication

Learn how you can implement a custom authentication to connect accounts on your application.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram, IMAP**.*

Facebook Messenger is deprecated in v1 and available in [v2](https://developer.unipile.com/v2.0/docs/welcome). X/Twitter is deprecated in v1; support is coming soon in [v2](https://developer.unipile.com/v2.0/docs/welcome).

If you want to embed a custom authentication wizard/form in your application, Unipile provide API endpoints to let you implement all authentication steps and scenarios by yourself. This approach offers the freedom to build a unique and tailored authentication experience that aligns with your application's specific needs.

# Connect with UniLogin

UniLogin connects the LinkedIn or Instagram account already signed in to the user's browser. Your application informs the user before they enter the extension code, and access can be revoked from the UniLogin extension at any time. Your application receives an account ID, never browser session cookies.

From your backend, call `POST /api/v1/accounts` with your usual `X-API-KEY`:

```json
{
  "provider": "LINKEDIN",
  "unilogin": { "api_url": "https://apiXXX.unipile.com:XXX" }
}
```

Use the DSN of the instance receiving the request. For Instagram, use `"provider": "INSTAGRAM"`. The `unilogin` object selects this method, but `api_url` is required inside it: an empty object is not sufficient for Custom Auth. `publisher_name` is optional. Do not send credentials or cookies alongside it. Existing account options, including `disabled_features`, keep their usual format.

`track_last_visited_page` is also optional and `false` by default. When enabled inside `unilogin`, the account can expose the latest sanitized provider page as `connection_params.im.last_visited_page` (`url` and `visited_at`). The field is absent until a page is observed. The timestamp helps separate browser activity from API actions, while the URL can identify a profile or post for a subsequent API lookup.

The response is:

```json
{
  "object": "Checkpoint",
  "account_id": "<account_id>",
  "checkpoint": {
    "type": "UNILOGIN",
    "extension_code": "<code>"
  }
}
```

1. Show the code with a copy action. Ask the user to open UniLogin, click **Link a profile** and paste it.
2. Poll `GET /api/v1/accounts/{account_id}` from your backend every two seconds. Only a 404 titled **Account connection pending**, for this active attempt, means “keep waiting”.
3. A 200 `Account` response completes the flow with the same account ID. Stop on 409 (cancelled/declined) or 410 (expired); retry temporary 502/503 errors with backoff.

The attempt lasts ten minutes, like the existing LinkedIn/Instagram Custom Auth checkpoint window. No extra expiry parameter or timestamp is required; stop polling after that window even if the server is unavailable. The code goes into the extension, **not** `POST /api/v1/accounts/checkpoint`.

To reconnect, send the same body to `POST /api/v1/accounts/{account_id}`; the signed-in provider identity must match the existing account. `DELETE /api/v1/accounts/{account_id}` cancels a pending creation (or deletes an existing account normally). Never automatically repeat creation after a temporary error: continue polling the original ID.

# Provider guides

Follow our quickstart guides to learn how to implements all authentications scenarios.

* [LinkedIn Guide](https://developer.unipile.com/docs/linkedin)
* [WhatsApp Guide](https://developer.unipile.com/docs/whatsapp)
* [Instagram Guide](https://developer.unipile.com/docs/instagram)
* [Messenger Guide](https://developer.unipile.com/docs/messenger) (deprecated in v1; available in [v2](https://developer.unipile.com/v2.0/docs/welcome))
* [Telegram Guide](https://developer.unipile.com/docs/telegram)
* [X (Twitter) Guide](https://developer.unipile.com/docs/twitter-x-guide) (deprecated in v1; coming soon in [v2](https://developer.unipile.com/v2.0/docs/welcome); historical v1 reference)
* [IMAP Guide](https://developer.unipile.com/docs/imap-guide)