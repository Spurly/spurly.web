---
updatedAt: 2026-10-30T15:32:56.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Messenger Guide

Facebook Messenger is deprecated in v1 and available in v2. This guide is retained for historical v1 reference.

> ⚠️ Facebook Messenger is deprecated in v1 and available in [v2](https://developer.unipile.com/v2.0/docs/welcome).

The v1 connection steps below are retained for historical reference.

# Step 1: Authenticate to Messenger

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```javascript
const response = await client.account.connectMessenger({
  username: "unipile",
  password: "********"
})
```
```php
todo
```
```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "MESSENGER",
  "username": "unipile",
  "password": "********"
}
'
```

# Step 2 : Handle 2FA checkpoint

If an Messenger account has the two-factor authentication activated, you will encounter a checkpoint through a 202 status. Here’s an example of a checkpoint response.

```json
{
  "object": "Checkpoint",
  "account_id": "098dez89d",
  "checkpoint": {
    "type": "2FA"
  }
}
```

In this case, a new ***Authentication Intent*** starts. \*\*This intent last 5 minutes and checkpoints must be solved in

# Step 3 : Solve 2FA checkpoint

To solve the 2FA checkpoint, make a POST request to the Unipile API using the [Solve checkpoint endpoint](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint) or use an SDK Method by giving the `account_id` returned by the first request

```javascript
const response = await client.account.solveCodeCheckpoint({
  provider: "MESSENGER",
  account_id: "098dez89d",
  code: "******",
});
```
```php
todo
```
```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts/checkpoint \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "MESSENGER",
  "account_id": "098dez89d",
  "code": "******"
}
'
```

If you want to connect to Messenger via your application, the 2FA checkpoint will be encountered. Simply enter " **in\_app\_validation** " in code parameter and validate the connection on your device.

The response of this request will indicate if the account is successfully connected.

# Step 4 : Handle Intent Timeout

If the user takes more than 5 minutes to solve the checkpoint, the account will not be connected. Any subsequent request to solve a checkpoint outside a 5 minutes time frame will first respond a 408 - Request Timeout, then a 400 - Bad Request as the ***Authentication Intent*** will self destroy.