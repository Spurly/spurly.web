---
updatedAt: 2025-08-31T19:05:38.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Telegram Guide

Learn how to implement a custom Telegram authentication form into your application.

# Step 1 : Request a QR Code

To begin, you must request a QR code that users will scan to authenticate their Telegram account. Make a POST request to the Unipile API or use the corresponding SDK method.

```javascript
const { qrCodeString, code } = await client.account.connectTelegram();
```
```php
TODO
```
```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "TELEGRAM"
}
'

```

# Step 2 : Display the QR Code

Upon receiving the QR code data, you'll need to convert the textual QR code into a visual representation using a suitable library. This visual QR code should then be displayed to the user.

* PHP Library : <https://github.com/chillerlan/php-qrcode>
* JS Library : <https://github.com/soldair/node-qrcode>

# Step 3 : Listen for scan

After displaying the QR code, you need to listen for the user's scan, which indicates that the account is authenticated and connected to Unipile. You have 2 ways to achieve that.

## Option A : Long Request on GET Account Status

In this option, you make a GET request to the Unipile API to check the account's status. The request will only resolve when the account status changes to "connected," indicating a successful authentication. This method can be implemented using a long polling mechanism in your application.

## Option B : Account Status Webhook

An alternative approach is to set up an Account Status Webhook. This webhook will notify your application when the account status changes. You can listen for these webhook events and proceed accordingly when the status changes to "connected."