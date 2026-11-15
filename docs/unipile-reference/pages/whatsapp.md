---
updatedAt: 2026-03-20T09:06:44.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# WhatsApp Guide

Learn how to implement a custom WhatsApp authentication form into your application.

# Step 1 : Start a WhatsApp authentication

You can start a WhatsApp custom authentication in two ways:

* with a QR code
* with a pairing code sent to a phone number

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the corresponding SDK method when available.

## Option A : QR Code

Use the default WhatsApp custom authentication flow to request a QR code that the user will scan from their phone.

```javascript
const { qrCodeString, code } = await client.account.connectWhatsapp();
```
```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "WHATSAPP"
}
'
```

## Option B : Pairing Code

If you want to connect the account with a phone number instead of a QR code, make the Custom authentication call with `pairing_phone_number`.

The phone number must be sent in international format, using E.164 digits only: country code followed by the number. Example: `33612345678`.

When `pairing_phone_number` is provided, Unipile returns a checkpoint containing the pairing code that the user must enter in the WhatsApp application on their phone.

```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "WHATSAPP",
  "pairing_phone_number": "33612345678"
}
'
```

# Step 2 : Display the authentication challenge

## If you use the QR code flow

Convert the textual QR code into a visual QR code with a suitable library, then display it to the user.

* PHP Library : <https://github.com/chillerlan/php-qrcode>
* JS Library : <https://github.com/soldair/node-qrcode>

## If you use the pairing code flow

Display the returned pairing code in your UI and ask the user to enter it on their phone in WhatsApp.

In most cases, WhatsApp opens a notification on the phone, or sends the user directly to the screen where the code can be entered.

# Step 3 : Listen for confirmation

After displaying the QR code or the pairing code, you need to listen for the user validation to know when the account is authenticated and connected to Unipile. You have 2 ways to achieve that.

## Option A : Polling Request on GET Account Status

In this option, you make a GET request to the Unipile API to check the account's status. The request will only resolve when the account is successfully connected. This method can be implemented using a polling mechanism in your application.

## Option B : Account Status Webhook

An alternative approach is to set up an Account Status Webhook. This webhook will notify your application when the account status changes. You can listen for these webhook events and proceed accordingly when the account is connected.