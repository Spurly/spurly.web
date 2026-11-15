---
updatedAt: 2026-08-20T08:50:41.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Send Email

Learn how to send messages with Unipile

*Feature available for :****Google, Microsoft, IMAP***

# Send an email

Use the [`POST emails`](https://developer.unipile.com/reference/mailscontroller_sendmail) Method or use the appropriate SDK Method, to send an email to every recipient.

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Hello from Unipile' \
  --form 'body=Hello, this is a test email from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'cc=[
	{
		"display_name": "Jane Doe",
		"identifier": "jane.doe@gmail.com"
	}
]' \
```
```javascript
const email: SendEmailInput = {
  account_id: "kzAxdybMQ7ipVxK1U6kwZw",
  to: [
    {
      display_name: "John Doe",
      identifier: "john.doe@gmail.com",
    },
  ],
  cc: [
    {
      display_name: "Jane Doe",
      identifier: "jane.doe@gmail.com",
    },
  ],
  subject: "Hello from Unipile",
  body: "Hello, this is a test email from Unipile",
}

await client.email.send(email)
```

***

# Send attachments

You can provide an additional attachment to the request body to send attachments along your email.

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Hello from Unipile' \
  --form 'body=Hello, this is a test email from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'attachments=@C:\Documents\cute_dog.png'
```
```javascript
const filePath = "C:\\Documents\\cute_dog.png";
const buffer = await fs.promises.readFile(filePath);

const attachment: [string, Buffer] = [ path.basename(filePath), buffer ];

const email: SendEmailInput = {
  account_id: "kzAxdybMQ7ipVxK1U6kwZw",
  to: [
    {
      display_name: "John Doe",
      identifier: "john.doe@gmail.com",
    },
  ],
  subject: "Hello from Unipile",
  body: "Hello, this is a test email from Unipile",
  attachments: [ attachment ],
}

await client.email.send(email)
```

***

# Send with custom headers

You can set additional custom headers using the "X-" syntax.

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Hello from Unipile' \
  --form 'body=Hello, this is a test email from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'cc=[
	{
		"display_name": "Jane Doe",
		"identifier": "jane.doe@gmail.com"
	}
]' \
  --form 'custom_headers=[
    {
      "name": "X-My-Custom-Header",
      "value": "Example value"
    }]'
```
```javascript
const email: SendEmailInput = {
  account_id: "kzAxdybMQ7ipVxK1U6kwZw",
  to: [
    {
      display_name: "John Doe",
      identifier: "john.doe@gmail.com",
    },
  ],
  cc: [
    {
      display_name: "Jane Doe",
      identifier: "jane.doe@gmail.com",
    },
  ],
  subject: "Hello from Unipile",
  body: "Hello, this is a test email from Unipile",
  custom_headers: [
    {
      name: "X-My-Custom-Header",
      value: "Example value",
    }
  ]
}

await client.email.send(email)
```

# Reply to an email

You can set additional parameter "reply\_to" with the provider\_id of an email.

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Re: Hello from Unipile' \
  --form 'body=Hello, this is a test reply from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'reply_to=X4R9___qXQKIu80oAF0lJA
```

When replying to an email you can either reply with the exact same subject or add one of the following **prefixes followed by a space**<br />'Re:', 'Re :', 'RE:', 'RE :', 're:', 're :'

# Personalize "from"

You can set additional parameter "from" with your display name and/or alias configured on your provider.

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Hello from Unipile' \
  --form 'body=Hello, this is a test email from Unipile' \
   --form 'from={
		"display_name": "Jake Doe",
		"identifier": "myalias.doe@gmycompany.com"
	}' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'cc=[
	{
		"display_name": "Jane Doe",
		"identifier": "jane.doe@gmail.com"
	}
]' \
```

# Tracking options

You can receive a webhook when an email is read or a link is clicked.

```curl cURL Multipart
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id=kzAxdybMQ7ipVxK1U6kwZw \
  --form 'subject=Hello from Unipile' \
  --form 'body=Hello, this is a test email from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'cc=[
	{
		"display_name": "Jane Doe",
		"identifier": "jane.doe@gmail.com"
	}
]' \
  --form 'tracking_options={
  "opens": true,
	"links": true,
	"label": "myownid"
}'

```
```curl cURL JSON
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: application/json' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --data '{
"account_id":"5TRZCFA_RderzjtqjprbqQ",
"subject":"Hello from JSON",
"body":"Hello, this is a test email from Unipile <a href=\"unipile.com\">test</a>",
"to": [
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
],
"tracking_options": {
  "opens": true,
	"links": true,
	"label": "myownid"}
}'

```
```javascript SDK Node JS
const email: SendEmailInput = {
  account_id: "kzAxdybMQ7ipVxK1U6kwZw",
  to: [
    {
      display_name: "John Doe",
      identifier: "john.doe@gmail.com",
    },
  ],
  cc: [
    {
      display_name: "Jane Doe",
      identifier: "jane.doe@gmail.com",
    },
  ],
  subject: "Hello from Unipile",
  body: "Hello, this is a test email from Unipile",
  tracking_options: {
    "opens": "true",
    "links": "true",
    "label": "myownid"
  }
}

await client.email.send(email)
```

# Send a plain text email

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/emails \
  --header 'Content-Type: multipart/form-data' \
  --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
  --form account_id={YOUR_ACCOUNT_ID} \
  --form 'subject=Hello from Unipile' \
  --form-string $'body=Hello,\n\nthis is a plain text email from Unipile' \
  --form 'to=[
	{
		"display_name": "John Doe",
		"identifier": "john.doe@gmail.com"
	}
]' \
  --form 'cc=[
	{
		"display_name": "Jane Doe",
		"identifier": "jane.doe@gmail.com"
	}
]' \
  --form-string 'custom_headers=[{"name": "Content-Type", "value": "text/plain; charset=utf-8"}]'
```
```javascript
const email: SendEmailInput = {
  account_id: "kzAxdybMQ7ipVxK1U6kwZw",
  to: [
    {
      display_name: "John Doe",
      identifier: "john.doe@gmail.com",
    },
  ],
  cc: [
    {
      display_name: "Jane Doe",
      identifier: "jane.doe@gmail.com",
    },
  ],
  subject: "Hello from Unipile",
  body: "Hello, \n\n this is a test email from Unipile",
  custom_headers: [
    {
      name: "Content-Type",
      value: "text/plain; charset=utf-8"
    }
  ]
}

await client.email.send(email)
```

## Idempotent email sending.&#x20;

POST /emails now supports an optional Idempotency-Key header to reduce duplicate email sends when retrying requests after a timeout or lost connection.<br /><br />e.g. :<br />`Idempotency-Key: 4b0e1b45-f8cb-4d58-ad6f-b9b1055e241b`<br />

* Generate a unique key for each email-send operation. UUID v4 or another high-entropy random value is recommended.
* Keys must contain between 1 and 255 characters.
* Retrying an identical request with the same key returns the original result without sending the email again.
* Concurrent identical requests using the same key share the original operation.
* Reusing a key with a different email payload returns 409 Conflict with type errors/already\_used.
* Keys are retained in memory for up to 24 hours and are cleared during application restart or maintenance.
* Requests without this header retain their existing behavior.

This feature reduces the risk of duplicate sends but cannot guarantee exactly-once delivery across application restarts or failures where the remote email provider’s outcome cannot be determined.