---
updatedAt: 2026-04-28T07:45:05.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# LinkedIn Guide

Learn how to implement a custom LinkedIn authentication form into your application.

> ❗️ If you are just starting your integration, we recommend exploring the [Hosted Auth ](https://developer.unipile.com/docs/hosted-auth) method, as it requires less time to integrate. Custom Auth can be implemented later as a second step.

# Step 1: Authenticate to LinkedIn

You have two options to initiate LinkedIn authentication

## With Username / Password

For this method, you'll need to provide the LinkedIn username and password for authentication. Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "username": "email@outlook.com",
  "password": "********"
}
'
```
```javascript
const response = await client.account.connectLinkedin({
  username: "email@outlook.fr",
  password: "********"
})
```

## With Cookies

This method uses existing LinkedIn access tokens, specifically the **li\_at** cookie and the  you can get when connected to LinkedIn in your browser. Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

We strongly recommend collecting the user agent from the browser where the cookie is obtained to prevent account disconnection

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "access_token": "***************************",
  "user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}
'
```
```javascript
const response = await client.account.connectLinkedin({
  access_token: "**************",
})
```

# Step 2 : Handle checkpoints

LinkedIn authentication may present checkpoints that the user needs to solve. Unipile's API can return the type of checkpoint, if any, along with a 202 status. You can detect these checkpoints in the response and display a screen or a new form.

In this case, a new ***Authentication Intent*** starts. **This intent last 5 minutes and checkpoints must be solved in this time frame**.

Here's an example of a checkpoint response, which include the type of checkpoint between `2FA`, `OTP`, `IN_APP_VALIDATION`, `CAPTCHA`, `PHONE_REGISTER`, but also the `account_id` which is required to identify the next request.

```json
{
  "object": "Checkpoint",
  "account_id": "098dez89d",
  "checkpoint": {
    "type": "2FA"
  }
}
```

# Step 3 : Solve checkpoints

## Solve 2FA and OTP

Some checkpoints require a user input, like `2FA` and `OTP` for linkedIn. To handle these checkpoints, make a POST request to the Unipile API using the [Solve checkpoint endpoint](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint) or use an SDK Method by giving the `account_id` returned by the first request

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts/checkpoint \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "account_id": "098dez89d",
  "code": "***"
}
'
```
```javascript
const response = await client.account.solveCodeCheckpoint({
  provider: "LINKEDIN",
  account_id: "fze98Vzev",
  code: "****",
});
```

The response of this request will indicate if the account is successfully connected, or if there is a new checkpoint to solve, the same way as before.

## Handle In-App Validation

The `IN_APP_VALIDATION` checkpoint require a confirmation of the connection in the user's LinkedIn mobile app. In this case, your application should listen for an account status update to detect the user's action. You have two options to achieve this:

### Option A: Long Request on GET Account Status

Make a [GET request ](https://developer.unipile.com/reference/accountscontroller_getaccountbyid)to the Unipile API to check the account's status. The request will only resolve when the account status changes to "OK," indicating a successful authentication. Implement a long polling mechanism in your application to handle this.

### Option B: Account Status Webhook

Alternatively, you can set up an Account Status Webhook to receive notifications when the account status changes. This webhook can be configured to listen for status changes and trigger actions in your application when the LinkedIn account connection is confirmed.

### Switch from In-App Validation to 2FA

If the user cannot approve the connection from the LinkedIn mobile app, you can ask LinkedIn to propose another checkpoint method by calling the [Solve checkpoint endpoint](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint) again with `code: "TRY_ANOTHER_WAY"`.

For LinkedIn native auth, this can be used to switch from `IN_APP_VALIDATION` to a code-based checkpoint such as `2FA`.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts/checkpoint \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "account_id": "098dez89d",
  "code": "TRY_ANOTHER_WAY"
}
'
```
```javascript
const response = await client.account.solveCodeCheckpoint({
  provider: "LINKEDIN",
  account_id: "fze98Vzev",
  code: "TRY_ANOTHER_WAY",
});
```

The response will either confirm the account creation, or return a new checkpoint to solve, typically a `2FA` or `OTP` checkpoint. You can then handle it with the same flow described in [Solve 2FA and OTP](#solve-2fa-and-otp).

## Phone register

You must provide a mobile phone number to receive a 2FA code. Use the route "Solve a code checkpoint" to do it. The code is a phone number, preceded by the international dialling code in brackets (e.g. (+33)0612345678 for France).

## Resend a checkpoint notification

If the user did not receive the notification or code yet, you can call the [Resend checkpoint notification endpoint](https://developer.unipile.com/reference/accountscontroller_resendcheckpoint) to trigger it again.

This route can be useful for `2FA`, `OTP`, or `IN_APP_VALIDATION` checkpoints on supported providers.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts/checkpoint/resend \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "account_id": "098dez89d"
}
'
```

If the resend succeeds, the API returns a `CheckpointResend` object:

```json
{
  "object": "CheckpointResend",
  "account_id": "098dez89d",
  "success": true
}
```

## Handle Captcha

In few case you can receive a "CAPTCHA" checkpoint that you will need to show to the end user to resolve. We can provide a library for this step for existing customers.

# Step 4 : Handle Intent Timeout

If the user takes more than 5 minutes to solve the checkpoint, the account will not be connected. Any subsequent request to solve a checkpoint outside a 5 minutes time frame will first respond a 408 - Request Timeout, then a 400 - Bad Request as the ***Authentication Intent*** will self destroy.

***

# Connect through a Proxy

On Step 1, you can either:

* pass a custom `proxy` object to use your own proxy,
* or pass a top-level `country` or `ip` field to use Unipile's default proxy system.

`country` and `ip` are part of the account connection payload itself, not fields inside the `proxy` object.

## Use your own proxy

Pass a `proxy` object to the request to connect a LinkedIn account through your own proxy.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "proxy": {
    "port": 1123,
    "host": "proxy.com",
    "username": "username",
    "password": "********"
  },
  "username": "email@outlook.com",
  "password": "**********"
}
'
```
```javascript
const response = await client.account.connectLinkedin({
  username: "email@outlook.fr",
  password: "********",
  proxy: {
    host: "proxy.com",
    port: 1123,
    username: "username",
    password: "*****",
  }
})
```

## Use Unipile's default proxy system

If you do not want to provide your own proxy server, you can let Unipile choose a default proxy for the session by passing either:

* `country`: an ISO 3166-1 alpha-2 country code, such as `FR` or `US`,
* `ip`: an IPv4 address used to infer the proxy location.

Example with `country`:

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "LINKEDIN",
  "country": "FR",
  "username": "email@outlook.com",
  "password": "**********"
}
'
```
```javascript
const response = await client.account.connectLinkedin({
  username: "email@outlook.fr",
  password: "********",
  country: "FR",
})
```

You can also pass `ip` instead of `country`:

```json
{
  "provider": "LINKEDIN",
  "ip": "203.0.113.10",
  "username": "email@outlook.com",
  "password": "**********"
}
```

In this case, **don't forget to handle the additional proxy related errors** you can find on the [API Reference](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint).

<br />

# Infinite login

To enable automatic reconnection for your users, the customer must configure 2FA in “Authenticator app” mode on their LinkedIn account. However, instead of using Google Authenticator (or any third-party authenticator), they will use your built-in TOTP code generator.

You must securely store:

the customer’s login credentials (username and password), and

the 2FA shared secret / setup key (used to generate TOTP codes).

When the account is disconnected, your backend initiates a new login using the stored credentials (custom authentication flow). If a 2FA checkpoint is triggered, you generate the required TOTP code from the stored secret and complete the login automatically, without any end-user action.