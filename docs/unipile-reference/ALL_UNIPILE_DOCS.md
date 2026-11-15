# Unipile docs — full LinkedIn/API reference (fetched 2026-11-15 from developer.unipile.com/docs, raw markdown)

<!-- ===== SOURCE: https://developer.unipile.com/docs/getting-started ===== -->
---

# Getting Started

<Callout icon="📘" theme="info">
  ### This is documentation for Unipile **v1**

  - To access the **V2 documentation**, use the version selector in the **top-left corner**.
  - If you're starting a new integration with Unipile, we recommend using **V2** directly.
  - **V1 and V2 accounts are separate.** You'll need to create a new account for each version, even if you already have an account on the other version.
  - **V1 is not deprecated.&#x20;**&#x57;e will continue to maintain it for the foreseeable future, with no planned deprecation date. Most new features will be introduced in V2. You can continue using V1 while testing or migrating to V2. To migrate your existing V1 data, follow our  [Migration guide](https://developer.unipile.com/v2.0/docs/migration-from-v1).
</Callout>

# What is Unipile?

Unipile is an innovative API designed to provide seamless integrations of various messaging and communication channels into your software applications.

With Unipile, you can effortlessly incorporate messaging services from popular platforms such as WhatsApp, LinkedIn, Instagram and Telegram.

And we also provide comprehensive email integration with all providers, including Google, Microsoft, and IMAP.

Moreover, our roadmap includes plans to support additional features like SMS/RCS and contacts in the near future.

# How can Unipile help ?

Avoid the complexities of building messaging functionality from scratch and reduce development time and costs by leveraging Unipile's ready-made API. With few calls, you can setup within your UI:

* **Centralise messages history on a contact**: Use Unipile to retrieve the history of a conversation with a contact, whatever the messaging provider it is
* **Notify new messages**: With webhooks, you can receive new messages and emails in real-time
* **Send messages**: Send messages to your users contact list or email to any recipient. You can also initiate new 1to1 chat from your app
* **Invite contact**: Send invitations to contact to join your user network or create an outreach sequence
* **Get contact information**: Get user's profile, status relation, fetch posts from a person or a company...

# How to test ? Create a Unipile Account

To access the API and start exploring Unipile's messaging or emails capabilities, please follow these steps:

1. Create an account on [API Dashboard Signup](https://dashboard.unipile.com/signup).
2. Log in to [API Dashboard ](https://dashboard.unipile.com/login) and get **your DSN (Data Source Name)** which **must be used by for your requests**.

<Image align="center" src="https://files.readme.io/51ab224-Screenshot_2023-12-01_at_17.21.47.png" />

3. Generate an Access Token  : [Generate a token](https://dashboard.unipile.com/access-tokens)
4. On the "Accounts" page, you can connect accounts to test directly API call for sending and receiving messages, bypassing the API account adding process for moment.
5. After that, you can experiment with every feature without writing a single line of code directly in the "[API Reference](https://developer.unipile.com/reference)" section of the documentation. Specify **your DSN** and **your token** for the route you wish to use, and then interactively fill in the parameters.

# Quick start video

✅ In this video, you’ll learn:

* How to connect a provider account (LinkedIn, WhatsApp, Gmail…)
* How to list all chats (GET /api/v1/chats)
* How to send a message in a chat (POST /api/v1/chats/:chatId/messages)

<Embed url="https://www.youtube.com/watch?v=9e3LNkOfAyY" href="https://www.youtube.com/watch?v=9e3LNkOfAyY" typeOfEmbed="youtube" html="%3Ciframe%20class%3D%22embedly-embed%22%20src%3D%22%2F%2Fcdn.embedly.com%2Fwidgets%2Fmedia.html%3Fsrc%3Dhttps%253A%252F%252Fwww.youtube.com%252Fembed%252F9e3LNkOfAyY%253Ffeature%253Doembed%26display_name%3DYouTube%26url%3Dhttps%253A%252F%252Fwww.youtube.com%252Fwatch%253Fv%253D9e3LNkOfAyY%26image%3Dhttps%253A%252F%252Fi.ytimg.com%252Fvi%252F9e3LNkOfAyY%252Fhqdefault.jpg%26type%3Dtext%252Fhtml%26schema%3Dyoutube%22%20width%3D%22854%22%20height%3D%22480%22%20scrolling%3D%22no%22%20title%3D%22YouTube%20embed%22%20frameborder%3D%220%22%20allow%3D%22autoplay%3B%20fullscreen%3B%20encrypted-media%3B%20picture-in-picture%3B%22%20allowfullscreen%3D%22true%22%3E%3C%2Fiframe%3E" />
<!-- ===== SOURCE: https://developer.unipile.com/docs/api-usage ===== -->
---

# API Usage

# Authentication

The Unipile API uses Access Tokens to authenticate requests. You can view and manage your Access Tokens in the Unipile Dashboard. This is your API key.

Your Access Tokens carry many privileges, so be sure to keep them secure. Don't share your Access Tokens in publicly accessible areas such as GitHub, client-side code, and so forth.

Don't forget to modify the **base URL** with **your DSN** (copy it from your dashboard) in your code or directly in the [ interactive documentation](https://developer.unipile.com/reference):

![](https://files.readme.io/cac7878-image.png)

*If custom port are blocked in your environment, you can use port as query parameter to stay on standard 443, https//apiX.unipile.com/api/v1/accounts?port=XXXXX*

### With an SDK

Use your Access Token by setting it in the initial configuration of the SDK. The client library then automatically sends this token in each request.

### Manually

If you want to request manually, include this token in the **X-API-KEY** header of your request.

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'
```

# Pagination

API Methods that return a list of results are always paginated. Paginated results will include a "cursor" value, which can be sent in the next request in "cursor" parameter to get the next page of results.

Note that if the cursor is null, there is no more results.

# Errors

Please refer to the [API Reference](https://developer.unipile.com/reference) for more details about error types.

# API Schema

Unipile use the Open API specification. The API schema is available at:

* https\://\{YOUR\_DSN}/api-json
* https\://\{YOUR\_DSN}/api-yaml

You can import it into an API platform like Postman using this URL.
<!-- ===== SOURCE: https://developer.unipile.com/docs/dev-tools ===== -->
---

# Dev Tools

Explore SDK options and no-code solutions for seamless integration with our platform, including Node.js SDK and n8n setup guides.

*Feature available for **LinkedIn, WhatsApp, Instagram, Telegram, Google, Microsoft, IMAP***

We offer a Node.js SDK to facilitate integration with our API, although its use is optional. You can also perform direct HTTP requests to all methods: [Node.js SDK](https://developer.unipile.com/docs/nodejs-sdk).

For instructions on creating n8n nodes and managing webhooks, please refer to our quick start guide: [n8n Set-Up](n8n).

Additionally, we provide the MCP: [MCP](https://developer.unipile.com/docs/mcp)

<Columns layout="auto">
  <Column>
    <Cards columns="2">
      <Card title="Node.js SDK" href="https://developer.unipile.com/docs/nodejs-sdk" icon="code">
        Integrate seamlessly with our API using the Node.js SDK, or opt for direct HTTP calls.
      </Card>
      <Card title="n8n Set-Up" href="n8n" icon="cogs">
        Discover how to create n8n nodes and manage webhooks with our comprehensive quick start guide.
      </Card>
      <Card title="MCP" href="https://developer.unipile.com/docs/mcp" icon="project-diagram">
        Learn more about our MCP and how it can enhance your projects.
      </Card>
    </Cards>
  </Column>
</Columns>
<!-- ===== SOURCE: https://developer.unipile.com/docs/nodejs-sdk ===== -->
---

# Node.js SDK

A Node.js wrapper for API to manage messaging, mail and calendars.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram, Google, Microsoft, IMAP**.*

# Introduction

Unipile Node.js SDK is a package written in Typescript that will facilitate the use of  API.

[Github repository](https://github.com/unipile/unipile-node-sdk).

# Requirements

Node 20 recommended.

# Installation

```
  npm install unipile-node-sdk
```

# Example usage

More detailed examples are available on GitHub Readme

```javascript
import { UnipileClient } from 'unipile-node-sdk';

const client = new UnipileClient('https://{YOUR_DSN}', '{YOUR_ACCESS_TOKEN}');

//LINKEDIN
await client.account.connectLinkedin({
  username: 'your LinkedIn username',
  password: 'your LinkedIn password',
});

//INSTAGRAM
await client.account.connectInstagram({
  username: 'your Instagram username',
  password: 'your Instagram password',
});

//WHATSAPP
const { qrCodeString: whatsappQrCode } = await client.account.connectWhatsapp();
console.log(whatsappQrCode); // scan the QR code to finish the connection

//TELEGRAM
const { qrCodeString: telegramQrCode } = await client.account.connectTelegram();
console.log(telegramQrCode); // scan the QR code to finish the connection

//MESSENGER
await client.account.connectMessenger({
  username: 'your Messenger username',
  password: 'your Messenger password',
});

const chats = await client.messaging.getAllChats();
const messages = await client.messaging.getAllMessages();
const attendees = await client.messaging.getAllAttendees();
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/n8n ===== -->
---

# n8n Integration

This section of the documentation explains how to integrate Unipile’s API with n8n, an open-source workflow automation tool. With n8n, you can easily connect Unipile to external services (email, CRM, LinkedIn, WhatsApp, Instagram, etc.), automate repetitive tasks, and build advanced workflows without writing complex code.

<br />

## 🧩 Introduction & General Information

Unipile provides a unified API for managing multi-channel messaging (LinkedIn, WhatsApp, emails, etc.).
By connecting Unipile to n8n, you can:

* Create webhooks to capture incoming events (messages, reactions, notifications, …).
* Send requests (POST, GET) to trigger actions like sending a message, creating a post, or retrieving account data.
* Combine Unipile with other nodes in n8n to build complex workflows: for example, forward a LinkedIn message to Whatsapp, analyze it with AI, then store it in your CRM.

This documentation provides examples and ready-to-use configurations to help you get started quickly.

<br />

## 🧩 Navigation Menu

Here are the available sections to guide you step by step:

* **[Create webhook n8n](https://developer.unipile.com/docs/create-webhook-n8n#/)**
  Learn how to configure an n8n webhook to receive events from Unipile (message\_received, message\_read, etc.).
* **[Create request](https://developer.unipile.com/docs/createpost-request-n8n#/)**
  How to send API requests (POST, GET) from n8n to Unipile in order to trigger actions (send messages, create posts, etc.).
* **[Examples n8n Workflows with the API](https://developer.unipile.com/docs/example-workflow-n8n#/)**
  Pre-built examples showing how to combine Unipile with other apps in n8n (e.g. save LinkedIn messages in Google Sheets, auto-reply with AI, etc.).

<br />
<!-- ===== SOURCE: https://developer.unipile.com/docs/create-webhook-n8n ===== -->
---

# Create webhook n8n

# Receive data in realtime with Webhook

## Step 1: Create a New Workflow in n8n

1. Open the n8n dashboard
2. Click on "CREATE WORKFLOW" to start a new one

## Step 2: Add a Webhook Node

1. In the empty workflow, click on “Add first step”
2. Search for and select the “Webhook” node

## Step 3: Configure the Webhook Node in Test Mode

<Image align="center" src="https://files.readme.io/f59191b71f3d3db47d8ed6955d0b4c96ba2065ca1209b93dd39db4160bae3ab3-N8Nwebhook.png" />

1. Use the “Test URL” (shown in the node) to test incoming data.
2. Copy the POST URL and keep it.

Keep the default options.

**Important**
This Test URL allows n8n to capture and display webhook data so you can configure the rest of your workflow (filters, API calls, automation, etc.).

**DO NOT** switch to the Production URL yet, or you won’t be able to inspect the incoming data or test your logic.

## STEP 4: Set-Up Webhook on Unipile Dashboard

In our case, we will **dedicate this webhook to received/sended** messages. This webhook will only be used to configure our workflow; later on, we will need to create a new one using the production URL available on N8N.

1. Go to your unipile dashboard in the webhook section and create a webhook.
2. Next, paste the TEST URL obtained from N8N and create a webhook

<Image align="center" src="https://files.readme.io/465701f70cde981a71172fbbb11d05ecdf546d5bfbf2f8b0d46fb1272f342b5a-createweb.png" />

3. Then, click on "Create Webhook", you should have something like that. If that's not the case, restart the previous steps :

<Image align="center" src="https://files.readme.io/4145d36508442a0d801ccb2d6b3dd3161f09659cba91005f4888524ad4ecdd8f-webhookpage.png" />

4. Go to your n8n webhook, and click on “Listen for test event”, and try to send you a message or send a message from one of your provider accounts., you should receive an output like this :

<Image align="center" src="https://files.readme.io/37cdf776abbb9894b93753b64f0cffa18d1a674ee81d646f01c90777f1eb4364-webhookreceive.png" />

4. Now it's up to you to play with the various endpoints and drag and drop the information received from the webhook into the fields of your future API request (see [N8N documentation](https://docs.n8n.io/integrations/creating-nodes/build/reference/ui-elements/#support-drag-and-drop-for-data-keys)), before moving on to producing the webhook URL.
5. We will now move on to the production url, click on production URL, and copy it.
6. Go back to the unipile dashboard and recreate a webhook in the same way as described [above](https://developer.unipile.com/docs/n8n#step-4-set-up-webhook-on-unipile-dashboard) , and put the production URL in the “Callback URL” field. Don't forget to activate your workflow on N8N
7. **Your workflow is now operational !**
<!-- ===== SOURCE: https://developer.unipile.com/docs/createpost-request-n8n ===== -->
---

# Create request from n8n

With n8n, you can easily integrate Unipile API requests into your workflows. A request can be made using POST or GET, depending on the endpoint and the data you want to send or retrieve.  In this tutorial, we will show how to configure the HTTP Request node to call different Unipile’s endpoint and send the required parameters (account, text, and optional attachments).  These requests can be used as standalone actions or integrated into more complex workflows, combined with other nodes such as databases, schedulers, or third-party services.  This way, you can fully automate content publishing and other actions supported by Unipile’s API directly inside n8n.

### Examples on this page

* [Retreive a post](https://developer.unipile.com/docs/createpost-request-n8n#/retreive-a-post-example)
* [Create a LinkedIn Post With Attachment](https://developer.unipile.com/docs/createpost-request-n8n#/create-a-linkedin-post-with-attachment-example)
* [Retreive profil](https://developer.unipile.com/docs/createpost-request-n8n#/retrieve-profile-example)
* [Comment a post](https://developer.unipile.com/docs/createpost-request-n8n#/comment-a-post-example)
* [Start new chat](https://developer.unipile.com/docs/createpost-request-n8n#/start-new-chat-example)

<br />

# :jigsaw:Retreive a post Example

This is an example of a GET request, you must **specify this type of method**, and there must always be the following fields in **all your GET requests**:

```json
 --header 'X-API-KEY: YOUR_API_KEY' \
 --header 'accept: application/json'
```

<Image border={false} src="https://files.readme.io/dc040c2009987680568bd2d8307da9e9917190d0bd9351ac755f9bc6449b84aa-image.png" />

<br />

1. In the empty workflow, click on “Add first step”
2. Search for and select the "**HTTP Request**" node
3. Go to the [Retrieve a post endpoint page](https://developer.unipile.com/reference/postscontroller_getpost#/)
4. Fill in the fields as shown in the image below (you'll see the link between the endpoint page and the N8N fields)

<Image border={false} src="https://files.readme.io/5d6b51564b908ef75faa5d5f0ce18a1b319492018d8b852dcf5f510ab90762e3-image.png" />

<br />

5. Click on execute/test step, you should get an answer like this for a linkedin post :

```json
[
  {
    "object": "Post",
    "provider": "LINKEDIN",
    "social_id": "urn:li:activity:7368577889719595008",
    "share_url": "https://www.linkedin.com/posts/pierre-tordjman_test-activity-7368577889719595008-wAJB?utm_source=combined_share_message&utm_medium=member_desktop_web&rcm=ACoAAF4sPWcBmG5Rex3eA_bPtCwcCvjP0HWTaDg",
    "date": "4h",
    "parsed_datetime": "2025-09-02T10:00:41.301Z",
    "comment_counter": 1,
    "impressions_counter": 0,
    "reaction_counter": 0,
    "repost_counter": 0,
    "permissions": {
      "can_post_comments": true,
      "can_react": true,
      "can_share": true
    },
    "text": "TEST",
    "attachments": [
      {
        "id": "D4E22AQE_xxPL0viCLA",
        "sticker": false,
        "size": {
          "height": 450,
          "width": 800
        },
        "unavailable": false,
        "type": "img",
        "url": "https://media.licdn.com/dms/image/v2/D4E22AQE_xxPL0viCLA/feedshare-shrink_800/B4EZkJyiSrGwAg-/0/1756805869007?e=1759968000&v=beta&t=x_anrVCZ1RLGKDTnfXxn8SyHWXfMmpdr21BoHp_IcEg"
      }
    ],
    "author": {
      "public_identifier": "pierre-tordjman",
      "id": "ACoAAA0VJM0BXxONVn4bcMWetDkRx46EYjg-EJU",
      "name": "Pierre Tordjman ⭐",
      "is_company": false,
      "headline": "Développeur Web Full Stack / Intégrateur / Support"
    },
    "is_repost": false,
    "id": "7368577889719595008"
  }
]
```

<br />

<br />

# :jigsaw:Create a LinkedIn Post With Attachment Example

This is an example of a POST request, you must **specify this type of method**, and there must always be the following fields in **all your GET requests**:

```json
 --header 'X-API-KEY: YOUR_API_KEY' \
 --header 'accept: application/json'
```

1. In the empty workflow, click on “Add first step”
2. Search for "**Read/Write Files from Disk**" (used to import your picture and convert as interpretable data)
   1. Operation field -> choose Read Files
   2. Files selector field -> fill the Path\_to\_your\_files

      <Image border={false} src="https://files.readme.io/22f57bdd3eff0eade2770406052fb63460c213896a623f6f97cfc8823e8f8f4d-image.png" />
3. Clic on the + connector of previous node then search for and select the "**HTTP Request**" node
4. Go to the [Create post endpoint page](https://developer.unipile.com/reference/postscontroller_createpost#/)
5. Fill in the fields as shown in the image below (you'll see the link between the endpoint page and the N8N fields)

<Image border={false} src="https://files.readme.io/3409283cf4946b573898fa23e1246e31767453542575f816aaa76e4f7ec94ded-image.png" />

<Image border={false} src="https://files.readme.io/ef4a531d1c75b55ceb333ce6b29fdf9c5afe136d924e8bdce0a0456810ad9b85-image.png" />

6. Click on execute/test step, you should get an answer like this  :

```json
[
  {
    "object": "PostCreated",
    "post_id": "7368649927968571392"
  }
]
```

<br />

<br />

# :jigsaw:Retrieve Profile Example

This is an example of a GET request, you must **specify this type of method**, and there must always be the following fields in **all your GET requests**:

```json
 --header 'X-API-KEY: YOUR_API_KEY' \
 --header 'accept: application/json'
```

1. In the empty workflow, click on “Add first step”
2. Search for and select the "**HTTP Request**" node
3. Go to the [Retrieve Profile endpoint page](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier)
4. Fill in the fields as shown in the image below (you'll see the link between the endpoint page and the N8N fields)   You can also download this example [here](https://gist.github.com/arnaudh458/d05756ca00aa172c5ad98a562a591847)

<Image align="center" border={false} src="https://files.readme.io/aa655d39fd6d3382c41d89dbb0b0b397b65045a13171651cb68386ecccd4781d-fieldhttp.png" />

5. Click on execute/test step, you should get an answer like this for a linkedin user :

```json
[
  {
    "object": "UserProfile",
    "provider": "LINKEDIN",
    "provider_id": "ACoAAAXxg9sBsVmolZ8Oq_7jEe92IOOpRSI8dPE",
    "public_identifier": "arnaud-hartmann",
    "member_urn": "99714011",
    "first_name": "Arnaud",
    "last_name": "Hartmann",
    "headline": "Co-founder & CTO at Unipile | One API to Enhance your App with Multi-Channel Messaging",
    "primary_locale": {
      "country": "US",
      "language": "en"
    },
    "is_open_profile": true,
    "is_premium": true,
    "is_influencer": false,
    "is_creator": true,
    "is_relationship": true,
    "network_distance": "FIRST_DEGREE",
    "is_self": false,
    "websites": [
      "http://www.unipile.com"
    ],
    "follower_count": 6296,
    "connections_count": 6145,
    "location": "Riorges, Auvergne-Rhône-Alpes, France",
    "birthdate": {
      "month": 5,
      "day": 4
    },
    "profile_picture_url": "https://media.licdn.com/dms/image/v2/D4E03AQEtIsqhaZFc8Q/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1693819290815?e=1755129600&v=beta&t=KonSfCOwQeua3nhsnaJdd0ncySWA-y-RuEQ64eeFFJc",
    "profile_picture_url_large": "https://media.licdn.com/dms/image/v2/D4E03AQEtIsqhaZFc8Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693819290815?e=1755129600&v=beta&t=LH4MACfmW_A_yP9mFBrz2nssZMiPyPN9EhN9Ejhl5lE",
    "background_picture_url": "https://media.licdn.com/dms/image/v2/D4E16AQEmOsNC5se14A/profile-displaybackgroundimage-shrink_350_1400/B4EZaHJSXMH8Ak-/0/1746024081353?e=1755129600&v=beta&t=xLah9joKveS5uZfS0Bx91YxIJYJ2sE3qNg5hkNYKBTQ",
    "hashtags": [
      "#saas",
      "#0inbox",
      "#allistask",
      "#productivity",
      "#unifiedinbox"
    ]
  }
]
```

<br />

# :jigsaw:Comment a post Example

This is an example of a POST request, you must **specify this type of method**, and there must always be the following fields in **all your GET requests**:

```json
 --header 'X-API-KEY: YOUR_API_KEY' \
 --header 'accept: application/json'
```

1. In the empty workflow, click on “Add first step”
2. Search for and select the "**HTTP Request**" node
3. Go to the [Comment a post endpoint page](https://developer.unipile.com/reference/postscontroller_sendcomment#/)
4. Fill in the fields as shown in the image below (you'll see the link between the endpoint page and the N8N fields)
   Note : You must integer the ID of the post in the URL (social\_id), you can fill it as an expression if you get the ID in the input of the node.

<Image border={false} src="https://files.readme.io/0da8b2f32c216455989dadbf8f600237c0ba2791bf0467daa100f21a8ab75b89-image.png" />

<Image border={false} src="https://files.readme.io/aea8866e0c017b7cdeea3ff798b9406fc23864c4809bf15904eed00bea182d1d-image.png" />

5. Click on execute/test step, you should get an answer like this  :

```json
[
  {
    "object": "CommentSent"
  }
]
```

<br />

<br />

# :jigsaw:Start New Chat Example

This is an example of a POST request, you must **specify this type of method**, and there must always be the following fields in **all your GET requests**:

```json
 --header 'X-API-KEY: YOUR_API_KEY' \
 --header 'accept: application/json'
```

1. In the empty workflow, click on “Add first step”
2. Search for and select the "**HTTP Request**" node
3. Go to the [Start New Chat endpoint page](https://developer.unipile.com/reference/chatscontroller_startnewchat#/)
4. Fill in the fields as shown in the image below (you'll see the link between the endpoint page and the N8N fields)

   <Image border={false} src="https://files.readme.io/1c4d8c05cd7609292d2f1aa335b8f3302f5ac68702c72682c63785c30011373a-image.png" />

   <Image border={false} src="https://files.readme.io/6a8c8449c856cdb436d0c42cd00033e51684462c598c96b82e54694c1b7157f9-image.png" />
5. Click on execute/test step, you should get an answer like this  :
   ```json
   [
     {
       "object": "ChatStarted",
       "chat_id": "dMW1cjFwXq-dYoAEaMXo2d",
       "message_id": "Gav3xjVKVNe0IRZBEC9mSg"
     }
   ]
   ```
<!-- ===== SOURCE: https://developer.unipile.com/docs/example-workflow-n8n ===== -->
---

# Examples n8n Workflows

This section provides ready-to-use n8n workflows showcasing how to interact with the Unipile API to automate various tasks such as messaging, data retrieval, content posting, and more.  These examples are designed to help you quickly integrate Unipile into your automation flows, whether you're a developer, technical user, or exploring advanced use cases. Each workflow is provided as a JSON file that you can import into your n8n instance and adapt to your specific needs.                           📌 Note: Be sure to replace placeholder values like X-API-KEY, account_id, etc., with your actual credentials, and secure your webhooks as needed.

### Examples on this page

* [Comment a LinkedIn post](https://developer.unipile.com/docs/example-workflow-n8n#/-comment-a-linkedin-post)
* [Receive a Whatsapp message via webhook -> generate ai answer -> send reply](https://developer.unipile.com/docs/example-workflow-n8n#/-receive-a-whatsapp-message-via-webhook---generate-ai-answer---send-reply)

<br />

<br />

# :jigsaw: Comment a LinkedIn post

![](https://files.readme.io/8bde6f1129e951e05793b388fb734bee83e053921f09e05e401b9c0bd2c0ecd9-image.png)

<br />

In this workflow example, we will consider you already got the post\_id :

* From the url of the post as explained on [this page](https://developer.unipile.com/docs/posts-and-comments#/example-from-url)
* From the [List all posts](https://developer.unipile.com/reference/userscontroller_listallposts#/) endpoint
* From the [List all comments](https://developer.unipile.com/reference/userscontroller_listallcomments#/) endpoint of a user
* From the [List all reactions](https://developer.unipile.com/reference/userscontroller_listallreactions#/) endpoint of a user
* etc.

<br />

1. In the empty workflow, click on “Add first step”
2. Search for and select the "**HTTP Request**" node
   1. Method -> GET
   2. URL -> [https://YOUR\_DSN.unipile.com:\{port}/api/v1/posts/POST\_ID](https://developer.unipile.com/reference/postscontroller_getpost#/)
      Add your DSN and post\_id in url *(manually or from your previous node)*

      ![](https://files.readme.io/0f277b7100508420c23afc93004eae4d9568b857f02ab0e4dabce98d5cdb249c-image.png)
3. Clic on "+" connector then add a new "**HTTP Request**" node
   1. Method POST
   2. URL -> [https://YOUR\_DSN/api/v1/posts/SOCIAL\_ID/comments](https://developer.unipile.com/reference/postscontroller_sendcomment#/)
      Add your DSN and social\_id you have in input as an expression

      ![](https://files.readme.io/148bd0f07a6aafc6b2c18ccccb123e4effc226a42a7e6cae0e8cd0aa8d02c49c-image.png)
4. You can download this workflow [here](https://gist.github.com/arnaudh458/888ece04ba9ecd5eab92df47114d2e27)

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

# :jigsaw: Receive a Whatsapp message via webhook -> generate ai answer -> send reply

![](https://files.readme.io/58f989998005dc4ae6ea36c74eb3af637f6568e6dd265537c56ebee009260fc2-image.png)

<br />

1. Create a webhook as shown in this page [Create n8n Webhook](https://developer.unipile.com/docs/create-webhook-n8n#/)
2. Clic on "+" connector then search for your **LLM node**

   ![](https://files.readme.io/bf3f19ad8aa44fe5e44e8eb6951493b88a8e5ab8010c031bdc72198053edf2f8-image.png)
3. Connect an "**HTTP Request**" node

   1. Integer in URL as an expression the chat\_id received by the webhook

      ![](https://files.readme.io/ab135c4f0e5e70395cd25701fbe22b58529f7043f32eceb4bb3cf5b514501782-image.png)
   2. Add account\_id and text parameters as below. Value of text need to be an expression to get message content from LLM Node

      ![](https://files.readme.io/2d4a7da00ea1bd14ad345084115ce8536c33357a0507f4b1396b3c6ba095d21a-image.png)
4. You can download this workflow [here](https://gist.github.com/arnaudh458/7f5741b4ac7525dfaad39eb3a94aa109)

<br />
<!-- ===== SOURCE: https://developer.unipile.com/docs/mcp ===== -->
---

# MCP

Build your LinkedIn, WhatsApp and email integration faster with the Unipile MCP server in Cursor, Claude Code, Codex and other coding agents

The Unipile MCP server gives coding agents the Unipile API. Connect it to Cursor, Claude Code, Codex, Gemini CLI, VS Code, Windsurf or Claude Desktop. Your agent can then find the right endpoint, read its exact request and response schema, write the integration in your stack and test the call on your connected accounts.

It covers LinkedIn (Classic, Sales Navigator, Recruiter), WhatsApp, Instagram, Telegram, email (Gmail, Outlook, IMAP) and calendars (Google, Outlook). The server is generated from the API reference, so it always matches the API.

# Installation

## 1. Get your access token and your DSN

1. Generate an access token in the [Unipile Dashboard](https://dashboard.unipile.com/access-tokens). It goes in the `X-API-KEY` header of the MCP connection.
2. Copy your DSN from the top right of the [Unipile Dashboard](https://dashboard.unipile.com), for example `https://api1.unipile.com:13111`. Every v1 request goes to your DSN.

The access token is optional if the agent only reads the API reference. It is required for the agent to call the API.

Your access token gives access to the accounts of your Unipile application. Only configure it in clients and on machines you trust, and never commit it to a repository.

## 2. Set up your client

The server URL is `https://developer.unipile.com/mcp?branch=v1.0`.

<Tabs>
  <Tab title="Cursor">
    **Add to `~/.cursor/mcp.json`** (or `.cursor/mcp.json` in your project):

    ```json
    {
      "mcpServers": {
        "unipile": {
          "url": "https://developer.unipile.com/mcp?branch=v1.0",
          "headers": {
            "X-API-KEY": "your-access-token"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Claude Code">
    **Run:**

    ```bash
    claude mcp add --transport http \
      --scope user \
      --header "X-API-KEY: your-access-token" \
      unipile "https://developer.unipile.com/mcp?branch=v1.0"
    ```

    Run `claude mcp list` to verify the connection. You can also use `/mcp` from a Claude Code session.
  </Tab>

  <Tab title="Codex">
    Codex CLI, the Codex IDE extension and the ChatGPT desktop app share the same MCP configuration.

    **Add to `~/.codex/config.toml`:**

    ```toml
    [mcp_servers.unipile]
    url = "https://developer.unipile.com/mcp?branch=v1.0"
    http_headers = { X-API-KEY = "your-access-token" }
    ```

    Restart the client after saving the file. In Codex CLI, run `codex mcp list` to verify the connection.
  </Tab>

  <Tab title="Gemini CLI">
    **Add to `~/.gemini/settings.json`:**

    ```json
    {
      "mcpServers": {
        "unipile": {
          "httpUrl": "https://developer.unipile.com/mcp?branch=v1.0",
          "headers": {
            "X-API-KEY": "your-access-token"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="VS Code">
    **Add to `.vscode/mcp.json`.** VS Code prompts for the token the first time the server starts:

    ```json
    {
      "inputs": [
        { "type": "promptString", "id": "unipile_token", "description": "Unipile access token", "password": true }
      ],
      "servers": {
        "unipile": {
          "type": "http",
          "url": "https://developer.unipile.com/mcp?branch=v1.0",
          "headers": {
            "X-API-KEY": "${input:unipile_token}"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Windsurf">
    **Add to `~/.codeium/windsurf/mcp_config.json`:**

    ```json
    {
      "mcpServers": {
        "unipile": {
          "url": "https://developer.unipile.com/mcp?branch=v1.0",
          "headers": {
            "X-API-KEY": "your-access-token"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Claude Desktop">
    **Add to `claude_desktop_config.json`:**

    ```json
    {
      "mcpServers": {
        "unipile": {
          "type": "http",
          "url": "https://developer.unipile.com/mcp?branch=v1.0",
          "headers": {
            "X-API-KEY": "your-access-token"
          }
        }
      }
    }
    ```

    Restart Claude Desktop after saving the file.
  </Tab>
</Tabs>

## 3. Give the agent your DSN

The agent sees the generic server URL `https://{subdomain}.unipile.com:{port}` through the `get-server-variables` tool, but it cannot guess your DSN. Put it in your first prompt, or in your project's agent instructions (`AGENTS.md`, `CLAUDE.md`, Cursor rules):

```text
Unipile API v1. My DSN is https://api1.unipile.com:13111.
```

<br />

# What to ask your agent

Describe the feature you are building. The agent searches the endpoints, reads the schema, writes the code and can test the call. For example:

* "List my connected Unipile accounts and tell me which ones are LinkedIn, WhatsApp and Gmail."
* "Build a Sales Navigator lead search with seniority and company headcount filters. Test it on my LinkedIn account."
* "Write a function that sends a LinkedIn invitation with a note, and one that lists the invitations still pending."
* "Send an InMail from my Recruiter account to this profile, with a subject."
* "Sync WhatsApp and LinkedIn conversations into our inbox, and set up a webhook for new messages."
* "Send an email with Gmail, Outlook or IMAP through the same function, and reply in the same thread."

The v1 endpoints behind these features:

| Feature                                                           | Endpoint                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| LinkedIn search: Classic, Sales Navigator or Recruiter            | `POST /api/v1/linkedin/search`, with `api` set to `classic`, `sales_navigator` or `recruiter`                      |
| Search filter IDs (locations, industries, companies...)           | `GET /api/v1/linkedin/search/parameters`                                                                           |
| Read a LinkedIn profile                                           | `GET /api/v1/users/{identifier}`                                                                                   |
| Send an invitation, list sent invitations, cancel one             | `POST /api/v1/users/invite` · `GET /api/v1/users/invite/sent` · `DELETE /api/v1/users/invite/sent/{invitation_id}` |
| Send a message or an InMail (Classic, Sales Navigator, Recruiter) | `POST /api/v1/chats`, with the `linkedin` options (`api`, `inmail`)                                                |
| InMail credits                                                    | `GET /api/v1/linkedin/inmail_balance`                                                                              |
| Recruiter hiring projects                                         | `GET /api/v1/linkedin/projects`                                                                                    |
| Chats and messages: LinkedIn, WhatsApp, Instagram, Telegram       | `GET /api/v1/chats` · `GET /api/v1/chats/{chat_id}/messages` · `POST /api/v1/chats/{chat_id}/messages`             |
| Emails: Gmail, Outlook, IMAP                                      | `GET /api/v1/emails` · `POST /api/v1/emails`                                                                       |
| Calendars and events                                              | `GET /api/v1/calendars` · `POST /api/v1/calendars/{calendar_id}/events`                                            |

<br />

# Available tools

* `list-endpoints` - Lists every API path and HTTP method with its summary
* `search-endpoints` - Searches paths, operations and parameters, for example `inmail` or `sales_navigator`
* `get-endpoint` - Returns an endpoint's full detail: parameters, request body, responses and security
* `get-server-variables` - Returns the server URL template (`subdomain` and `port`), to be filled with your DSN
* `execute-request` - Makes a live API call and returns the response. It needs your access token in the `X-API-KEY` header

<br />

> 📘 This page is for API v1
>
> The same server also serves API v2: use `branch=v2.0` instead of `branch=v1.0`. v1 and v2 are separate environments. v2 needs its own account on [dashboardv2.unipile.com](https://dashboardv2.unipile.com) and its own API key, and accounts connected in v1 are not visible in v2. See the [v2 MCP guide](https://developer.unipile.com/v2.0/docs/mcp).

# Resources

* [github.com/unipile/unipile-mcp](https://github.com/unipile/unipile-mcp): registry manifest and setup for every client
* [Node.js SDK](https://developer.unipile.com/docs/nodejs-sdk): use it in the code the agent writes for your product
<!-- ===== SOURCE: https://developer.unipile.com/docs/list-provider-features ===== -->
---

# List of provider features

# List of Provider Features

## Messaging

| Feature                                                                                                | WhatsApp | LinkedIn | Instagram | Telegram |
| ------------------------------------------------------------------------------------------------------ | -------- | -------- | --------- | -------- |
| **Account connection**                                                                                 |          |          |           |          |
| [Hosted Auth](https://developer.unipile.com/docs/hosted-auth)                                          | 🟢       | 🟢       | 🟢        | 🟢       |
| [Custom Auth](https://developer.unipile.com/docs/native-auth)                                          | 🟢       | 🟢       | 🟢        | 🟢       |
| **Messages**                                                                                           |          |          |           |          |
| [Send Messages](https://developer.unipile.com/docs/send-messages)                                      | 🟢       | 🟢       | 🟢        | 🟢       |
| [Reply Messages](https://developer.unipile.com/reference/chatscontroller_sendmessageinchat)            | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Message](https://developer.unipile.com/docs/get-messages)                                        | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Chats](https://developer.unipile.com/reference/chatscontroller_listallchats)                     | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Attendees](https://developer.unipile.com/reference/chatattendeescontroller_listallattendees)     | 🟢       | 🟢       | 🟢        | 🟢       |
| [Sync History](https://developer.unipile.com/reference/chatscontroller_syncchathistory)                | 🟢       | 🟢       | 🟢        | 🟢       |
| [List Reactions](https://developer.unipile.com/edit/message-payload)                                   | 🟢       | 🟢       | 🟢        | 🟢       |
| [Read receipts](https://developer.unipile.com/edit/message-payload)                                    | 🟢       | 🟢       | 🟢        | 🟢       |
| **Attachments**                                                                                        |          |          |           |          |
| [Send Files attachments](https://developer.unipile.com/reference/chatscontroller_startnewchat)         | 🟢       | 🟢       | 🟢        | 🟢       |
| [Receive Files attachments](https://developer.unipile.com/reference/messagescontroller_getattachment)  | 🟢       | 🟢       | 🟢        | 🟢       |
| [Send voice notes](https://developer.unipile.com/reference/chatscontroller_startnewchat)               | 🟢       | 🟢       | 🟢        | 🟢       |
| [Send embed video](https://developer.unipile.com/reference/chatscontroller_startnewchat)               | 🟢       | 🟢       |           |          |
| **Profiles**                                                                                           |          |          |           |          |
| [Retrieve Users Profiles](https://developer.unipile.com/docs/retrieving-users)                         | 🟢       | 🟢       | 🟢        | 🟢       |
| [Retrieve Own Profile](https://developer.unipile.com/reference/userscontroller_getaccountownerprofile) | 🟢       | 🟢       | 🟢        | 🔴       |
| [Is number on ?](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier)       | 🟢       |          |           | 🟢       |
| **Webhooks**                                                                                           |          |          |           |          |
| [Account status](https://developer.unipile.com/docs/account-lifecycle)                                 | 🟢       | 🟢       | 🟢        | 🟢       |
| [New message](https://developer.unipile.com/docs/new-messages-webhook)                                 | 🟢       | 🟢       | 🟢        | 🟢       |
| [New reaction / read / event](https://developer.unipile.com/docs/new-messages-webhook)                 | 🟢       | 🟢       | 🟢        | 🟢       |

## LinkedIn/Instagram Specific

| Feature                                                                                                                                                                               | LinkedIn | Instagram |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| **Outreach**                                                                                                                                                                          |          |           |
| [Invite Users](https://developer.unipile.com/docs/invite-users)                                                                                                                       | 🟢       | 🟢        |
| [Send InMail](https://developer.unipile.com/docs/send-messages#linkedin-specific-use-cases)                                                                                           | 🟢       |           |
| [Retrieve InMail credit](https://developer.unipile.com/reference/linkedincontroller_getinmailbalance)                                                                                 | 🟢       |           |
| [Create an Outreach Sequence](https://developer.unipile.com/docs/how-to-create-outreach-sequence)                                                                                     | 🟢       |           |
| [List Pending Invitation](https://developer.unipile.com/reference/userscontroller_listalluserinvitationssent)                                                                         | 🟢       |           |
| [Delete Pending Invitation](https://developer.unipile.com/reference/userscontroller_cancelinvitation)                                                                                 | 🟢       | 🟢        |
| [Detecting Accepted Invitations](https://developer.unipile.com/docs/detecting-accepted-invitations)                                                                                   | 🟢       |           |
| [Following someone](https://developer.unipile.com/docs/get-raw-data-example#following-someone)                                                                                        | 🟢       | 🟢        |
| [List/Accept/Decline incoming invitation](https://developer.unipile.com/reference/userscontroller_listalluserinvitationsreceived)                                                     | 🟢       |           |
| [Endorse Skills](https://developer.unipile.com/reference/linkedincontroller_endorseprofile)                                                                                           | 🟢       |           |
| **Posts & Comment**                                                                                                                                                                   |          |           |
| [List Posts of Users and Companies](https://developer.unipile.com/reference/userscontroller_listallposts)                                                                             | 🟢       | 🟢        |
| [Add reaction on a post or comment](https://developer.unipile.com/reference/postscontroller_addpostreaction)                                                                          | 🟢       | 🟢        |
| [Send Comments](https://developer.unipile.com/reference/postscontroller_sendcomment)                                                                                                  | 🟢       | 🟢        |
| [List Posts Comments](https://developer.unipile.com/reference/postscontroller_listallcomments)                                                                                        | 🟢       | 🟢        |
| [List Posts Reactions](https://developer.unipile.com/reference/postscontroller_listallreactions)                                                                                      | 🟢       | 🟢        |
| [Create a post](https://developer.unipile.com/reference/postscontroller_createpost)                                                                                                   | 🟢       | 🟢        |
| [Retrieve a post](https://developer.unipile.com/reference/postscontroller_getpost)                                                                                                    | 🟢       | 🟢        |
| **Profiles**                                                                                                                                                                          |          |           |
| [Visit and Retrieve Users Profiles](https://developer.unipile.com/docs/retrieving-users)                                                                                              | 🟢       | 🟢        |
| [List of Contacts/Relations](https://developer.unipile.com/reference/userscontroller_getrelations)                                                                                    | 🟢       |           |
| [List of Followers](https://developer.unipile.com/reference/userscontroller_getfollowers)                                                                                             |          | 🟢        |
| [List of Followed accounts](https://developer.unipile.com/reference/userscontroller_getfollowing)                                                                                     |          | 🟢        |
| [Companies Profiles](https://developer.unipile.com/reference/linkedincontroller_getcompanyprofile)                                                                                    | 🟢       |           |
| [Get own profile viewers](https://developer.unipile.com/docs/get-raw-data-example#get-own-profile-viewers)                                                                            | 🟢       |           |
| **Job Posting**                                                                                                                                                                       |          |           |
| [Create Job](https://developer.unipile.com/reference/linkedincontroller_createjobposting) and [Publish](https://developer.unipile.com/reference/linkedincontroller_publishjobposting) | 🟢       |           |
| [List Jobs](https://developer.unipile.com/reference/linkedincontroller_getjobpostings)                                                                                                | 🟢       |           |
| [Retrieve applicants](https://developer.unipile.com/reference/linkedincontroller_getjobapplicants)                                                                                    | 🟢       |           |
| [Get Resume of Applicants](https://developer.unipile.com/reference/linkedincontroller_getjobapplicantresume)                                                                          | 🟢       |           |
| **Inboxes** ([Send](https://developer.unipile.com/docs/send-messages) and [Receive](https://developer.unipile.com/docs/get-messages) in real-time)                                    |          |           |
| Classic                                                                                                                                                                               | 🟢       | 🟢        |
| Sales Navigator                                                                                                                                                                       | 🟢       |           |
| Recruiter & Recruiter Lite                                                                                                                                                            | 🟢       |           |
| Company Page                                                                                                                                                                          | 🟢       |           |
| **[Search by URL or parameters](https://developer.unipile.com/docs/linkedin-search)**                                                                                                 |          |           |
| People (Classic / Recruiter / Sales Navigator)                                                                                                                                        | 🟢       | 🟠        |
| Companies (Classic Sales Navigator)                                                                                                                                                   | 🟢       |           |
| Posts (Classic)                                                                                                                                                                       | 🟢       | 🟠        |
| Jobs (Classic)                                                                                                                                                                        | 🟢       |           |

## Email

| Feature                                                                                    | Google | Microsoft | IMAP |
| ------------------------------------------------------------------------------------------ | ------ | --------- | ---- |
| **Account connection**                                                                     |        |           |      |
| [Hosted Auth](https://developer.unipile.com/docs/hosted-auth)                              | 🟢     | 🟢        | 🟢   |
| [Custom Auth](https://developer.unipile.com/docs/native-auth)                              | 🟢     | 🟢        | 🟢   |
| [OAuth](https://developer.unipile.com/docs/emails)                                         | 🟢     | 🟢        |      |
| [Credentials](https://developer.unipile.com/docs/emails)                                   |        |           | 🟢   |
| **Send/Receive**                                                                           |        |           |      |
| [Send/Reply Email](https://developer.unipile.com/docs/send-email)                          | 🟢     | 🟢        | 🟢   |
| [List Emails](https://developer.unipile.com/docs/retrieving-emails)                        | 🟢     | 🟢        | 🟢   |
| [Create Email Draft](https://developer.unipile.com/reference/draftscontroller_createdraft) | 🟢     | 🟢        | 🟢   |
| **Organize**                                                                               |        |           |      |
| [Delete Email](https://developer.unipile.com/reference/mailscontroller_deletemail)         | 🟢     | 🟢        | 🟢   |
| [Move Email](https://developer.unipile.com/reference/mailscontroller_updatemail)           | 🟢     | 🟢        | 🟢   |
| [List Folders](https://developer.unipile.com/reference/folderscontroller_listfolders)      | 🟢     | 🟢        | 🟢   |
| [Get Folder](https://developer.unipile.com/reference/folderscontroller_getfolder)          | 🟢     | 🟢        | 🟢   |
| **Webhooks**                                                                               |        |           |      |
| [New Email](https://developer.unipile.com/docs/new-emails-webhook)                         | 🟢     | 🟢        | 🟢   |
| [Open and click tracking](https://developer.unipile.com/docs/tracking-email)               | 🟢     | 🟢        | 🟢   |

## Calendar

| Feature                                                                                                         | Google | Microsoft |
| --------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| **Calendars**                                                                                                   |        |           |
| [List Calendars](https://developer.unipile.com/reference/calendarscontroller_listcalendars)                     | 🟢     | 🟢        |
| [Get Calendar](https://developer.unipile.com/reference/calendarscontroller_getcalendar)                         | 🟢     | 🟢        |
| **Events**                                                                                                      |        |           |
| [Retrieve all events](https://developer.unipile.com/reference/calendarscontroller_listcalendareventsbycalendar) | 🟢     | 🟢        |
| [Create an event](https://developer.unipile.com/reference/calendarscontroller_createcalendarevent)              | 🟢     | 🟢        |
| [Retrieve an event](https://developer.unipile.com/reference/calendarscontroller_getcalendarevent)               | 🟢     | 🟢        |
| [Edit an event](https://developer.unipile.com/reference/calendarscontroller_editcalendarevent)                  | 🟢     | 🟢        |
| [Delete an event](https://developer.unipile.com/reference/calendarscontroller_deletecalendarevent)              | 🟢     | 🟢        |
<!-- ===== SOURCE: https://developer.unipile.com/docs/provider-limits-and-restrictions ===== -->
---

# Provider Limits and Restrictions

Our platform offers APIs to connect with various providers, facilitating seamless integration for developers. However, it's crucial to understand and manage the limits and restrictions imposed by each provider to ensure smooth operation of your applications. Below are the limitations and guidelines for interacting with different providers:

# LinkedIn

**These limits are conservative recommendations. You may increase the values at your own risk. Exceeding LinkedIn's limits will result in an HTTP 429 or 500 error. Ensure your system handles this error effectively to avoid warnings related to automation on your user account.**

**To emulate human behavior, it's important to space out all calls rather than chaining them at regular intervals. Use random values and distribute them across multiple launches during working hours.**

**For new or inactive accounts, start with low quantities and increase gradually. Accounts with fewer than \~150 connections or recently created accounts may experience delivery issues with invitations, which may require manual verification by LinkedIn before appear on UI. Fake accounts are well-detected by LinkedIn, even without automation. We strongly recommend using only real accounts.**

*These limits are defined per LinkedIn account. They are independent of the route and do not accumulate*.

**Connection Requests (Invitations):**

* For a paid and active LinkedIn account, you can send between 80 and 100 invitations per day, and approximately 200 per week (with a message of up to 300 characters).
* For a free account, you can send around 5 invitations per month (with a 200-character message) and 150 invitations per week without adding a note.

If you hit the invitation limit, LinkedIn will return a specific error: 422 / cannot\_resend\_yet. We don’t enforce any limits on our side, so you’ll have the exact same limit in the LinkedIn UI. You can try doing the same action in the UI using the same invitation type (with or without a note) and submitting it. The LinkedIn error message only appears at the last step, so you can still start the process and think the invitation will be sent, but it fails at the end.

**Retrieve a User Profile (Profile Visits/ID conversion):**

\~100 profiles per account per day (it’s a recommendation; we don’t limit your requests).

*If account have Sales Navigator or Recruiter, you can perform an additional requests per account per day by switching "api" parameter in the profile retrieval request. [Recruiter Lite have official defined limit of 2000](https://www.linkedin.com/help/recruiter/answer/a497998?hcppcid=search)*

**Search Results:**

There are two separate limits to keep in mind:

1. **Per-search cap (LinkedIn limit)**
   * Standard LinkedIn: max 1,000 profiles returned for a single search query
   * Sales Navigator / Recruiter: max 2,500 profiles returned for a single search query (except for Company search on Sales Navigator it's still 1000)
   * Even if the UI shows more total results, LinkedIn only returns the first 1,000 (or 2,500) for that query. To retrieve all results, filter your query using parameters and perform multiple searches
2. **Daily usage (Unipile recommendation, not limited)**
   * We recommend limiting the total number of profiles you retrieve per day to 1,000 (standard) or 2,500 (Sales Navigator/Recruiter)
   * This refers to the sum of result line actually fetched in a day, not the number of requests

**Relations and Invitation list:**

You might be interested in polling relations or the invitation list to detect accepted invitations. However, we do not recommend polling every hour or at fixed times, such as 8:00 AM daily, as this pattern can be easily flagged as automation. We provide a 'new\_relation' webhook that handles this correctly : <https://developer.unipile.com/docs/detecting-accepted-invitations>

You can do initial sync, during which you can call the endpoint multiple times, after that, we recommend retrieving the first page only a few times a day with randomly spaced intervals of several hours.

**Chats Retrieving:**

We manage messaging inbox synchronization on the server side, ensuring seamless synchronization of chat lists and messages. This enables users to access and fetch their data without limitations via routes such as Messages, Chats, and Attendees.

**InMail**

The number of InMails a user can send depends on their LinkedIn subscription. For example, Career subscriptions start with 5 InMails per month, while some recruiter contracts include thousands of shared InMails.

You can check the available credit programmatically using [this route](https://developer.unipile.com/reference/linkedincontroller_getinmailbalance)

Free inmail on open profile:

You can send free InMails to open profiles. These can be identified in Recruiter or Sales Navigator via profile retrieval on is\_open\_profile propriety (result is for given account , result can be different from another account).  However, LinkedIn limit free InMails of maximum 800  per month per account (LinkedIn  reducing this number on some account type, and some other parameters, like history, acceptance, and from which product you are using to send (linkedin\[api]=classic/sales\_navigator/recruiter can give different result)  , but you will have same result as on UI of LinkedIn, some information for Recruiter  limit [here](https://www.linkedin.com/help/recruiter/answer/a745199))

Note: In some cases, LinkedIn may still require the account to have available InMail credits, even when sending a free InMail to an Open Profile. If the account has no remaining credit, the send may fail depending on the product context and LinkedIn-side rules.

We recommend spacing actions randomly and limiting daily sends to 30–50 to maximize the monthly allocation.

**Other Routes:**

For all other unlisted routes, follow the same principles:

* Minimize usage as much as possible.
* Space out calls at random intervals.
* By default, limit each action to 100 per day per account (e.g., retrieving company profiles, retrieving posts, sending messages to connections, commenting, or adding reactions..).

## LinkedIn Recruiter

LinkedIn Recruiter has specific limitations on the number of simultaneous sessions. Logging into Unipile using your LinkedIn credentials may trigger a warning from LinkedIn, reminding users not to share account credentials. Users must acknowledge this message. If LinkedIn detects a new session afterward, LinkedIn will display a message listing the current sessions and prompt the user to choose which session to end to continue using LinkedIn in their browser.

While this does not pose a long-term risk to the user's account, it creates a poor user experience as the user will need to reconnect their account to Unipile each time this popup appears.

To avoid this limitation, you can disable the Recruiter feature if it is not specifically needed in your application. This can be done by using the disable\_feature parameter in the hosted authentication route.

If the Recruiter feature is required, users must connect their account using cookies. This option is available on the login page but requires users to open their browser's developer tools to retrieve the cookies. For non-technical users, this process needs to be clearly explained.

The best way to handle this is by creating a Chrome extension. This extension would simply ask users to install it, allowing you to collect the necessary cookies in the background. We can provide a basic skeleton for an extension to collect cookies with the appropriate permissions, but you will need to implement additional logic in your backend. You can find more details [here](https://developer.unipile.com/docs/connect-accounts#google-chrome-extension-case).

# WhatsApp

**Connect Accounts with Old Activity:** Avoid using brand new accounts exclusively for software purposes. Instead, utilize WhatsApp accounts with historical activity from real users to prevent account to be suspended. Fresh accounts can be blocked after only 2–3 new chats. They should be warmed up over several days with a few active, real conversations before being used for outreach.

**Wait After Connecting or Reconnecting an Account:** WhatsApp may detect accounts that open a new session and immediately start outreach as suspicious behavior. We recommend waiting up to 24 hours after connecting, reconnecting, or disconnecting/reconnecting a WhatsApp account before creating new chats or starting outreach activity.

**Engage Users in Discussion:** Design messages to initiate interaction and encourage replies. The first message should prompt a response to maintain active conversations.

**Respect Delay Between Messages:** Incorporate realistic delays between messages to mimic human behavior. Avoid sending messages with intervals shorter than 10-20 seconds to align with natural conversation patterns.

**Number of new chat creations (outreach):** This is a metric monitored by WhatsApp. If you initiate too many new chats without receiving responses or if there are a high number of signals of spam/block, it may temporarily restrict your account.

To reduce risk, keep the number of new chats low, prioritize conversations with users who are likely to reply, and avoid aggressive outbound campaigns.

# Instagram

To avoid detection of suspicious activity, limit each account to a maximum of 100 actions per day and no more than 10 actions per hour, particularly for activities such as following, outreach, or liking and commenting. If you received lot of inbound message, you can reply to all of them safely, like on UI. For new or inactive accounts, begin with lower activity levels and gradually increase them over time.

To better emulate human behavior, space out all actions randomly instead of executing them at regular intervals. Distribute these actions across multiple time slots during working hours for a more natural pattern.

Instagram may display a warning message such as: “We suspect automated behavior on your account.” "To prevent your account from being temporarily restricted or permanently disabled, ensure that no other users or tools have access to your account and that you're following our Terms of Use..."

You can ignore this message and continue using automation, we have not observed additional account restrictions or negative consequences for users who received this warning and continued using our API as usual.

# Facebook

Maximum sending between 10 and 50 requests per day is recommended. It's essential to exclusively send requests to individuals with more than 10 mutual connections to uphold account security. While there is no set limit on friend requests or direct messages (DMs) sent, it's advised not to surpass 50 per day. Following the training guidelines, it's best to start with 15 DMs daily and incrementally increase by 5 each week until reaching the maximum of 50 DMs per day.

# Gmail

**Differences Between Gmail Accounts and Google Workspace:** Gmail accounts can send up to 500 emails per day, while Google Workspace accounts can send up to 2000 per day officially.

**Recommended Sending Limits:** To avoid being flagged or blocked, limit Gmail sending to 50 to 100 emails per day and Workspace sending to 100 to 150. Depending on sending quality, replies, and bounce rate, these limits may be increased up to 150 for Gmail and 300 for Workspace. For new accounts, start with 20 to 50 emails per day and gradually increase.

**API Calls Limits**: Gmail limit the numbers of calls you can do simultaneously shared between all actions, you need to spread your calls across time to not hit these limits (429) : <https://developers.google.com/workspace/gmail/api/reference/quota?hl=fr>

**Way to increase the limit**: You can create multiple domains in your Google Workspace and link them as aliases to your main email. With our API, you can list aliases and use them as the 'from' address. This will allow you to distribute your reputation across different domains with only one connected Gmail account. <https://support.google.com/a/answer/7502379?hl=en>

# Outlook

The limits for Microsoft 365 subscribers are:

* Daily recipients: 5,000

* Maximum recipients per message: 500

* Daily non-relationship recipients: 1,000

Limits may vary based on usage history and will be lower for non-subscribers. A “non-relationship recipient” is someone you've never sent email to before. The sending limits of any third party connected accounts depend upon the service provider.

Apart from official recommendations, we advise respecting the "Recommended Sending Limits" in Gmail part.

# Email IMAP

The limitations may vary depending on your email provider. Please refer to your users provider's documentation or inquire with them directly for specific details.

Apart from official recommendations, we advise respecting the "Recommended Sending Limits" in Gmail part
<!-- ===== SOURCE: https://developer.unipile.com/docs/connect-accounts ===== -->
---

# Connection methods

Before you can handle chats and messages, you must connect an account of the wanted messaging provider. Discover Unipile's connection methods in this section.

# Overview

Unipile's API provides **two account connection methods**, ensuring that you can seamlessly synchronize accounts for different messaging services. Connecting an account involve authentication to the messaging provider through Unipile's API.

### Supported authentication features for Messaging

|                                         | WhatsApp | LinkedIn | Instagram | Telegram |
| :-------------------------------------- | :------- | :------- | :-------- | :------- |
| Hosted Authentification                 | 🟢       | 🟢       | 🟢        | 🟢       |
| Custom Authentification                 | 🟢       | 🟢       | 🟢        | 🟢       |
| QR Code scanning                        | 🟢       | *N/A*    | *N/A*     | 🟢       |
| Authentication with username / password | *N/A*    | 🟢       | 🟢        | 🔴       |
| 2FA with SMS                            | *N/A*    | 🟢       | 🟢        | *N/A*    |
| 2FA with Authentication App             | *N/A*    | 🟢       | 🟢        | 🟢       |
| 2FA with In-App Validation              | *N/A*    | 🟢       | *N/A*     | *N/A*    |
| One-Time Password                       | 🟢       | 🟢       | *N/A*     | *N/A*    |

### Supported authentification features for Emails

|                                             | Google | Microsoft | IMAP |
| :------------------------------------------ | :----- | :-------- | :--- |
| Hosted Authentification                     | 🟢     | 🟢        | 🟢   |
| Custom Authentification                     | 🟢     | 🟢        | 🟢   |
| Authentification with OAuth Provider Screen | 🟢     | 🟢        |      |
| Authentication with username / password     | 🟢     |           | 🟢   |

***

# Hosted auth wizard

[Hosted Auth Wizard](https://developer.unipile.com/docs/hosted-auth) is the quickest and most straightforward way to connect accounts, as it involves a single API call to generate an temporary link to redirect users to a Unipile's Hosted auth wizard. The wizard guides users step-by-step, supporting various authentication methods.

<br />

# Custom authentication

If you want to embed a custom authentication form/wizard in your application, choose the [Custom authentication](https://developer.unipile.com/docs/native-auth) approach. This approach offers the freedom to build a unique and tailored authentication experience that aligns with your application's specific needs.

However, it's a more advanced approach that needs more work as it requires implementing specific authentication scenarios like QR Code scanning, 2FA, and One-Time Password by yourself.

<br />

***

# Recommended Steps for Account Management Integration

We assume that you have chosen the Hosted Auth method, as the majority of our customers do:

* Add a "Connect an account" button to your product. Upon clicking this button, use our [Hosted Auth API](https://developer.unipile.com/docs/hosted-auth) to generate a unique link for the user and redirect them to it.
* Create a database to store your users' connected accounts. Suggested structure: id | user\_id (yours) | account\_type (LINKEDIN, GMAIL, WHATSAPP, etc.) | account\_id | status (OK, CREDENTIALS, etc.) | last\_update (datetime) | created\_on (datetime)
* Create a backend endpoint to handle calls from our API when a user successfully connects their account. In this endpoint, you will store the account\_id of the account the user just connected, linked to your internal user\_id (we provide this to simplify matching).
* Create a landing page for the user upon successful (and failed) connection that will refresh their list of accounts stored on your side. For each account on your list, you may need to add a "Reconnect" button, which handles the same Hosted Auth API process but with the parameter "reconnect".
* Set up a webhook in our API to handle account status changes.
* Create a backend endpoint to process the webhook for status changes and compare the new status with the stored one. If there's a change, you can update the status and initiate some actions. The most critical status is CREDENTIALS, which requires user action to reconnect. You can send an email to your customers asking them to reconnect (or just display it in the UI).

# Google Chrome Extension case

If your application has a browser extension and want to connect LinkedIn account, you can implement background authentication by utilizing the collected cookie of the account you want to connect and make a [Custom authentication](https://developer.unipile.com/docs/native-auth) with cookies. When you receive the webhook notification for account disconnection, you can collect a new cookie and use the 'reconnect' method without any action of your user. This ensures a seamless user experience.

Recommended Steps for smooth LinkedIn cookie synchronization with Chrome extension:

* Collect the following data: li\_a, li\_at, user\_agent, ip (for Unipile, use a country-based IP), and an identifier for the connected account (to handle user account switching, you have to parse html of LinkedIn page to find the LinkedIn user id in their JSON `{ "data":{ "plainId":.. } }`).
  Send this data to your backend at regular intervals, storing it as follows for example: internal\_user\_id, unipile\_account\_id (empty on the first call), unipile\_status, date\_last\_cookie, date\_last\_status\_unipile, li\_a, li\_at, user\_agent, ip, date\_last\_try\_connect
* In your backend, if unipile\_account\_id is empty, your backend should use our custom authentication to connect the account initially
* When the LinkedIn account is disconnected and you receive a webhook notification, your backend can use the custom authentication 'reconnect' function with the last recorded cookie and the account\_id retrieved during the initial connection.
  If reconnection fails, after 1 day, allowing users time to reconnect and use their extension naturally, send an email to the user prompting them to reconnect to LinkedIn and, if the date\_last\_cookie is outdated, verify that their extension is properly configured.

# Proxies

Some providers monitor IP addresses used to access their services. If too many accounts connect from the same IP (e.g., Unipile’s servers), it may raise flags or trigger security measures.

To prevent this, Unipile automatically assigns fixed proxies to accounts. When interacting with an Account, requests don’t have to go directly from Unipile’s servers to the provider’s API, they are routed through a proxy instead.

By default, Unipile pick a proxy located near the user's IP, but you can choose a specific country or provide your own proxy if needed.

```Text List of Available IP Countries
{
  "ae": "United Arab Emirates",
  "ao": "Angola",
  "ar": "Argentina",
  "at": "Austria",
  "au": "Australia",
  "bd": "Bangladesh",
  "be": "Belgium",
  "bg": "Bulgaria",
  "br": "Brazil",
  "ca": "Canada",
  "ch": "Switzerland",
  "cl": "Chile",
  "cn": "China",
  "co": "Colombia",
  "cy": "Cyprus",
  "cz": "Czechia",
  "de": "Germany",
  "dk": "Denmark",
  "ee": "Estonia",
  "eg": "Egypt",
  "es": "Spain",
  "fi": "Finland",
  "fr": "France",
  "gb": "United Kingdom",
  "gt": "Guatemala",
  "hk": "Hong Kong",
  "id": "Indonesia",
  "ie": "Ireland",
  "il": "Israel",
  "in": "India",
  "it": "Italy",
  "jp": "Japan",
  "kr": "South Korea",
  "kz": "Kazakhstan",
  "ma": "Morocco",
  "mx": "Mexico",
  "my": "Malaysia",
  "nl": "Netherlands",
  "no": "Norway",
  "pa": "Panama",
  "ph": "Philippines",
  "pk": "Pakistan",
  "pl": "Poland",
  "pr": "Puerto Rico",
  "pt": "Portugal",
  "ro": "Romania",
  "sa": "Saudi Arabia",
  "se": "Sweden",
  "sg": "Singapore",
  "th": "Thailand",
  "tn": "Tunisia",
  "tr": "Turkey",
  "ua": "Ukraine",
  "us": "United States",
  "vn": "Vietnam",
  "za": "South Africa"
}
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/hosted-auth ===== -->
---

# Hosted auth wizard

Learn how to use Hosted Auth Wizard to connect accounts on your application.

*Feature available for:&#x20;****LinkedIn, WhatsApp, Instagram, Telegram, Google, Microsoft, IMAP****.*

The Hosted Auth Wizard is a pre-built, optimised authentication interface that simplifies the process of connecting user accounts securely. With its built-in features, you can significantly reduce your development time and provide a streamlined authentication experience. The Hosted Auth Wizard offers support for various authentication methods, including QR code scanning, credentials-based authentication and OAuth.  You can show only the providers you allow your users to connect to.

<Image align="center" border={false} src="https://files.readme.io/783019e-Screenshot_from_2024-05-27_17-36-01.png" />

*Facebook Messenger is deprecated in v1 and available in [v2](https://developer.unipile.com/v2.0/docs/welcome). X/Twitter is deprecated in v1; support is coming soon in [v2](https://developer.unipile.com/v2.0/docs/welcome).*

# Overview

<Image align="center" border={false} src="https://files.readme.io/d07e0a2-hosted_auth.png" />

> 📘 You can specify the 'name' parameter with your internal user ID when requesting a hosted auth link. We will return this parameter when we call your 'notify\_url', in order to match the connected account with your user.

# Quickstart

## Step 1 : Generate a Hosted Auth Wizard link

To generate a hosted auth link, you'll need to make an [API Request](https://developer.unipile.com/reference/hostedcontroller_requestlink) with the following parameters:

* Specifies whether you want to `create` a new connection or `reconnect` a disconnected account.
* Your Unipile API endpoint.
* The expiration date and time for the link in ISO 8601 format. Make sure it is a relatively short expiration period, ranging from a few minutes to a few hours. All links expire upon daily restart, regardless of their stated expiration date. A new link must be generated each time a user clicks on your app to connect.
* A list of messaging providers the user can choose from in the wizard. You can specify a specific provider or use "\*" for all providers.
* Upon a user's successful login, you can configure two distinct URLs, one for success (`success_redirect_url`) and another for failure (`failure_redirect_url`), to which the user will be redirected. Additionally, you have the option to receive a webhook notification containing account-related information at a URL of your choosing (`notify_url`).
* You can specify the 'name' parameter with your internal user ID when requesting a hosted auth link. We will return this parameter when we call your 'notify\_url', in order to match the connected account with your user

```curl
curl --request POST \
     --url https://apiXXX.unipile.com:XXX/api/v1/hosted/accounts/link \
     --header 'X-API-KEY: XXXXXXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "type": "create",
  "providers": ["LINKEDIN", "WHATSAPP", "GOOGLE"],
  "api_url": "https://apiXXX.unipile.com:XXX",
  "expiresOn": "2024-12-22T12:00:00.701Z" 
}
'
 // More parameters here https://developer.unipile.com/reference/hostedcontroller_requestlink
```
```javascript
const response = await client.account.createHostedAuthLink({
  type: "create",
  api_url: "https://{YOUR_DSN}",
  expiresOn: "2024-12-22T12:00:00.701Z",
  providers: "*",
  // More options here https://developer.unipile.com/reference/hostedcontroller_requestlink
})
```

The utmost caution must be exercised to prevent the inadvertent exposure of your X-API-KEY. To accomplish this, it is necessary to establish an intermediary backend process responsible for make this api call who generate the unique link tailored to each user.

Upon a user's successful login, you can configure two distinct URLs, one for success (success\_redirect\_url) and another for failure (failure\_redirect\_url), to which the user will be redirected. Additionally, you have the option to receive a webhook notification containing account-related information at a URL of your choosing (notify\_url).

## Step 2 : Receive the Hosted Auth Link

Upon a successful API request, you'll receive a response containing a hosted auth URL. This URL is the link that will guide users through the authentication process.

```json JSON Response
{
  "object": "HostedAuthURL",
  "url": "https://account.unipile.com/pqb%2Gz77l.o72WXNPdqWX45jxqP5xMMlQp02zho8GAXZq0HWsAGiQ%3D"
}
```

## Step 3: Implement the Hosted Auth Link

We strongly recommend the implementation of an automatic redirection mechanism when a user clicks a 'connect account' button within your application.

We do not recommend embedding our link in an iframe as this may cause some issues with solving the Linkedin captcha or loading the Microsoft Oauth screen..

## Step 4: Receive callback when account is added

When your user successfully connects an account, you can receive a callback on a URL of your choice with the account\_id and your internal ID to store the matching and make your future requests.

Add "notify\_url" with your backend URL and "name" with your internal user ID parameters in your payload.

```curl
curl --request POST \
     --url https://apiXXX.unipile.com:XXX/api/v1/hosted/accounts/link \
     --header 'X-API-KEY: XXXXXXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "type": "create",
  "providers": "*", 
  "api_url": "https://apiXXX.unipile.com:XXX",
  "expiresOn": "2024-12-22T12:00:00.701Z"
  "notify_url": "https://www.yourapp.com/account_callkback?youcanauth=asthis",
  "name": "myuser1234"
}
'
```
```javascript
const response = await client.account.createHostedAuthLink({
  type: "create",
  api_url: "https://{YOUR_DSN}",
  expiresOn: "2024-12-22T12:00:00.701Z",
  providers: "*",
  notify_url: "https://www.yourhostedlink.com?youcanauth=asthis",
  name: "myuser1234"
})
```

After the user connects their account, you will receive this payload on your notify URL.

```json JSON
{
  "status":"CREATION_SUCCESS", // or "RECONNECTED" for reconnect type
  "account_id":"e54m8LR22bA7G5qsAc8w",
  "name":"myuser1234"
}
```

***

# Connect with UniLogin

UniLogin connects the LinkedIn or Instagram account already signed in to the user's browser. The user approves access in Hosted Auth and can revoke it from the UniLogin extension at any time. Your application receives an account ID, never browser session cookies.

<Image src="https://files.readme.io/3fe2f0522f63fa20ab64990fae96d69fb3d713a9bffb13be83df6d8ca5fadfcc-unilogin-install-v1.png" align="center" />

Add `"unilogin": {}` to your existing `POST /api/v1/hosted/accounts/link` request. UniLogin is disabled when this object is omitted.

```json
{
  "type": "create",
  "providers": ["LINKEDIN"],
  "api_url": "https://apiXXX.unipile.com:XXX",
  "expiresOn": "<future UTC ISO timestamp>",
  "unilogin": {}
}
```

Use your actual DSN and a future timestamp. `unilogin.publisher_name` optionally identifies your application, and `unilogin.tab_name` optionally replaces the tab label (1–60 characters). UniLogin appears after credentials and cookies. To offer it alone, add `"disabled_options": ["credentials_auth", "cookie_auth"]`. Reconnection keeps the usual `type: "reconnect"` and `reconnect_account` fields.

`unilogin.track_last_visited_page` is optional and `false` by default. When enabled, `GET /api/v1/accounts/{account_id}` can expose the latest sanitized provider page as `connection_params.im.last_visited_page`, with `url` and `visited_at`. The field is absent until a page is observed. Use the timestamp to distinguish recent browser activity from API actions, or the URL to identify a profile or post for a subsequent API lookup.

The user stays in Hosted Auth. If the extension is missing, the wizard offers the Chrome/Firefox Store or Edge/Safari ZIP with installation instructions. A code appears only if the user clicks **I already installed it** and detection fails. The user enters it through **Link a profile** in the extension.

Automatic extension handoff works from the standard Hosted Auth domain in Chrome and Firefox. Custom Hosted Auth domains use the one-time code fallback.

# Reconnecting an account with Hosted Auth Wizard

The reconnection link follows a similar path as the initial connection process, but with the `type` parameter set to `reconnect`, and it necessitates the inclusion of the account ID (`reconnect_account`).

## Example usage

1. First, you need to set up a webhook to monitor account status updates. Specifically, you should look for the "CREDENTIALS" status change, which indicates that an account requires reconnection.
2. Upon detecting the "CREDENTIALS" status update, send an email to the user. In this email, provide a link that will allow them to initiate the reconnection process. Ensure that the email contains clear instructions and reassures the user about the security of the process.
3. When the user clicks on the reconnection link in the email, they should be directed to your backend service. This backend service generates a hosted Auth Wizard link using the Unipile API
4. After generating the hosted Auth Wizard link, redirect the user to this link. The user will follow the authentication steps to reconnect their account securely.

***

# Custom Domain URL (White-label)

You can use your own subdomain (e.g. `auth.yourapp.com`) to replace Unipile’s default URL.

This feature is only available for Unipile account with active subscription.

## 1. Configure your DNS

1. Create a **CNAME record** in your domain’s DNS configuration:
   * **Name**: the subdomain you want to use (e.g. `auth`)
   * **Type**: `CNAME`
   * **Target**: `account.unipile.com.` (final dot is optional depending on your registrar)

2. Verify DNS propagation before contacting us:
   * Use a tool such as [whatsmydns.net](https://www.whatsmydns.net/) or `dig` to check that the CNAME is correctly set up and publicly visible.
   * The CNAME must correctly point to `account.unipile.com`, otherwise SSL certificate generation will fail.

**Tip:** DNS propagation can take up to **24 hours** depending on your domain provider.

## 2. Validation by Unipile

Once the CNAME is active and publicly visible:

* Contact our support team and provide the **full URL** (e.g. `https://auth.yourapp.com`).
* We will finalize the configuration and generate the SSL certificate.

## 3. Rewrite the received link

Once Unipile support has confirmed your CNAME configuration on our side, you can replace our domain with yours in the hosted auth URL (received from your hosted auth creation link call) before redirecting your end users.
<!-- ===== SOURCE: https://developer.unipile.com/docs/native-auth ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/linkedin ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/whatsapp ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/telegram ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/instagram ===== -->
---

# Instagram Guide

Learn how to implement a custom Instagram authentication form into your application.

# Step 1: Authenticate to Instagram

## Retrieving your Instagram credentials

To perform an authentication for Instagram, a user need its **INSTAGRAM** username and password. Authentication via Facebook credentials is not supported at the moment.

## Authentication

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```javascript
const response = await client.account.connectInstagram({
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
  "provider": "INSTAGRAM",
  "username": "unipile",
  "password": "********"
}
'
```

# Step 2 : Handle 2FA checkpoint

If an Instagram account has the two-factor authentication activated, you will encounter a checkpoint through a 202 status. Here’s an example of a checkpoint response.

```json
{
  "object": "Checkpoint",
  "account_id": "098dez89d",
  "checkpoint": {
    "type": "2FA"
  }
}
```

In this case, a new ***Authentication Intent*** starts. **This intent last 5 minutes and checkpoints must be solved in this time frame**.

# Step 3 : Solve 2FA checkpoint

To solve the 2FA checkpoint, make a POST request to the Unipile API using the [Solve checkpoint endpoint](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint) or use an SDK Method by giving the `account_id` returned by the first request

```javascript
const response = await client.account.solveCodeCheckpoint({
  provider: "INSTAGRAM",
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
  "provider": "INSTAGRAM",
  "account_id": "098dez89d",
  "code": "******"
}
'
```

The response of this request will indicate if the account is successfully connected.

# Step 4 : Handle Intent Timeout

If the user takes more than 5 minutes to solve the checkpoint, the account will not be connected. Any subsequent request to solve a checkpoint outside a 5 minutes time frame will first respond a 408 - Request Timeout, then a 400 - Bad Request as the ***Authentication Intent*** will self destroy.
<!-- ===== SOURCE: https://developer.unipile.com/docs/twitter-x-guide ===== -->
---

# X (Twitter) Guide

Historical X/Twitter authentication guide, deprecated in v1. X/Twitter support is coming soon in v2.

> ⚠️ X/Twitter is deprecated in v1 and is no longer maintained in this version. X/Twitter support is coming soon in [v2](https://developer.unipile.com/v2.0/docs/welcome).

The connection steps and examples below are retained for historical reference only and do not indicate current availability.

# Step 1: Authenticate to X - Twitter

## Retrieving your X - Twitter credentials

To perform an authentication for Twitter, a user need its **X - TWITTER** username **or** phone number **or** mail and password.

## Authentication

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```javascript
const response = await client.account.connectTwitter({
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
  "provider": "TWITTER",
  "username": "unipile",
  "password": "********"
}
'
```

# Step 2 : Handle 2FA checkpoint

If an Twitter account has the two-factor authentication activated, you will encounter a checkpoint through a 202 status. Here’s an example of a checkpoint response.

```json
{
  "object": "Checkpoint",
  "account_id": "098dez89d",
  "checkpoint": {
    "type": "2FA"
  }
}
```

In this case, a new ***Authentication Intent*** starts. **This intent last 5 minutes and checkpoints must be solved in this time frame**.

# Step 3 : Solve 2FA checkpoint

To solve the 2FA checkpoint, make a POST request to the Unipile API using the [Solve checkpoint endpoint](https://developer.unipile.com/reference/accountscontroller_solvecheckpoint) or use an SDK Method by giving the `account_id` returned by the first request

```javascript
const response = await client.account.solveCodeCheckpoint({
  provider: "TWITTER",
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
  "provider": "TWITTER",
  "account_id": "098dez89d",
  "code": "******"
}
'
```

The response of this request will indicate if the account is successfully connected.

# Step 4 : Handle Intent Timeout

If the user takes more than 5 minutes to solve the checkpoint, the account will not be connected. Any subsequent request to solve a checkpoint outside a 5 minutes time frame will first respond a 408 - Request Timeout, then a 400 - Bad Request as the ***Authentication Intent*** will self destroy.
<!-- ===== SOURCE: https://developer.unipile.com/docs/messenger ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/imap-guide ===== -->
---

# IMAP Guide

Learn how to implement a custom IMAP authentication form into your application.
Find the [Developper IMAP API Guide](https://www.unipile.com/the-developers-guide-to-imap-api-solution/)

# Step 1: Authenticate to IMAP

Make a POST request to [this Unipile API endpoint](https://developer.unipile.com/reference/accountscontroller_createaccount) or use the appropriate SDK Method.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/accounts \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "provider": "MAIL",
  "imap_user": "yourmail@unipile.com",
  "smtp_user": "yourmail@unipile.com",
  "imap_password": "***",
  "smtp_password": "***",
  "imap_host": "your imap server provider",
  "smtp_host": "your smtp server provider",
  "imap_port": 993,
  "smtp_port": 465,
  "imap_encryption": "SSL"
}
'
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/message-payload ===== -->
---

# Message object

This section will explain in detail each field of the message object so you can properly integrate them in your application

## id

Unique identifier of the message for Unipile.

Can be used to prevent duplicate entries.

## chat\_id

Unique identifier of the parent chat for Unipile.

Can be used to retrieve the parent chat.

## provider\_id

Unique identifier of the message for the provider.

Can be use to reference the message in the native web app of the provider.

## chat\_provider\_id

Unique identifier of the parent chat for the provider.

Can be use to reference the chat in the native web app of the provider. For exemple, if you need a link "Open chat in LinkedIn".

## account\_id

Unique identifier of the parent account.

## text

Textual body of the message.

***Unipile does not support formatted text yet and will return plain text.***

## attachments

List of attachments.

## sender\_id

Unique identifier of the sender for the provider.

The format is specific to each provider, it can be a phone number, an email, a username or an ID.

Can be used to match attendees if any. In cases you don't have the attendee, you can still display this sender\_id to identify the sender.

<Image src="https://files.readme.io/359372b-sender_id.png" align="center" width="500px" />

## timestamp

Provider's server acknowledge datetime.

Can be used as message sent date.

<Image src="https://files.readme.io/4234a93-timestamp.png" align="center" width="500px" />

## is\_sender

Boolean telling if the message sender is the account's user or someone else.

Can be used to design a message bubble.

## seen

> Per provider support

If `is_sender` is true, Boolean telling if the message has been seen / read by at least one recipient.

If `is_sender` is false, Boolean telling if the message has been seen / read by the connected user, which can be the case if the message is get after being seen on another app or device.

## seen\_by

> Per provider support

List of message read receipts.

The key is the provider's user id, and the value can be a boolean telling if the message has been seen / read by this user, or a timestamp telling when it was seen / read.

## delivered

> Per provider support

Boolean telling if the message has been delivered to the recipient. Note that, depending on the provider, it does not guarantee that it's delivered to the recipient, but only to the provider's server.

## hidden

Boolean telling if the message should be hidden in the conversation view.

For exemple, messages of type "John reacted 👍 to your message" are hidden, but visible as last message in chat lists.

<Image src="https://files.readme.io/3a08e4b-hidden.png" align="center" width="800px" />

## deleted

Boolean telling if the message has been deleted.

Can be used to replace the content of a message by a generic "Message deleted"

## deleted\_for

> Per provider support

Who the message was deleted for. Present only when deleted is 1.

* "me": the account deleted the message for itself only (Delete for me).&#x20;

* "everyone": the message was removed for all participants (Delete for everyone).&#x20;

## edited

> Per provider support

Boolean telling if the message has been edited.

## is\_event

Boolean telling the message is not an actual user message, but an event, specified by `event_type`.

## event\_type

If `is_event` is true, the type of event. Unipile support the following events :

* A user reacted to a message (`1`)

* A user reacted to owner message (`2`)

* The group was created (`3`)

* The group has changed title (`4`)

* A new participant was added to the group (`5`)

* A participant was removed from the group (`6`)

* A participant left the group (`7`)

* Missed voice call (`8`)

* Missed video call (`9`)

* A call was received (`10`)

* A call was sent (`11`) (not received with Whatsapp)

* A call ended (`12`)

* A call was accepted (`13`)

Some providers shows other kinds of events. Unipile does not support them yet and will set `event_type` as `0`.

## message\_type

Indicates the subtype of the message when it carries additional semantic meaning beyond a standard text message. null for regular messages.

Supported values:

*LinkedIn*

`MESSAGE` — Standard direct message

`INVITATION` — Connection invitation

`INMAIL` — InMail message

`INMAIL_DECLINE` — InMail declined

`INMAIL_REPLY` — Reply to an InMail

`INMAIL_ACCEPT` — InMail accepted

*Instagram*

`STORY_MENTION` — The sender mentioned the account owner in their story

`STORY_REPLY` — The sender replied at one of the owner story

*WhatsApp*

`STORY_REPLY` — The sender replied at one of the owner story

## reactions

A list of reactions to the message.

| key        | value                                                          |
| :--------- | :------------------------------------------------------------- |
| value      | The reaction, 👍 for exemple                                   |
| sender\_id | The provider's user id of who reacted                          |
| is\_sender | Boolean telling if the reaction was sent by the connected user |

## quoted

Quoted message details if any.

*Note that some providers (ex:WhatsApp) use the term "reply" in their UI, but Unipile prefer to use the term "quote" to distinguish it from threaded replies.*
<!-- ===== SOURCE: https://developer.unipile.com/docs/send-messages ===== -->
---

# Send Messages

Learn how to send messages with Unipile

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

# Send a message in an existing Chat / Group

Use the [`POST chats/{chat_id}/messages`](https://developer.unipile.com/reference/chatscontroller_sendmessageinchat) Method or use the appropriate SDK Method, to send a message by providing a `chat_id` you can find by retrieving chats lists, or when receiving a message to automate replies on Webhook trigger.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats/9f9uio56sopa456s/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form 'text=Hello world !'
```
```javascript
const response = await client.messaging.sendMessage({
  chat_id: "9f9uio56sopa456s",
  text: "Hello world !"
})
```

<Callout icon="📘" theme="info">
  If you want to send a message into an existing chat using an attendee identifier, you can read the next section, but if you have the choice, always prefer the usage of `chat_id`.
</Callout>

***

# Send a message to a User

There is two cases where you want to send a message to a User instead of in a Chat:

* You don't have access to the id of the existing chat
* The connected account does not have a conversation history this specific user, so there is no existing chat and you must start a new chat.

To send a message to a User, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method.

In the `account_id` field, provide the ID of the connected account to send the message from. In the `attendees_ids` field, give one user's **Provider internal ID**. Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The method will send a message in a 1 to 1 chat, and:

* If the chat does not exist, it will be created, synced, and returned
* If the user was not an attendee yet, it will be synced

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Yk08cDzzdsqs9_8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
```
```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
})
```

## LinkedIn specific use cases

With Linkedin, unless InMail, you can start new chats only with your Relations. You can use Unipile to invite people to be in your Relations : [Send a contact invitation](https://developer.unipile.com/reference/userscontroller_adduserbyidentifier)

If you have a Premium LinkedIn account and want to send InMails, set the `inmail` property to true in the payload. You have to consider the account type of user (with /me route or GET account) to use to good API (classic/recruiter/sales\_navigator)

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Asdq-j08dsqQS89QSD \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form linkedin[api]=classic \
     --form linkedin[inmail]=true \
```
```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
  options: {
    linkedin: {
      api: 'classic',
      inmail: true
    }
  }
})
```

***

# Send attachments

You can provide an additional attachment to the request body to send attachments along your text message.

Limitations may vary depending on the provider, but the standard maximum size is 15MB. You can send documents in PDF, image, or video formats.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=sSR22ds5dd_ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form 'attachments=@C:\Documents\cute_dog.png'
```

***

# Create a group chat

To start a new group chat, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method and provider a list of user's **Provider internal ID** in `attendees_ids` along an optional `title` for the group name.

Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The chat and its group participants will be synced.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=k0_s8cdss9Dz8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=33600000000@s.whatsapp.net \
     --form attendees_ids=33600000001@s.whatsapp.net \
     --form subject=Vacation
```

***
<!-- ===== SOURCE: https://developer.unipile.com/docs/get-messages ===== -->
---

# Retrieving messages

Learn how to retrieve messages of your connected accounts.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

# Get message history of a chat

To get existing messages in a chat, use the [`GET`chats/\{chat\_id}/messages ](https://developer.unipile.com/reference/chatscontroller_listchatmessages) Method or the appropriate SDK Method with a valid `chat_id`.

Most recent messages will be returned first, ordered by date.

By default, the limit of returned messages is set to 100.

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/chats/{CHAT_ID}/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'
```
```javascript
const response = await client.messaging.getAllMessagesFromChat({
  chat_id: "e9d087d67",
});
```

*This method use[pagination](https://developer.unipile.com/docs/api-usage).*

# Get new messages

Unipile's API give you two options to receive messages in your application

## In realtime with Webhooks

The recommended approach to listen for new messages in your application is by using a Webhook because they trigger in real time. Whenever the user account **receives** or **sends** a new message, the Webhook will call your specified URL with the given message that you can store to be displayed.

-> [More informations on new messages webhooks](https://developer.unipile.com/docs/new-messages-webhook)

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /messages](https://developer.unipile.com/reference/messagescontroller_listallmessages) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated messages. In this case, implementing a unique ID verification on your history entry based on the message ID can help prevent duplicate entries.*
<!-- ===== SOURCE: https://developer.unipile.com/docs/users-overview ===== -->
---

# Users overview

A user is a provider's user. They are the Attendees in chats.

# Identifiers

Users have 2 identifiers:

* A **Provider internal ID**, which is the ID used internally by the provider to identify the user and used in Unipile to reference attendees of resources. For exemple in [Message object](https://developer.unipile.com/docs/message-payload).
  * *Linkedin*   (regular user): Last part of the **internal** profile URL : linkedin.com/in/**ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ**
    *Each user has a multiple fixed provider ID for Classic, Recruiter and Sales Navigator, they start differently and you need to convert it with get profile route using the right "api" parameter for sending message in each product.:
    Sales Navigator: ACw\...
    Recruiter: AE...
    Classic: ACo...*(and since few time ADo...)
  * *Whatsapp* : 0000000000\@lid
  * *Instagram*: A sequence of numbers like 013456789 (You can get the Instagram provider’s internal ID from a username by using the `GET /users/{identifier}` route.)
  * *Telegram*: A sequence of numbers like 013456789 (You can get the Telegram provider’s internal ID from a username by using the `GET /users/{identifier}` route.)
  * *X - Twitter :*  A sequence of numbers like 013456789 (You can get the X provider’s internal ID from a username by using the `GET /users/{identifier}` route.)

* A **Provider public ID**, which is the public ID used by the users to share their profile. It can be found as:
  * *Linkedin*  (regular user) : Last part of the **public** profile URL : linkedin.com/in/**satyanadella**
  * *Linkedin* (company) : Last part of the **public** profile URL : linkedin.com/company/**microsoft**
  * *Whatsapp* : [33600000000@s.whatsapp.net](#)  *(The WhatsApp provider's internal ID is deterministic, its number + suffix @s.whatsapp.net. You can test if a number has WhatsApp by using the`GET /users/{identifier}` route.)*
  * *Instagram*: A username : unipile
  * *Telegram*: Phone number: 33600000000
  * *X - Twitter*: A username : @UnipileApp (with or without the @)

# Attendees

Since it's impossible to sync the millions of users of a provider, Unipile only sync "know users" that we call Attendees.

They have an additional identifier, a **Unipile ID**, which is a unique ID used in Unipile to reference attendees of resources, for exemple in Group Participants.

Unipile consider users as known (therefore as Attendees) if you have a relation with them (through contacts or chats) so you can easily retrieve them from those relational elements. Therefore, they are one of the following

* Contacts of the connected account (known as ***Relations*** in LinkedIn, known as ***Friends*** in Facebook)
* Public non-contacts with whom the connected account has an existing chat
* Public non-contacts who participate in the same groups as the connected account

# Unknown Users

Unknown are all the rest:

* Public non-contact without an existing chat
* Private users

They become known (therefore a synced Attendee) as soon as you start a chat with them.
<!-- ===== SOURCE: https://developer.unipile.com/docs/retrieving-users ===== -->
---

# Retrieving users

*Feature available for :**Linkedin, WhatsApp, Instagram, Telegram***

# Get an Attendee

Once you have chat and messages, you might want to match them with Users. Use the [GET /chat\_attendees/\{id}](https://developer.unipile.com/reference/chatattendeescontroller_getattendeebyid) or [GET /chat\_attendees](https://developer.unipile.com/reference/chatattendeescontroller_listallattendees) API Methods or the appropriate SDK Methods.

# Get a User with a public identifier

You can retrieve a user profile, including its **Provider Internal ID** providing the **Provider Public ID** by using the [GET /users/\{provider\_public\_id}](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) API Method or the appropriate SDK Method.

This can be useful to start new chats with unknown users.

If the user is [unknown](https://developer.unipile.com/docs/users-overview), this method does not sync the user into Unipile. It's a just a proxy to the provider. This means he will not appear in attendees lists unless you start a new chat with him.

# Get a public identifier from an Attendee

For now, public identifiers are not present in Attendees, so you can use the [GET /users/\{provider\_id}](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) Method or the appropriate SDK Method to find it by passing the **Provider Internal ID** found in Attendees and Messages

Be careful how you implement  action GET /users/\{provider\_id/provider\_public\_id}, please have a look on [Provider limits and restrictions](https://developer.unipile.com/docs/provider-limits-and-restrictions)

# Example of retrieving a full LinkedIn profile

## Using route [Retrieve a profile](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier)

You need to have already connected your LinkedIn account to proceed with this request. Make sure to use the account\_id in each request.\
If you want to retrieve this profile: <https://www.linkedin.com/in/satyanadella/> , you should use only the last part of the URL "satyanadella" as identifier. You can use provider\_id as identifier too, example ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ.\
We use the parameter "linkedin\_sections"="\*" to retrieve all data of the profiles like experience, skills, about...

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/users/satyanadella?linkedin_sections=%2A&account_id=3H-KVe-mQ2GT9M0hKSkgHgs \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
```
```typescript Node SDK
await client.users.getProfile({
  account_id: '3H-KVe-mQ2GT9M0hKSkgHgs',
  identifier: 'julien-crepieux',
});
```

## Result

```json
{
	"object": "UserProfile",
	"provider": "LINKEDIN",
	"provider_id": "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
	"public_identifier": "satyanadella",
	"member_urn": "19186432",
	"first_name": "Satya",
	"last_name": "Nadella",
	"headline": "Chairman and CEO at Microsoft",
	"primary_locale": {
		"country": "US",
		"language": "en"
	},
	"is_open_profile": true,
	"is_premium": true,
	"is_influencer": true,
	"is_creator": true,
	"is_relationship": false,
	"network_distance": "THIRD_DEGREE",
	"is_self": false,
	"websites": [
		"https://snscratchpad.com/"
	],
	"follower_count": 11888916,
	"connections_count": 831,
	"location": "Redmond, Washington, United States",
	"profile_picture_url": "https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1579726625423?e=1775088000&v=beta&t=Ke9Wy1fa4eAgmuIdSmUPQg85GN-VoyFApO_SsW5cE5I",
	"profile_picture_url_large": "https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1579726625483?e=1775088000&v=beta&t=H-7LfJ2hU-6Dg0eu-bVNKYcrKkcE_n4Wua1h7cb9mzc",
	"background_picture_url": "https://media.licdn.com/dms/image/v2/D5616AQFuhBYf-ocZug/profile-displaybackgroundimage-shrink_200_800/B56ZeD5uqRGQAY-/0/1750264638752?e=1775088000&v=beta&t=bcEcaplw3US6QTZgh-QUcEadmklqCGP55bAqrZ1uG-o",
	"education_total_count": 3,
	"education": [
		{
			"school_id": "8398",
			"school": "The University of Chicago Booth School of Business",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/D560BAQFZO05jhYKSkw/company-logo_200_200/company-logo_200_200/0/1692627816910/universityofchicagoboothschoolofbusiness_logo?e=1775088000&v=beta&t=fhSQymVMLTTrUVveNXRwmHsRe3xkU2-rZEVQRSsSNSE",
			"start": "1/1/1994",
			"end": "1/1/1996"
		},
		{
			"degree": "Bachelor’s Degree, Electrical Engineering",
			"school_id": "577550",
			"school": "Manipal Institute of Technology",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/C510BAQH66KkTTZFJ2A/company-logo_200_200/company-logo_200_200/0/1630615963889/manipal_institute_of_technology_logo?e=1775088000&v=beta&t=sY6G7ams2UJUCnx7Kd18rZPeTbcLCcbKs5EdbMsbXm4",
			"start": null,
			"end": null
		},
		{
			"degree": "Master’s Degree, Computer Science",
			"school_id": "166690",
			"school": "University of Wisconsin-Milwaukee",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/D4D0BAQE47QlO_LG8SQ/company-logo_200_200/company-logo_200_200/0/1729615751602/uwmilwaukee_logo?e=1775088000&v=beta&t=zHNvcNj0G6oeXcIp3SEc5cvjzOuEpF3GlsLX2qvf2TE",
			"start": null,
			"end": null
		}
	],
	"work_experience_total_count": 5,
	"work_experience": [
		{
			"company_id": "1035",
			"company": "Microsoft",
			"position": "Chairman and CEO",
			"location": "Greater Seattle Area",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/D560BAQH32RJQCl3dDQ/company-logo_200_200/B56ZYQ0mrGGoAM-/0/1744038948046/microsoft_logo?e=1775088000&v=beta&t=IU8z-ovPIfLA6desCvsvN81PkiQ9dC8YJehCWbSpeaE",
			"skills": [],
			"start": "2/1/2014",
			"end": null
		},
		{
			"company_id": "3881",
			"company": "University of Chicago",
			"position": "Member Board Of Trustees",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQHbp_dv8CAlpQ/company-logo_200_200/company-logo_200_200/0/1630577480920/uchicago_logo?e=1775088000&v=beta&t=gZcfr87KIOB5Q1O96545PeXLBBdJwqkCts9zJ5ZM5kU",
			"skills": [],
			"start": "1/1/2018",
			"end": null
		},
		{
			"company_id": "2271",
			"company": "Starbucks",
			"position": "Board Member",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQEQxk9y2rk7Hw/company-logo_200_200/company-logo_200_200/0/1631316692275?e=1775088000&v=beta&t=gPReGwzVY-7kTU7YmIb3bf1ChroCSzQYgIuTlbB9Sxg",
			"skills": [],
			"start": "1/1/2017",
			"end": "1/1/2024"
		},
		{
			"company_id": "5301945",
			"company": "The Business Council U.S.",
			"position": "Chairman",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQGcnaZNpjMvrw/company-logo_200_200/company-logo_200_200/0/1630557702704/the_business_council_us_logo?e=1775088000&v=beta&t=gdGrYqTpAGt4z25joyshjNr6JsC5hPNpqtm3Xx3q7B4",
			"skills": [],
			"start": "1/1/2021",
			"end": "1/1/2023"
		},
		{
			"company_id": "7158",
			"company": "Fred Hutch",
			"position": "Board Member",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/D4D0BAQGF4eOou62nvQ/company-logo_200_200/company-logo_200_200/0/1664795263764/fredhutch_logo?e=1775088000&v=beta&t=96Fe9OEO_KUOqLHRZEdGOLH4c_q2QnrVwGtC-eapSSo",
			"skills": [],
			"start": "1/1/2016",
			"end": "1/1/2022"
		}
	],
	"skills_total_count": 0,
	"skills": [],
	"languages_total_count": 0,
	"languages": [],
	"certifications_total_count": 0,
	"certifications": [],
	"summary": "As chairman and CEO of Microsoft, I define my mission and that of my company as empowering every person and every organization on the planet to achieve more.",
	"volunteering_experience_total_count": 0,
	"volunteering_experience": [],
	"projects_total_count": 0,
	"projects": [],
	"recommendations": {
		"given_total_count": 1,
		"given": [
			{
				"caption": "May 3, 2010, Satya managed Ken directly",
				"text": "Ken is one of the solid engineering managers I have worked with.  Ken has the rare combination of skills/talent that one looks for in engineering leadership – attention to detail and also drive for innovation.  Ken also has a solid track record of recruiting and retaining good talent.  Overall it was a pleasure working with Ken and would love to have the opportunity to work together again.",
				"actor": {
					"first_name": "Ken",
					"last_name": "Moss",
					"provider_id": "ACoAAACv_-sB5Ql4SvCZjwLgDeGUZjlW_V0nnKU",
					"public_identifier": "iamkenmoss",
					"headline": "Bringing the magic of software and AI to help as many people around the world as possible",
					"public_profile_url": "https://www.linkedin.com/in/iamkenmoss",
					"profile_picture_url": "https://media.licdn.com/dms/image/v2/C5603AQFr7695HjAeXw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1633122939776?e=1775088000&v=beta&t=3zM7QQ6VBwQTRpajvyT5_a4i0L5yaP_eKvs5zc2EWes"
				}
			}
		],
		"received_total_count": 0,
		"received": []
	},
	"hashtags": []
}
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/invite-users ===== -->
---

# Invite users

*Feature available for :**Linkedin***

# Send an invitation to a User

If your are not in relation with a user you can invite him to connect.

To send an invitation to a User, use the [`POST /users/invite`](https://developer.unipile.com/reference/userscontroller_adduserbyidentifier) Method or the appropriate SDK Method.

In the `account_id` field, provide the ID of the connected account to send the message from. In the `provider_id` field, give one user's **Provider internal ID**. Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

> Please have a look on [Provider limits and restrictions](https://developer.unipile.com/docs/provider-limits-and-restrictions)

# Example of Inviting Someone on LinkedIn

You need to have already connected your LinkedIn account to proceed with this request. Make sure to use the account\_id in each request. Note that you can't use a new account for testing, as LinkedIn restricts sending invitations from accounts with low connection history or engagement.

## Step 1 - Convert Public ID to Provider ID

For instance, if you want to invite this profile: [https://www.linkedin.com/in/satyanadella/](https://www.linkedin.com/in/satyanadella//) , you should use only the last part of the URL in the [Retrieve a profile](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) route

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/users/satyanadella?account_id=3H-KVe-mQ2GT9M0hKSkgHgs \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' 
```
```typescript Node SDK
await client.users.getProfile({
  account_id: '3H-KVe-mQ2GT9M0hKSkgHgs',
  identifier: 'julien-crepieux',
});
```

The response will include the profile information, and you need to collect the provider\_id (ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ) for the next step. For example:

```json
{
	"object": "UserProfile",
	"provider": "LINKEDIN",
	"provider_id": "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
	"public_identifier": "satyanadella",
	"member_urn": "19186432",
	"first_name": "Satya",
	"last_name": "Nadella",
  "headline": "Chairman and CEO at Microsoft"
[...]
}

```

## Step 2 - Send the invitation

Now that you have the provider\_id, you can proceed to[ send the invitation](https://developer.unipile.com/reference/userscontroller_adduserbyidentifier)

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/users/invite \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '{
    	"provider_id": "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
    	"account_id": "tvKrFOnCQEeTTpO3GNklng",
        "message": "Hello\nWorld"
    }'
```
```typescript Node SDK
await client.users.sendInvitation({
  account_id: '3H-KVe-mQ2GT9M0hKSkgHgs',
  provider_id: 'ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E',
  message: 'Hello',
});
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/webhooks-2 ===== -->
---

# Webhooks overview

Webhooks in Unipile are a robust feature that enables your application to stay informed in real-time whenever specific events occur within the Unipile system. Unlike periodic polling, where your application checks for updates, webhooks employ a push notification protocol, ensuring that you receive immediate notifications when something changes. Unipile makes webhook integration effortless by sending an HTTP POST request to a URL of your choice, allowing you to configure your application to respond promptly to these notifications.

# Create Webhooks

There is two ways of creating Webhooks:

* Using the [`POST` /webhooks](https://developer.unipile.com/reference/webhookscontroller_createwebhook) Method or the appropriate SDK Method
* In Unipile's Dashboard

# Retries

Make sure to reply a status code 200 in less than 30sec as a Webhook makes five retry attempts when the HTTP response code is not equal to 200 in less than 30sec, with an incremental time delay between each attempt.

# Webhooks types

Unipile provide four types of Webhooks:

* [Account status updates](https://developer.unipile.com/docs/account-lifecycle)
* [New messages](https://developer.unipile.com/docs/new-messages-webhook)
* [New emails](https://developer.unipile.com/docs/new-emails-webhook)
* [Tracking email](https://developer.unipile.com/docs/tracking-email)
* [New relation](https://developer.unipile.com/docs/detecting-accepted-invitations#webhook-accepted-invitation)

# Webhook Content-Type

Unlike webhook created from Dashboard, webhook created by API does not contain header content type JSON by default. Some applications like Bubble, Make... need a header content-type to receive good JSON. You can use "headers" parameter to set it.

```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/webhooks \
     --header 'X-API-KEY: XXXXXXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '{ 
  "request_url": "https://endpoint",
  "source": "messaging",
  "headers": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ]
}'
```

# Authentication

You can add header with a secret key to authenticate webhook coming from Unipile

```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/webhooks \
     --header 'X-API-KEY: XXXXXXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '{ 
  "request_url": "https://endpoint",
  "source": "messaging",
  "headers": [
    {
      "key": "Unipile-Auth",
      "value": "yoursecretkey"
    }
  ]
}'
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/account-lifecycle ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/new-messages-webhook ===== -->
---

# New messages

Get real-time updates on new messages using Unipile's Webhook.

*Feature available for: **LinkedIn, WhatsApp, Instagram, Telegram**.*

Unipile's New messages Webhook is a powerful feature that provides real-time notification on new messages, received or sent.

Sent messages are included in message\_received, they can be sent by the connected user from another device or from API. You can compare "account\_info.user\_id" with "sender.attendee\_provider\_id" to know if linked Unipile account is the sender or not.

You will not receive webhooks for old messages upon account connection. However, in the case of reconnection, you will receive messages that arrived during the disconnection period.

Here is an example request payload:

```json
{
  "account_id": "dfXlh46vQYCsMbVarumWlg",
  "account_type": "LINKEDIN", // 'LINKEDIN' | 'INSTAGRAM' | 'WHATSAPP' | 'TELEGRAM'
  "account_info":{
    "type":"LINKEDIN", // 'LINKEDIN' | 'INSTAGRAM'
    "feature":"classic", // 'organization' | 'sales_navigator' | 'recruiter' | 'classic'
    "user_id":"ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E" 
},
  "event":  "message_received", // 'message_reaction' | 'message_read' | 'message_received' | 'message_edited' | 'message_deleted' | 'message_delivered'
  "chat_id": "R8J-xM9WX7eoHLp6gSVtWQ",
  "timestamp": "2023-09-24T13:49:07.965Z",
  "webhook_name": "Webhook demo",
  "message_id": "ykmhfXlRW0W_cqReJYrfBw",
  "message": "Hello World !",
  "sender": {
    "attendee_id": "C8zaRZTlVcmfnke_Vai4Gg",
    "attendee_name": "Kim Unipile",
    "attendee_provider_id": "ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
    "attendee_profile_url": "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/",
  },
 "attendees": [
    {
      "attendee_id": "12Siz1Vcmfnke_Vai4Gg",
      "attendee_name": "Bastien Unipile ",
      "attendee_provider_id": "AA1212sqqsMQBODyLwZrRcgYhrkCafURGqva0U4E",
      "attendee_profile_url": "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/"
    }
	],
  "attachments": [
    {
      "id": "2-MTY5MzQ3ODM0MTgxOWI4MDA4My0wMDMmNjg2M2E2MTgtNjM2Yi01OWNkLWFjNmQtYjE3Y2NjNTU5ZWZkXzAxMw==",
      "size": {
        "height": "150",
        "width": "150"
      },
      "sticker": false,
      "unavailable": false,
      "mimetype": "image/jpeg",
      "type": "img",
      "url": "att://iWfwCtGXSr288YQm5MbWVaeGtYNHQyaEZQcVpPbW5PdGNsQQ=="
    },
    {
      "id": "2-SECOND_ATTACHMENT_ID_EXAMPLE",
      "size": {
        "height": "1080",
        "width": "1920"
      },
      "sticker": false,
      "unavailable": false,
      "mimetype": "image/png",
      "type": "img",
      "url": "att://SECOND_ATTACHMENT_URL_EXAMPLE"
    }
  ],
  "reaction": "😄", // only for event "message_reaction"
  "reaction_sender": { // only for event "message_reaction"
    "attendee_id": "C8zaRZTlVcmfnke_Vai4Gg",
    "attendee_name": "Kim Unipile",
    "attendee_provider_id": "ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
    "attendee_profile_url: "https://www.linkedin.com/in/ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E/",
  }
}
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/new-emails-webhook ===== -->
---

# New email

Get real-time updates on new email using Unipile's Webhook.

*Feature available for :****Google, Microsoft, IMAP***

Unipile's New email Webhook is a powerful feature that provides real-time notification on new email, received or sent.

Sent emails are included because they can be sent by the connected user from another device.

Here is an example request payload:

```json
{
  "email_id": "--R9___qXQKIu80oAF0lJA",
  "account_id": "GxwlUMaZTHefegva16XcWw",
  "event": "mail_received", // "mail_sent" | "mail_moved"
  "webhook_name": "webhook name",
  "date": "2023-06-14T23:54:12.000Z",
  "from_attendee": {
    "display_name": "Julien Crépieux",
    "identifier": "julien@unipile.com",
    "identifier_type": "EMAIL_ADDRESS"
  },
  "to_attendees": [
    {
      "display_name": "Arnaud Hartmann",
      "identifier": "arnaud@unipile.com",
      "identifier_type": "EMAIL_ADDRESS"
    }
  ],
  "bcc_attendees": [],
  "cc_attendees": [],
  "reply_to_attendees": [],
  "provider_id": "a3ZWYmFFbE9RazlZLjI4ATe",
  "message_id": "<D8.08.07528.0034A846@unipile.com>",
  "has_attachments": false,
  "subject": "Hello",
  "body": "Hello World",
  "body_plain": "",
  "attachments": [],
  "folders": ["Inbox"],
  "role": "inbox",
  "read_date": null,
  "is_complete": false,
  "in_reply_to": {
    "message_id": "<DB9P251MB0524C459227C8A2AF82CC523C21A2@unipile.com>",
    "id": "GxwlUMaZTHefegva16XcWw"
  },
  "tracking_id": "Z-4Nx5bMR86b9NVCloU1gg",
  "origin": "unipile" // "external"
}
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/tracking-email ===== -->
---

# Tracking email

Get real-time click and open  on sent email using Unipile's Webhook.

*Feature available for :**Google, Microsoft, IMAP***

Unipile's email tracking Webhook is a powerful feature that provides real-time notification on open email or click link in email you sent..

You need to activate parameter on send : <https://developer.unipile.com/docs/send-email#tracking-options>

And create webhook "email\_tracking" from api or directly in dashboard  to start receive event.

Here is an example request payload you will received.

```json
{
  "event": "mail_link_clicked", // "mail_opened"
  "event_id": "s-5DTo49QZ-uGZFij4qQcA",
  "tracking_id": "JRekFgKASkenrTYuB-Myog",
  "date": "2024-05-07T15:12:45.073Z",
  "email_id": "QRN8tKYAXfKv3qilPVNG7w",
  "account_id": "w72IOm5dRCCO2dW4wJUAhw",
  "ip": "123.123.123.123",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "url": "https://mylandingpage.com",
  "label": "My label",
  "custom_domain": "https://mytrackingdomain.com"
}
```

### Custom Domain URL (White-label)

You can establish a CNAME using your own URL (e.g., link.yourapp.com) pointing to s1.lnk-fllw\.com

Once set up, please contact us for authorization. Following approval, you can set the URL in your code in send email request to replace defaut domain link of tracking
<!-- ===== SOURCE: https://developer.unipile.com/docs/detecting-accepted-invitations ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/calendar-webhook ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/emails ===== -->
---

# Email & Calendars overview

The Unipile Email API is designed to offer a robust and secure connection to your users' email inboxes, ensuring seamless access to both historical and real-time email data. This API supports comprehensive bi-directional synchronization with full CRUD (Create, Read, Update, Delete) functionalities for a wide range of email providers. Featuring a user-friendly REST interface, the Unipile Email API enables you to execute various operations effectively:

* Retrieve details from email messages and threads, including the content of the message, details about the sender and recipients, and other relevant information.
* Efficiently organize email inboxes by utilizing labels and folders.
* Modify the status of email messages, such as marking them as unread or starring them for importance.
* Send email directly through the API.
* Searches within inboxes to locate specific emails or content.
* Handle and download attachments associated with emails.

With Google and Microsoft accounts, you can also use the Calendar API to:

* Retrieve and manage calendars and events
* Create events with attendees and an online meeting link
* Receive webhook notifications for events

# Google and Microsoft OAuth Setup

Unipile is compatible with all email providers, including those based on IMAP protocols, without the need for any preliminary configuration. For Google and Microsoft accounts, your integration uses Unipile's OAuth applications by default, so your users can connect their accounts right away, in production.

> 📘 Unipile's Google OAuth application is included in the price
>
> **Using Unipile's Google OAuth application is included in the per-account price, with no extra fees.** You don't need to create your own Google Cloud project or go through Google's verification process to connect Gmail and Google Calendar accounts in production.

Creating your own Google and Microsoft applications is optional: it displays your application's name and logo on the OAuth consent screen instead of Unipile's. In that case, store their credentials in the Unipile Dashboard. Note that Google's verification process can take several weeks before your own application can be used in production.

To gain a comprehensive understanding of this process, you can refer to the [Google provider integration guide](https://developer.unipile.com/docs/google-oauth) and the[ Microsoft provider integration guide](https://developer.unipile.com/docs/microsoft-oauth), tailored for Unipile API.

# Email deliverability

In most cases, major email providers like Google, Microsoft, and IMAP providers automatically configure DKIM, SPF and eventually DMARC when users set up their internal email systems. If you're simply creating a system for email sync and manual sending from your app, you can bypass managing these settings. Just instruct users to connect their email, ensuring they experience the same delivery results as with Outlook or Gmail.

However, if your system involves outreach or automatic sending at higher volumes, it's advisable to verify the proper configuration of these parameters to ensure optimal deliverability at scale.

If your company domain sends more than 5000 emails daily to Google or Yahoo, you need to maintain an abuse complaint rate of 0.3% or lower, or all company emails will be blocked by Google.

All traffic for your domain is included in this limit: newsletters, notifications, internal emails, etc.
<!-- ===== SOURCE: https://developer.unipile.com/docs/microsoft-oauth ===== -->
---

# Microsoft OAuth

# Microsoft OAuth Setup for Unipile

By default, your integration uses Unipile’s OAuth credentials. If you want a full white-label experience when end users connect their Microsoft account from your app, you need to create and use your own Microsoft OAuth credentials by create  your app in Microsoft Entra ID. This is optional and requires extra setup.

## Create Your Free Microsoft Entra ID Account

If you don't already have one, create your free Microsoft Entra ID account. You will use this account to create the Microsoft developer application used for authenticating end-users via OAuth with Unipile.

## Creating an App Registration

* Log in to <https://portal.azure.com> and go to the Microsoft Entra ID (previously Azure Active Directory) service.

<Image src="https://files.readme.io/b7b4591-1-Azure_Active_Directory.png" align="center" />

* Click on "New registration".

<Image src="https://files.readme.io/f22f350-2-new_registration.png" align="center" />

* You will be presented with the following screen:

1. **Name your app** (this name will be visible to customers).
2. **Set the audience for this app to the second option** "Accounts in any organizational directory (Any Microsoft Entra ID - Multitenant) and personal Microsoft accounts (e. g. Skype, Xbox)" to be able to log in to any Office 365 account (business and personal).

## Specifying Redirect URI

Head to the "Authentification" panel and click "Add Uri" on Web part. You need to add 2 URL :

* https\://\{\{YOUR\_DSN}}/api/v1/hosted/microsoft\_auth\_request\_callback (you can find your DSN in top right of Unipile Dashboard, example <https://api1.unipile.com:13211/api/v1/hosted/microsoft_auth_request_callback>
* https\://\{\{YOUR\_DSN **less port**}}/api/v1/hosted/microsoft\_auth\_request\_callback/port\{\{YOUR\_DSN **less domain**}} (you can find your DSN in top right of Unipile Dashboard, example <https://api1.unipile.com/api/v1/hosted/microsoft_auth_request_callback/port13211>

## Specifying API Permissions

Ensure your app has the correct API permissions:

* Head to the "API permissions" panel and click "Add a permission".

<Image src="https://files.readme.io/a90b991-5-Add_a_permission.png" align="center" />

* Choose the Microsoft Graph set of permissions.

<Image src="https://files.readme.io/dcf2d72-6-choose_microsoft_graph.png" align="center" />

* Then add all required **Delegated permissions**: *Mail.ReadWrite, Mail.Send, Mail.Read*

<Image src="https://files.readme.io/724da36-7-add_all_required_Delegated_permissions.png" align="center" />

This is what your application permissions screen should look like.

<Image src="https://files.readme.io/a111759-8-_application_permissions_screen.png" align="center" />

* To use the Calendar feature, you will need the following scopes too :<br />Calendars.ReadWrite<br />Calendars.Read<br />Calendars.Read.Shared<br />Calendars.ReadWrite.Shared<br />You will need to add them in your dashboard scopes settings too.

## Creating OAuth Credentials

* Head to the "Certificates & secrets" panel and click "New client secret".

<Image src="https://files.readme.io/1a3779d-9-_New_client_secret.png" align="center" />

* Name the secret and set an expiration date of "730 days (24 months)", then click "Add" (note reminder on the date on your side to avoid interruption).

<Image src="https://files.readme.io/0187642-10-_the_secret_and_set_an_expiration_date.png" align="center" />

* Copy the secret (column "Value") to a safe place. You won't be able to retrieve it from this page afterward!

<Image src="https://files.readme.io/ba37277-11-Copy_the_secret.png" align="center" />

## Configure Unipile to Use Your Microsoft OAuth Credentials

Go to the Unipile Dashboard and log in.

Choose the Settings menu, and switch to the Microsoft Oauth part.

Copy-paste the Application (Client) ID from the Overview page and the secret (value) from the Clients secrets page and click "Save".

You are now all set to start connecting Microsoft accounts to Unipile.

## Becoming a Verified Publisher

With verification  :

<Image src="https://files.readme.io/2b9f3ff-consent-prompt.png" align="center" />

Without for professional account :

<Image src="https://files.readme.io/f849a4f-Screenshot_from_2024-05-30_11-47-15.png" align="center" />

### Create An Account

* Become a Verified Member of the Microsoft Partner Network (MPN): <https://partner.microsoft.com/en-US/partnership>
* In the first step, choose the "Partner" option, and on the next page, select "Microsoft AI Cloud Partner Program."<br />If you can't select "Microsoft AI Cloud Partner Program," it is because you need a work account. If your company does not have a Microsoft subscription, you need to create one by following the steps in the "To create a new tenant" section of this Microsoft tutorial: <https://learn.microsoft.com/en-us/entra/fundamentals/create-new-tenant><br />You will need a bank card, but you can choose the option not to be invoiced (only for usage you will not use). Complete the process by creating a user on your new tenant, e.g., <partner@yourcompany.onmicrosoft.com>, and restart the partner process with this account.
* Complete all your company information.

### Verify Your Domain

Create a file named "microsoft-identity-association.json" and host it to your website :  https\:// YOUR DOMAIN .com/.well-known/microsoft-identity-association.json

```
  {
   "associatedApplications": [
      {
         "applicationId": "replace me with your app id (client)"
      }
   ]
  }   
```

Click Verify and save domain.

### Add your Partner Global Account (PGA) ID to your Azure App

* Find your PGA ID following these instructions : <https://learn.microsoft.com/en-us/partner-center/account-structure>
* From the Azure portal home page, go to "App Registrations".
* Click on your app and click "Branding & properties".
* At the bottom of the page, enter your ID and click "Save".

When all is completed a  blue checkmark appears next to your publisher display name in the Publisher Verification section.

You can find more details on [this page of Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview)

## If your end user encounters the “Administrator approval required” screen

Method 1 — Approve the Admin Consent Request in Microsoft Entra (Admin Consent Requests)

If the user sees “Administrator approval required”, it means the required consent has not been granted at the tenant level.

➡️ A Microsoft administrator must review and approve the pending admin consent request in Microsoft Entra.

📌 Microsoft documentation: <https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/review-admin-consent-requests>

Method 2 — Complete the OAuth login as an admin and grant tenant-wide consent

As an alternative, the Microsoft administrator can start the OAuth login flow directly from the customer application (where the Microsoft OAuth login is implemented).

During the Microsoft authorization step, the admin must tick the checkbox:

✅ “Consent on behalf of your organization”

This grants consent for the whole organization / all users, which prevents the “Administrator approval required” prompt for other users.

📌 Microsoft documentation (Admin consent section): <https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/troubleshoot-consent-issues#perform-admin-consent>

## Microsoft delegated mailbox support

The hosted account-creation wizard now displays a separate **Microsoft delegated mailbox** option whenever Outlook is enabled and all required delegated-mailbox scopes are available.

Required scopes:

* `Mail.ReadWrite.Shared`
* `Mail.Send.Shared`
* `Contacts.Read.Shared`
* `User.ReadBasic.All`

These scopes must be added alongside the normal Microsoft scopes using either:

* **Settings → Microsoft scopes** for the global configuration; or
* the comma-separated `microsoft_scopes` property when creating a hosted authentication link manually. This one-shot value replaces the global configuration, so include every Microsoft scope required by your integration.

After selecting **Microsoft delegated mailbox**, enter the Microsoft Entra object ID or user principal name (UPN) of the mailbox. Ask your Microsoft 365 administrator to find it under **Microsoft Entra admin center → Identity → Users → All users**. Use the exact Object ID or UPN; do not assume the mailbox email address is its UPN.

For direct account creation, pass this value through the optional `mailbox_id` property. The access token must contain the scopes listed above, and the authenticated user must have the appropriate Exchange permissions.

Omit `mailbox_id` to use the authenticated user’s own mailbox. Existing Outlook accounts remain compatible.
<!-- ===== SOURCE: https://developer.unipile.com/docs/google-oauth ===== -->
---

# Google OAuth

**By default, your integration uses Unipile’s OAuth credentials, included in the per-account price with no extra fees. If you want a full white-label experience when end users connect their Google account from your app, you need to create and use your own Google OAuth credentials. This is optional and requires extra setup.**

> 📘 Unipile's Google OAuth application is included in the price
>
> **Using Unipile's Google OAuth application is included in the per-account price, with no extra fees.** You don't need to create your own Google Cloud project or go through Google's verification process to connect Gmail and Google Calendar accounts in production. Follow this guide only if you want your application's name and logo on the consent screen instead of Unipile's.

# Google OAuth Verification Process Overview

Google has a OAuth Verification process, mandating third-party applications to submit an application to Google for verifying their use of Google user data. You need to undergo Google's app verification process, application whitelisting, and/or a security assessment by external auditors ($500 by year).

**To begin your development, you must complete the initial phase, which involves "Creating a Google Developers Console Account and Project". Once your development is complete, you can then proceed to the second phase: "Generate your Demonstration Video". Following that, you can move on to "Whitelisting & Security Review for Restricted Scopes".**

# Create Google Developers Console Account and Project

Sign up on the [Google Developers Console](https://console.cloud.google.com/) and either create a new project or use an existing Google project.

<Image align="center" border={false} src="https://files.readme.io/7120efa-1-Create_New_Project.png" />

**Navigation Menu -> APIs & Services -> 'Credentials'**

* Navigate to the 'Credentials' section in the Google Developers Console.
* Create 'OAuth Client ID' credentials to gain access to your enabled APIs:
  * **Application type:** Web application
  * **Name:** Your internal name
  * **Add 2 Authorised redirect URIs**:\
    https\://\{\{YOUR\_DSN}}/api/v1/hosted/google\_auth\_request\_callback (you can find your DSN in top right of  [Unipile Dashboard](https://dashboard.unipile.com), example <https://api1.unipile.com:13211/api/v1/hosted/google_auth_request_callback>\
    https\://\{\{YOUR\_DSN **less port**}}/api/v1/hosted/google\_auth\_request\_callback/port\{\{YOUR\_DSN **less domain**}} (you can find your DSN in top right of  [Unipile Dashboard](https://dashboard.unipile.com), example <https://api1.unipile.com/api/v1/hosted/google_auth_request_callback/port13211>\ <br />
  * Click "CREATE"
* Add Client ID and Client Secret to [Unipile Dashboard](https://dashboard.unipile.com) > Settings > Google OAuth

<Image align="center" border={false} src="https://files.readme.io/3aa744c-4-Create_Credentials_OAuth_Client_ID.png" />

**Navigation Menu -> APIs & Services -> Library**

* Go to the 'Library' section in the Google Developers Console.\
  Enable Required API Libraries:\
  Search for and enable all API Libraries that your application will need: **Gmail API**

<Image align="center" border={false} src="https://files.readme.io/94db434-9-Enable_Gmail_API.png" />

* If you want to use Calendar API, you need to enable Google Calendar API too : <https://console.cloud.google.com/apis/library/calendar-json.googleapis.com>

**Navigation Menu -> APIs & Services -> Enabled APIS and Services**

* Access the 'Enabled APIS and Services' section in the Google Developers Console.\
  Check Enabled APIs: Review and verify the full list of APIs you have enabled within your Google Project.\
  The Dashboard provides an overview of all the enabled APIs, allowing you to confirm the status of your selected APIs for your project. Use this section to ensure that the necessary APIs are enabled for a seamless integration with your application.

**Navigation Menu -> IAM & Admin -> IAM**

* Follow these steps to add Unipile as a Project Owner throughout the Verification Process:
  * Click Add: Navigate to IAM (Identity and Access Management) and click "Grant Access."
  * Add Support Email: Add <start@unipile.com> as a Project Owner.
  * Accept Invitation: The Unipile team will subsequently accept the invitation, verifying authorization for the' unipile.com' domain, necessary for hosting the authentication flow.
  * Inform Unipile: Notify your Unipile contact once you've completed this step, and include the name of your Google Project.

**Navigation Menu -> APIs & Services -> OAuth Consent Screen**

Throughout the implementation, you may keep your Google Project in different states:

* 'User Type' as 'Internal': In this mode, your app is limited to Google Workspace users within your organization.
* 'User Type' as 'External' & 'Publishing Status' as 'In Testing':\
  Note: While 'In Testing,' you need to add Test Users. Tokens expire in 7 days and require users to re-authenticate.

For more information on Publishing Status, [click here](https://support.google.com/cloud/answer/10311615#publishing-status).\
For details on User Types, [click here](https://support.google.com/cloud/answer/10311615#user-type).

Ensure that you select the appropriate User Type and Publishing Status based on your project's testing and deployment phase.

<Image align="center" border={false} src="https://files.readme.io/cd1e1b1-17-User_Type.png" />

**OAuth Consent Screen Section -> App Information**

Ensure the following information is provided:

* Enter Your Application Name: Specify your application name.
* User Support Email: Include an email address for users to contact with questions about their consent. Recommend using an alias or distribution list with relevant parties included.
* Add Your App Logo: Upload your application logo for visual identification.

Completing this information in the OAuth consent screen section is essential for users to understand and trust your application during the consent process. Include accurate details and branding elements for a smooth user experience.

<Image align="center" border={false} src="https://files.readme.io/fa91dbb-18-App_Information.png" />

**OAuth consent screen section -> App Domain**

Provide the following information under the App Domain section:

* Application Homepage URL: Add the URL for your application's homepage.\
  Ensure that it is a true homepage and not just a 'login' page.
* Application Privacy Policy Link: Include a link to your application's Privacy Policy.\
  Important: Ensure your legal team reviews the Privacy Policy to meet [Google's specific requirements](https://developers.google.com/terms/api-services-user-data-policy), particularly from the 'Limited Use' section of the provided document.
* Application Terms of Service Link: Add a link to your application's Terms of Service.

<Image align="center" border={false} src="https://files.readme.io/d935ff7-19-App_Domain.png" />

**OAuth consent screen section -> Authorized Domains**

Follow these steps to add authorized domains:

* Add your app domain utilized in your Google Project. Ensure your domain is the production-level one, not the dev/staging domain.
* Add unipile.com domain

<Image align="center" border={false} src="https://files.readme.io/f0c910e-20-Authorized_Domains.png" />

**OAuth consent screen section -> Developer Contact Information**

* Enter an Email Address:
  * Provide an email address for developer contact information.
  * Important: This should be a distribution list email address, ensuring all relevant parties receive Google Verification-related emails and notifications about any changes to your project. Keep this distribution list up-to-date as team members come and go.
* Post-Verification Monitoring:
  * After submission for verification, closely monitor the Google project for any action items from Google.
  * Note: Google sends emails to this address, but they may end up in spam folders or be blocked by servers. Regularly check for updates to avoid missing important communications.

Make sure to enter an actively monitored and regularly checked email address to stay informed about your Google project's status and any required actions post-verification.

<Image align="center" border={false} src="https://files.readme.io/c57e4d6-21-Developer_contact.png" />

**Scopes section**

Follow these steps to add required scopes:

* Click on the 'ADD OR REMOVE SCOPE ' button to access the menu.
* Add the following scopes (if they don't appear in the list, refresh the page) :\
  ./auth/gmail.send\
  ./auth/gmail.labels\
  ./auth/gmail.readonly\
  ./auth/gmail.modify (not needed if you dont want move or delete email. You will have to demonstrate to Google you really use it.  You need to remove it on your dashboard scopes settings too)
* To use the Calendar feature, you will need the following scopes too. Do not add them unless you are integrating them, as Google will require a video demonstrating your integration:\
  ./auth/calendar\
  ./auth/calendar.events

<Image align="center" border={false} src="https://files.readme.io/4b725e1-22-Add_Scopes.png" />

**You may begin your integration now and return here upon its completion.**

# Generate your Demonstration Video

**You may proceed with this step only once your integration is fully completed and operational in production.**

Produce and host a demonstration video that adheres to Google's stipulations. To validate your app with Google, you must also submit a video showcasing your app's functionality. This video should be uploaded as an 'Unlisted' YouTube video for verification purposes, and only one video link is permissible.

## Before crafting the video

* Your app and OAuth flow are presented in English, as indicated in Google documentation under "Apps requesting sensitive scopes" and "Apps requesting restricted scopes."
* The demonstration is conducted in a production-level domain.
* In your Google Project settings, navigate to Navigation Menu -> APIs & Services -> OAuth Consent Screen and confirm the following:
  * Publishing status is set to "In Production."
  * User Type is designated as "External."

## Authentication

* Display your application's homepage with the complete URL, emphasizing its production status.
* Illustrate how a Google customer can connect their account emphasizing the use of the official Google sign-in button.
* During the authentication flow, when presenting the OAuth process screen, highlight the URL and drag across to reveal the CLIENT ID in the URL.

## Functionality

* Sequentially showcase each set of scopes being requested, tailoring them to your specific use case.
* Demonstrate bi-directional functionality by showing synchronization between your application and Gmail. Use separate tabs to toggle between your application and each relevant section of Gmail. For example, sending an email through your application, illustrating how changes are synced in Sent mail list on Gmail, and in the other way displaying the receipt of an incoming email within your app.

By following these guidelines, your demo video will effectively convey the authentication process and the functional capabilities of your application in sync with Google services.

After creating your video demo and ensuring it complies with all the criteria outlined, kindly share the YouTube video URL with your us. We can assist in the review process or  you can proceed to submit your app for verification directly.

Please note the following steps:

* Add the final video to your Google Project as an 'unlisted' YouTube video link.
* Submit the YouTube video URL to your Customer Success Manager for review.
* Following the review, proceed with the app verification submission.

Keep in mind that the verification process duration may vary. After submission, it can take anywhere from 2 to 8 weeks, depending on Google's submission queue and the number of remediation rounds they deem necessary. Stay informed and coordinate with us throughout the verification process.

# Whitelisting & Security Review for Restricted Scopes

If your application utilizes restricted scopes, additional steps are required. Here's a brief overview of what to anticipate:

## Google Security Assessment

To ensure the security of user data, apps requesting access to restricted scope Google user data must undergo a security assessment. This assessment is crucial for verifying that all apps accessing Google user data can handle data securely and delete user data upon request. The detailed assessment process is outlined on the [CASA (Cloud Application Security Assessment) site](https://appdefensealliance.dev/casa?hl=fr).

**Google categorizes your app as either Tier 2 or Tier 3**

* Tier 2 (Self Scanned - Lab Verified) >> Most Common\
  Option of Free OR paid (third-party assessor)\
  CASA Tier 2 Process
* Tier 3 (Lab Scanned - Lab Verified)\
  Paid - Must be completed by a third-party assessor

After receiving your Tier classification, Google will provide instructions and tools for completing the assessment. Refer to the provided link for Google Security Assessment Information and scroll down to the Security Assessment FAQs for more detailed information. Ensure compliance with this process to demonstrate your app's capability in handling user data securely when utilizing restricted scopes.

[Google Security Assessment Information](https://support.google.com/cloud/answer/13463073?visit_id=638369545637867816-4246542157\&hl=en\&rd=1#security-assessment\&zippy=%2Chow-is-my-application-tier-calculated%2Ci-am-in-scope-for-tier-but-i-dont-want-to-scan-my-own-application-what-should-i-do%2Cwhy-is-the-security-assessment-needed%2Cwhat-will-the-security-assessment-include%2Csecurity-assessment)

The cost is \~$500 by year for this certification.

## Yearly Security Re-assessment for Apps with Restricted Scopes

Apps that access restricted scopes must undergo a yearly re-verification process for compliance and complete a security assessment every 12 months to maintain access to verified restricted scopes. This process ensures ongoing adherence to security standards and safeguards user data.

If, at any point, you introduce a new restricted scope that hasn't been previously assessed and approved, your app may require reassessment at that time.

The Google review team will initiate contact via email when it's time for your app to recertify. It is crucial to keep your Project Owner and Project Editor information up-to-date in your Cloud Console. This ensures that the right members of your team receive notifications about this annual enforcement, allowing for timely and smooth compliance with the re-assessment requirements. Stay vigilant and promptly respond to communications from Google to uphold the security and compliance of your app. Check [Google FAQ](https://support.google.com/cloud/answer/13463073?visit_id=638369629699139685-930765199\&hl=en\&rd=1#restricted-scopes\&zippy=%2Chow-is-my-application-tier-calculated%2Ci-am-in-scope-for-tier-but-i-dont-want-to-scan-my-own-application-what-should-i-do%2Cwhy-is-the-security-assessment-needed%2Cwhat-will-the-security-assessment-include%2Chow-will-the-security-assessment-work%2Cwhen-is-the-security-assessment-not-required%2Cwhat-should-i-do-after-i-receive-my-letter-of-assessment-loa-from-the-assessor) for more information.

## Whitelisting Option

If you prefer an alternative to the standard verification and security review processes, you have the option to have your application whitelisted. This allows you to bypass the usual procedures, but it is important to note that this option is applicable only if your application meets very specific criteria. While most use cases do not fulfill these criteria, we have outlined the requirements below for you to assess whether whitelisting might be suitable for your application.

**Requirements:**

* Majority of Customers using Google Workspace:
  * The majority of your customers should use Google Workspace (formerly GSuite) accounts, i.e., have email addresses with the format @company.com.
  * Whitelisting requires action by end users' administrators to allow access. You need to provide to your users' administrators your Google projet Client ID. They have open their Console: <https://admin.google.com/ac/owl/list?tab=configuredApps> and allow you client\_id.
* Limited Personal Gmail Account Usage:
  * Fewer than 100 personal Gmail accounts (@gmail.com addresses) should be able to authenticate into this flow.
  * Unverified projects have a 100 (lifetime) user limit per project. When whitelisted, Google Workspace accounts do not count against this limit. However, personal Gmail accounts will always count towards this limit.
* Free Trial Users and Whitelisting:
  * Free trial users must use their Workspace email address and whitelist the application.\
    Keep in mind that whitelisting is a workaround solution and might not be suitable for all use cases. Evaluate these requirements carefully to determine if your application aligns with the criteria for whitelisting. If so, take the necessary steps to meet these requirements and explore this alternative approach.
<!-- ===== SOURCE: https://developer.unipile.com/docs/email-object ===== -->
---

# Email object

This section will explain in detail each field of the email object so you can properly integrate them in your application

## object

Fixed value "Email"

## id

Unique identifier of the email for Unipile.

Can be used to prevent duplicate entries.

## account\_id

Unique identifier of the parent account.

## date

Provider's server acknowledge datetime.

## from\_attendee

Information on the sender

### from\_attendee.display\_name

Name set by the sender

### from\_attendee.identifier

Email of the sender

### from\_attendee.identifier\_type

Fixed value "EMAIL\_ADDRESS

## to\_attendees

List of "to" recipients of email

### to\_attendees.display\_name

Name of recipient set by the sender

### to\_attendees.identifier

Email of the recipient

### to\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## cc\_attendees

List of "cc" recipients of email

### cc\_attendees.display\_name

Name of recipient set by the sender

### cc\_attendees.identifier

Email of the recipient

### cc\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## bcc\_attendees

List of "bcc" recipients of email

### bcc\_attendees.display\_name

Name of recipient set by the sender

### bcc\_attendees.identifier

Email of the recipient

### bcc\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS

## reply\_to\_attendees

List of "reply\_to" of email

### reply\_to\_attendees.display\_name

Name of recipient set by the sender

### reply\_to\_attendees.identifier

Email of the recipient

### reply\_to\_attendees.identifier\_type

Fixed value "EMAIL\_ADDRESS"

## provider\_id

String of provider\_id value

## subject

Subject of the email.

## body

Content of the email.

## body\_plain

Text content of the email.

## has\_attachments

Boolean, true if have attachment

## attachments

List of attachments

### attachments.id

Unique identifier of the attachment

### attachments.name

Name of the attachment, including extension

### attachments.extension

Extension of the attachment

### attachments.size

Size of the attachment in bytes

### attachments.mime

Mime type of the attachment

## folders

Folders of the email

## role

Role of the folder of the email

## read\_date

Date of first API get email

## is\_complete

Status of email fetching

## headers

Headers of the email if requested

### headers.name

Name of the header

### headers.value

Value of the header
<!-- ===== SOURCE: https://developer.unipile.com/docs/send-email ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/retrieving-emails ===== -->
---

# Retrieving emails

Learn how to retrieve messages of your connected accounts.

*Feature available for :**Google, Microsoft, IMAP***

# Get emails history

To get existing emails, use the [`GET`emails](https://developer.unipile.com/reference/mailscontroller_listmails) Method or the appropriate SDK Method .

Most recent messages will be returned first, ordered by date.

By default, the limit of returned messages is set to 100.

You can use lot of parameters to get only a folder, date, recipient, sender, see [`GET`emails](https://developer.unipile.com/reference/mailscontroller_listmails)

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/emails?limit=10&account_id=5D586za6a-aAaasqXX \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'

```
```javascript
const response = await client.email.getAll({
  account_id: "5D586za6a-aAaasqXX",
  limit: 10
});
```

*This method use[pagination](https://developer.unipile.com/docs/api-usage).*

# Get new emails

Unipile's API give you two options to receive emails in your application

## In realtime with Webhooks

The recommended approach to listen for new messages in your application is by using a Webhook because they trigger in real time. Whenever the user account **receives** or **sends** a new email, the Webhook will call your specified URL with the given email that you can store to be displayed.

-> [More informations on new emails webhooks](https://developer.unipile.com/docs/new-emails-webhook)

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /emails](https://developer.unipile.com/reference/mailscontroller_listmails) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated emails. In this case, implementing a unique ID verification on your history entry based on the email ID can help prevent duplicate entries.*
<!-- ===== SOURCE: https://developer.unipile.com/docs/calendars-and-events ===== -->
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
<!-- ===== SOURCE: https://developer.unipile.com/docs/how-to-create-outreach-sequence ===== -->
---

# How to create an Outreach Sequence

This guide provides best practices for automating your outreach efforts by compiling a list of profiles and sending invitations in bulk on LinkedIn. It also offers strategies to save time during the integration process..

# Origin of the List of Contacts

A typical starting point for an outreach sequence is performing a search on LinkedIn. Users can select profiles they wish to connect with using the standard LinkedIn search or LinkedIn Sales Navigator, applying various filters to refine their search.

Handling the Copy-Pasted URL of Your Search Results :

* Utilize the  [Linkedin Search endpoint](https://developer.unipile.com/docs/linkedin-search) to fetch the search results of your users. Handle direct copy/paste URLs from your users or implement parameter selection in your UI.
* Implement a pagination cursor to gather all result pages, spacing your requests to mimic human activity.
* To compile a list of results or connections, it is recommended to manage a maximum of 1,000 profiles per day (or 2,500 for Sales Navigator accounts), spreading them across several attempts during working hours. For further information, consult the[ LinkedIn limitations](https://developer.unipile.com/docs/provider-limits-and-restrictions). Given the 200 invitations you can send per week, it is unnecessary to accelerate and gather thousands of profiles in a single day.
* Analyze the results and store the data for the next steps.

# Planning Your Sequence

After compiling your list of contacts, schedule the outreach over time, taking into account LinkedIn's limitations on connection requests: 80 to 100 per account per day (with a maximum of 200 per week) and profile visits: 80 to 100 (Premium) or up to 150 (Sales Navigator) per account per day.

For instance, to contact 1,000 profiles, you will need approximately 5 weeks.

It's advisable to distribute the invitations on working days, sending 30 to 50 invitations daily at random intervals.

Manage concurrent sequences carefully; if a user initiates two sequences simultaneously, you should pause the first one or adjust the numbers to adhere to limitations.

The profile retrieval limit is crucial, as it is needed to convert the public provider IDs you've collected into private IDs for sending invitations. This action should be performed shortly before dispatching them throughout the day.

Store all generated slots in your database.

# Sending

When your system reaches a sending slot:

[Retrieve the user's profile](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) to convert the ID, check the relationship status, and personalize your message with the profile data.\
Depending on the relationship status, [send an invitation, ](https://developer.unipile.com/docs/invite-users#example-of-inviting-someone-on-linkedin)[an InMail, or a standard message.](https://developer.unipile.com/reference/chatscontroller_startnewchat)

# Handling Errors in API Responses

It's important to manage errors in the responses from your API calls. For example, if your users send out invitations at the same time, your call could be rejected due to hitting LinkedIn's limitations. In such cases, you need to reschedule your sequence for the following weeks and inform your users accordingly.

# Go further

To increase prospecting volumes and not be capped at the limit of 200 invitations per week, you can incorporate email management into your sequence.
<!-- ===== SOURCE: https://developer.unipile.com/docs/get-raw-data-example ===== -->
---

# Get Raw Data Route Example

Learn how to use Magic  Route

The [Get raw data route](https://developer.unipile.com/reference/linkedincontroller_getrawdata) (Magic route) is intended for advanced users who wish to use LinkedIn's features beyond our current capabilities. It enables you to create custom functionalities that are not yet supported by our platform, using connected accounts. To utilize this route, you will need to identify the specific endpoint containing the desired data using web developer tools on LinkedIn, and then copy the URL along with its parameters for implementation.

# Identify Linkedin Enpoint

* Open your browser's Web Developer Tools and go to the 'Network' tab to capture all requests. Perform the action for which you want to collect data. Identify which request corresponds to the action on LinkedIn, then click on it to view the details.
* Copy the relevant value into our interactive documentation. For instance, if you're searching for people using LinkedIn's main Search:

<Image src="https://files.readme.io/b0ef79e-Screenshot_from_2024-01-19_10-36-08.png" align="center" />

* Confirm that you have received the raw data you want by trying it with our interactive documentation.
* Finally, integrate this data into your code, adjusting the variables for keywords or pagination as necessary.

# Inbox Search

This snippet corresponding to first part of relation search:

<Image src="https://files.readme.io/1f517a5-Screenshot_from_2024-06-24_16-12-30.png" align="center" />

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "query_params": {
    "variables": "(keyword:arnaud,types:List(CONNECTIONS))", 
"queryId":"voyagerMessagingDashMessagingTypeahead.47f3aa32ab0b43221f99db7c350a2cc3"
  },
  "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
  "method": "GET",
  "request_url": "https://www.linkedin.com/voyager/api/graphql",
  "encoding": false
}'
```

# Following someone

You have to change the provider private id in the "request\_url" to the id of the person you want to follow

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "body": {"patch":{"$set":{"following":true}}},
  "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
  "method": "POST",
  "request_url": "https://www.linkedin.com/voyager/api/feed/dash/followingStates/urn:li:fsd_followingState:urn:li:fsd_profile:ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
  "encoding": false
}'
```

# Get own profile viewers

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(start:0,query:(),analyticsEntityUrn:(activityUrn:urn%3Ali%3Adummy%3A-1),surfaceType:WVMP)&queryId=voyagerPremiumDashAnalyticsObject.c31102e906e7098910f44e0cecaa5b5c",
"encoding": false
}'
```

Profiles are in "data.data.premiumDashAnalyticsObjectByAnalyticsEntity.elements\[]" : navigationUrl, title.text (name), subtitle.text, caption.text, label.text (relation level)...

# Get company page viewers

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "account_id": "OWUJPgyeTKizksxIcOh5pQ",
  "request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(analyticsEntityUrn:(company:urn%3Ali%3Afsd_company%3A106589179),surfaceType:ORGANIZATION_VISITORS,query:(selectedFilters:List((key:timeRange,value:List(1770681600000,1773273599999)),(key:resultType,value:List(PAGE_VIEWS)),(key:pageType,value:List(ALL_PAGES)))))&queryId=voyagerPremiumDashAnalyticsView.d24d2e85d8a23d815c7fd94aa8988261",
  "encoding": false
}
'
```

<br />

# Social Selling Index

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"request_url": "https://www.linkedin.com/sales-api/salesApiSsi",
"force_api": true,
"method": "GET"
}'
```

# Retrieve posts from Feed

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?queryId=voyagerFeedDashMainFeed.7a50ef8ba5a7865c23ad5df46f735709"
}'
```

To manage pagination, you need to retrieve the paginationToken from the result at data.data.feedDashMainFeedByMainFeed.metadata.paginationToken.
Then, perform a new request using the start, count, and the paginationToken obtained from the previous results.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(start:20,count:10,paginationToken:99714011-1754950579467-a40e9db9d667b7ce2ba183fc50169e1b,sortOrder:MEMBER_SETTING)&queryId=voyagerFeedDashMainFeed.7a50ef8ba5a7865c23ad5df46f735709"
}'
```

# Invite to an event

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashInvitations",
"method": "POST",
"body": {
"elements": [{
"inviteeMember": "urn:li:fsd_profile:ACoAACQsq45qSVu3WqOYZw8cueJ0isJ5r9v94",
"genericInvitationType": "EVENT"
}]
},
"query_params": {
"inviter": "(eventUrn:urn%3Ali%3Afsd_professionalEvent%3A7315105458780465155)"
},
"headers": {
"x-restli-method": "batch_create"
},
"encoding": false
}'
```

# Delete relation

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "account_id": "91gPYl0eSeY4IClOgJ5FA",
  "method": "POST",
  "request_url": "https://www.linkedin.com/voyager/api/relationships/dash/memberRelationships",
  "query_params": {
    "action": "removeFromMyConnections",
    "decorationId": "com.linkedin.voyager.dash.deco.relationships.MemberRelationship-34"
  },
  "body": {
    "connectionUrn": "urn:li:fsd_connection:ACoAACQsq45qSVu3WqOYZw8cueJ0isJ5r9v94"
  },
  "encoding": false
}'
```

# Invite people to follow your company page

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashInvitations",
"method": "POST",
"body": {"elements":[{"inviteeMember":"urn:li:fsd_profile:ACoAAAAA4McB8YEREZF3LfNq00l1IgqTzd8crg","genericInvitationType":"ORGANIZATION"},{"inviteeMember":"urn:li:fsd_profile:ACoAAAAA3W4B6ERE8pWg_l5gb6bCaBEa_SEGvGc","genericInvitationType":"ORGANIZATION"}]},
"query_params": {
"inviter": "(organizationUrn:urn%3Ali%3Afsd_company%3A38114588)"
},
"headers": {
"x-restli-method": "batch_create"
},
"encoding": false
}'
```

# Retrieve group participants

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(groupUrn:urn%3Ali%3Afsd_group%3A1781615,filters:List(),typeaheadQuery:%27%27,start:0,count:10,membershipStatuses:List(OWNER,MANAGER,MEMBER))&queryId=voyagerGroupsDashGroupMemberships.ba73dc3bdfac0c95c8488fe4b5715048",
"encoding": false
}'
```

<br />

# School Profile

```curl cURL
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(organizationalPageUrn:urn%3Ali%3Afsd_organizationalPage%3A1503,context:ORGANIZATIONAL_PAGE_MEMBER_HOME)&queryId=voyagerOrganizationDashViewWrapper.0b8be97f4f1386a8114db0ef77298c51"
}'
```

# Retrieve repost

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/graphql",
"method": "GET",
"query_params": {
"queryId": "voyagerFeedDashReshareFeed.dc56f7e6b303133b71fdbb584ec2a2a5",
"variables": "(targetUrn:urn%3Ali%3AugcPost%3A7364593029225123456)"
},
"encoding": false
}'
```

# Send “I’m interested” to a company’s job page

Two-step process

1. Retrieve the form content from the first request response

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "query_params": {
      "variables": "(companyUrn:urn%3Ali%3Afsd_company%3A12345)",
      "queryId": "voyagerTalentbrandDashCandidateInterestMember.d831bf85b9873ef0228a2bab19781290"
    },
    "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
    "method": "GET",
    "request_url": "https://www.linkedin.com/voyager/api/graphql",
    "encoding": false
  }'

```

Replace companyUrn with the target company URN, URL-encoded.

In the response, the field you need is called leadGenForm.

2. Submit the form using the leadGenForm retrieved previously

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "query_params": {
      "action": "submit"
    },
    "body": {
      "form": leadGenForm
    },
    "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
    "method": "POST",
    "request_url": "https://www.linkedin.com/voyager/api/voyagerFeedDashLeadGenForm",
    "encoding": false
  }'

```

leadGenForm must be the exact object returned by the first request.

This request submits the form to LinkedIn.

<br />

# People you may know

To select which recommendations to retrieve, update the two option-specific values. For pagination, use pageStart as the cursor and pageSize as the limit.

Same School

```
"cohortReasonSource": "PYMK_SCHOOL_COHORT",
"cohortReasonContext": "SCHOOL",
"cohortReasonRelatedSchoolUrns": [
  {    "schoolId": 43416  }
],
```

Recent activity

```

"cohortReasonSource": "IN_SESSION_RELEVANCE",
"cohortReasonContext": "IN_SESSION_RELEVANCE",
```

Same Job

```
"cohortReasonSource": "PYMK_TITLE_COHORT",
"cohortReasonContext": "TITLE",
"cohortReasonRelatedSuperTitleUrns": [
  { "superTitleId": "564" }
],
```

Same industry

```
"cohortReasonSource": "PYMK_INDUSTRY_COHORT",
"cohortReasonContext": "INDUSTRY",
"cohortReasonRelatedIndustryUrns": [
  {  "industryId": 4  }
],
```

<br />

```
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "GMi9RwTXQ1C3-XCoV0rVOg",
  "request_url": "https://www.linkedin.com/flagship-web/rsc-action/actions/pagination",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "pagerId": "com.linkedin.sdui.pagers.mynetwork.addaCohortSeeAll",
    "clientArguments": {
      "$type": "proto.sdui.actions.requests.RequestedArguments",
      "payload": {
        "cohortReasonSource": "PYMK_SCHOOL_COHORT",
        "cohortReasonContext": "SCHOOL",
        "cohortReasonRelatedSchoolUrns": [
          {
            "schoolId": 43416
          }
        ],
        "shouldUseIndexPaging": true,
        "pageStart": 20,
        "pageSize": 10,
        "isFirstPage": false
      },
      "requestMetadata": {
        "$type": "proto.sdui.common.RequestMetadata"
      },
      "states": [],
      "screenId": "com.linkedin.sdui.flagshipnav.mynetwork.CohortSeeAll"
    },
    "paginationRequest": {
      "$type": "proto.sdui.actions.requests.PaginationRequest",
      "pagerId": "com.linkedin.sdui.pagers.mynetwork.addaCohortSeeAll",
      "requestedArguments": {
        "$type": "proto.sdui.actions.requests.RequestedArguments",
        "payload": {
          "cohortReasonSource": "PYMK_SCHOOL_COHORT",
          "cohortReasonContext": "SCHOOL",
          "cohortReasonRelatedSchoolUrns": [
            {
              "schoolId": 43416
            }
          ],
          "shouldUseIndexPaging": true,
          "pageStart": 20,
          "pageSize": 10,
          "isFirstPage": false
        },
        "requestMetadata": {
          "$type": "proto.sdui.common.RequestMetadata"
        }
      }
    }
  }
}'
```

# Create Sales Navigator List

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "account_id": "YOUR ACCOUNT ID",
    "request_url": "https://www.linkedin.com/sales-api/salesApiLists",
    "method": "POST",
    "body": {
      "name": "List Name",
      "listType": "LEAD", // "LEAD" or "ACCOUNT"
      "role": "OWNER",
      "description": "List Description"
  }
}
```

<br />

# Create Recruiter Project

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "account_id": "YOUR ACCOUNT ID",
    "method": "POST",
    "request_url": "https://www.linkedin.com/talent/api/talentHiringProjects",
    "body": {
      "attachDefaultCandidateHiringPipeline": true,
      "hiringProjectMetadata": {
        "name": "Fancy Project Title",
        "archiveOnNotFitRating": false,
        "hiringPipelineEnabled": false,
        "hasSeenArchiveOnNotFitRatingDialog": false,
        "askForFeedbackOnGoodFit": false,
        "state": "ACTIVE",
        "type": "RECRUITER",
        "projectVisibility": "PRIVATE"
      }
    },
    "encoding": false
  }'
```

For public project, set "projectVisibility": "HIRING\_CONTEXT"

# Check current subscription

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "IhkEPOIfQNC4IEUNUBigTg",
  "request_url": "https://www.linkedin.com/mysettings-api/settingsApiManagePremiumAccount",
  "method": "GET"
}'
```

# Unlock Sales navigator profile

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "IhkEPOIfQNC4IEUNUBigTg",
  "request_url": "https://www.linkedin.com/sales-api/salesApiProfiles",
  "method": "POST",
  "query_params": {
    "action": "unlock"
  },
  "body": {
    "profileAuthKey": {
      "profileId": "ACwAEADASDS..."
    }
  },
  "encoding": false
}'
```

# Get post short link

Set `{YOUR_DSN}`, `{YOUR_API_KEY}`, and `{ACCOUNT_ID}` for your connected account, then replace every occurrence of:

* `{POST_URL}`: the full post URL, e.g. `https://www.linkedin.com/posts/member_post-title-share-7419641004556886016-AbCd_/`.
* `{ACTIVITY_ID}`: the post activity ID, e.g. `7419641005567668224`. Keep the prefix before the placeholder; this ID can differ from the share ID in the URL.
* `{CONNECTED_MEMBER_PROFILE_ID}`: the connected member LinkedIn ID, e.g. `ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E`. Use the same ID for `rcm` if present in the URL.

```curl
curl --request POST \
  --url 'https://{YOUR_DSN}/api/v1/linkedin' \
  --header 'X-API-KEY: {YOUR_API_KEY}' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "{ACCOUNT_ID}",
  "request_url": "https://www.linkedin.com/flagship-web/rsc-action/actions/server-request?sduiid=com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "x-li-rsc-stream": "true"
  },
  "body": {
    "requestId": "com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
    "serverRequest": {
      "requestId": "com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
      "requestedArguments": {
        "$type": "proto.sdui.actions.requests.RequestedArguments",
        "requestedStateKeys": [],
        "payload": {
          "longUrl": "{POST_URL}",
          "utmSource": "share",
          "utmMedium": "member_desktop",
          "currentUserNonIterableProfileId": "{CONNECTED_MEMBER_PROFILE_ID}",
          "shareType": "Clipboard",
          "showCopyLinkSuccessToast": true,
          "showCopyLinkSuccessToastAction": true
        },
        "requestMetadata": {
          "$type": "proto.sdui.common.RequestMetadata",
          "currentActor": {
            "$type": "proto.sdui.bindings.core.Bindable",
            "key": {
              "key": {
                "value": {
                  "$case": "id",
                  "id": "identitySwitcherActorContext-urn:li:activity:{ACTIVITY_ID}"
                }
              },
              "namespace": ""
            },
            "content": {
              "$case": "stringBinding",
              "stringBinding": {}
            }
          }
        }
      },
      "isApfcEnabled": false,
      "isStreaming": false,
      "rumPageKey": ""
    },
    "states": [],
    "requestedArguments": {
      "$type": "proto.sdui.actions.requests.RequestedArguments",
      "requestedStateKeys": [],
      "payload": {
        "longUrl": "{POST_URL}",
        "utmSource": "share",
        "utmMedium": "member_desktop",
        "currentUserNonIterableProfileId": "{CONNECTED_MEMBER_PROFILE_ID}",
        "shareType": "Clipboard",
        "showCopyLinkSuccessToast": true,
        "showCopyLinkSuccessToastAction": true
      },
      "requestMetadata": {
        "$type": "proto.sdui.common.RequestMetadata",
        "currentActor": {
          "$type": "proto.sdui.bindings.core.Bindable",
          "key": {
            "key": {
              "value": {
                "$case": "id",
                "id": "identitySwitcherActorContext-urn:li:activity:{ACTIVITY_ID}"
              }
            },
            "namespace": ""
          },
          "content": {
            "$case": "stringBinding",
            "stringBinding": {}
          }
        }
      },
      "states": [],
      "screenId": "",
      "knownTemplateIds": []
    }
  }
}'
```

Look for the `https://lnkd.in/…` link inside `data` (JSON or RSC text). This simplified request still needs live validation.
<!-- ===== SOURCE: https://developer.unipile.com/docs/linkedin-search ===== -->
---

# Perform API Linkedin search and export result

You have the ability to make search on Classic, Sales Navigator or Recruiter to get People, Companies, Jobs or Posts list result with same criteria of LinkedIn interface on behalf of each account depending LinkedIn subscription.

That can be useful to extract list of person to start outreach sequence on your target, export list of companies in specific sector, location or other criteria, search for LinkedIn profile of someone with his name and company, list mutual relation with someone to ask warm intro, search for open profile in sales navigator, advanced candidate search in recruiter, search for posts contain specific keywords, and many other use case you can do manually on LinkedIn search can be automated.

We propose two ways to perform search, you can copy past URL of search directly from your browser or you can construct parameters value on your app and send a request with all parameters value in your Unipile query.

Here are some examples, but you can find the endpoint documentation with all parameters details here: [Get Linkedin Search Parameters API](https://developer.unipile.com/reference/linkedincontroller_getsearchparameterslist) & [Perform a Linkedin Search API](https://developer.unipile.com/reference/linkedincontroller_search)

Please have a look on [Linkedin limitations ](https://developer.unipile.com/docs/provider-limits-and-restrictions) about this endpoint.

# Perform a search from copy/past URL

You can copy paste URL from any search result, saved search or list of leads

```Text text
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin/search?account_id=!!YOURACCOUNTID!!
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
	"url": "https://www.linkedin.com/sales/search/people?query=(recentSearchParam%3A(id%3A3623570490%2CdoLogHistory%3Atrue)%2Cfilters%3AList((type%3AFUNCTION%2Cvalues%3AList((id%3A3%2Ctext%3AArts%2520and%2520Design%2CselectionType%3AINCLUDED)%2C(id%3A6%2Ctext%3AConsulting%2CselectionType%3AEXCLUDED)))%2C(type%3ACOMPANY_TYPE%2Cvalues%3AList((id%3AC%2Ctext%3APublic%2520Company%2CselectionType%3AINCLUDED)))))&sessionId=SsMfcb5pSmeVeTNnPOPxaw%3D%3D&viewAllFilters=true"
}
'
```

# Perform a search on basic fixed value parameters

Example for search people on sales navigator with overall seniority from 5 years and English profile language

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin/search?account_id=!!YOURACCOUNTID!!
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
	"api": "sales_navigator",
	"category": "people",
	"keywords": "developer",
	"tenure": [{ "min": 3  }],
	"profile_language": ["en"]
}
'
```

# Perform a search on parameters needed to loading their id before performing a search

Example for classic search to retrieve companies that have job offers, and located in areas affected by “location” IDs

## 1 - Search for location IDs with parameters that match your text location

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/linkedin/search/parameters?account_id=!YOURACCOUNTID!!&type=LOCATION&keywords=los%20angeles&limit=100
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
```

## 2 - Use this ID to perform the search

Example for search companies on classic who has job offers in two specific locations

```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin/search?account_id=!!YOURACCOUNTID!!
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
	"api": "classic",
	"category": "companies",
	"has_job_offers": true,
	"location": [102277331, 102448103]
}
'
```

Example  for search people on recruiter whose role should be either developer OR engineer, whose skills should include "50517" (Typescript skill ID) and exclude "261" (Php skill ID), whose industry include "4" (Software Development industry ID) and who are first, second, or third degree connections.

```curl curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin/search?account_id=!!YOURACCOUNTID!!
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
	"api": "recruiter",
	"category": "people",
	"network_distance": [1, 2, 3],
	"industry": {
		"include": ["4"]
	},
	"role": [
		{
		  "keywords": "developer OR engineer",
		  "priority": "MUST_HAVE",
		  "scope": "CURRENT_OR_PAST"
		}
	],
	"skills": [
		{
			"id": "261",
			"priority": "DOESNT_HAVE"
		},
				{
			"id": "50517",
			"priority": "MUST_HAVE"
		}
	]
}'
```

# Examples of results

## Parameter search

```json json
{
	"object": "LinkedinSearchParametersList",
	"items": [
		{
			"object": "LinkedinSearchParameter",
			"title": "Technology, Information and Internet",
			"id": "6"
		},
		{
			"object": "LinkedinSearchParameter",
			"title": "Climate Technology Product Manufacturing",
			"id": "3251"
		},
		{
			"object": "LinkedinSearchParameter",
			"title": "Space Research and Technology",
			"id": "3089"
		},
		{
			"object": "LinkedinSearchParameter",
			"title": "Technical and Vocational Training",
			"id": "2018"
		},
		{
			"object": "LinkedinSearchParameter",
			"title": "Technology, Information and Media",
			"id": "1594"
		}
	],
	"paging": {
		"page_count": 5
	}
}
```

## Search for Companies on Sales Navigator

```json
{
	"object": "LinkedinSearch",
	"items": [
		{
			"type": "COMPANY",
			"id": "103848457",
			"name": "Softwares For MLM",
			"profile_url": "https://www.linkedin.com/sales/company/103848457",
			"summary": "SFM (SoftwaresForMLM.com) specializes in delivering cutting-edge MLM software solutions designed to empower direct-selling businesses. With over 9 years of industry experience and a dedicated team of professionals, we have catered to over 1000+ satisfied customers, helping them achieve their business objectives. Our comprehensive software features help you ensure seamless operations and enhanced efficiency.  Ready to change the game and take your business to new heights? Connect with us on LinkedIn to stay updated on industry trends and insights!",
			"industry": "Software Development",
			"location": null,
			"headcount": "0"
		},
		{
			"type": "COMPANY",
			"id": "791056",
			"name": "Union Softwares | QuintoAndar",
			"profile_url": "https://www.linkedin.com/sales/company/791056",
			"summary": "Especialista em Imobiliárias\r\n\r\nNossa história de crescimento associa-se diretamente ao franco crescimento do mercado imobiliário. A empresa respondeu à altura quanto à qualidade dos produtos e serviços para esse segmento.\r\n\r\nDesde 1995 atende todo Brasil. Nossos serviços compreendem desenvolvimento de softwares, aplicativos, sites (para imobiliárias, corretores de imóveis e redes imobiliárias), portais e comunicação entre redes imobiliárias.\r\n\r\nEmpresa expandiu também em eficiência de atendimento, desenvolvendo modelos e rotinas para melhor gerir as dúvidas dos clientes. Nosso objetivo é orientar com brevidade e precisão, o que faz da equipe uma das mais eficientes existentes no mercado.\r\n\r\nTodo o quadro de colaboradores da Union – Especialista em Soluções Imobiliárias é constantemente treinado e capacitado, com postura autocrítica em relação ao cumprimento de suas funções, garantindo a todos os clientes o mesmo alto padrão de atendimento.\r\n\r\nSoluções imobiliárias: é o que melhor fazemos.\r\n\r\nConheça nosso site: www.uso.com.br\r\n\r\nUma empresa do Grupo QuintoAndar: www.quintoandar.com.br",
			"industry": "Software Development",
			"location": null,
			"headcount": "54"
		},
		{
			"type": "COMPANY",
			"id": "957117",
			"name": "totalCAD Softwares Técnicos",
			"profile_url": "https://www.linkedin.com/sales/company/957117",
			"summary": "A totalCAD é distribuidora especializada em softwares técnicos para projetos de CAD/CAE atendendo o mercado de engenharia, arquitetura e projetos industriais.\n\nAo longo dos anos, a totalCAD ampliou sua abrangência de serviços para este mercado e conta com uma sólida estrutura voltada para treinamentos (presenciais e por e-learning), palestras, certificação em CAD, desenvolvimento de aplicativos, cursos patrocinados, road shows e outros.\n\nDistribuidor exclusivo: ZWCAD",
			"industry": "Software Development",
			"location": null,
			"headcount": "80"
		},
		{
			"type": "COMPANY",
			"id": "3193089",
			"name": "Sisloc Softwares",
			"profile_url": "https://www.linkedin.com/sales/company/3193089",
			"summary": "A Sisloc é a solução mais completa para gestão de locadoras de bens móveis do Brasil. São diversos módulos desenvolvidos especialmente para atender à necessidade do setor de locação. Atendemos locadoras de todos os portes e grupos de equipamentos, de Norte a Sul do Brasil.\n\n\nSisloc é muito mais do que ter apenas um software de gestão para locadoras, é ter o conhecimento e a garantia de quem atua exclusivamente no segmento há mais de 32 anos, estudando cada detalhe das operações e os desafios dos profissionais da área.\n\nAtualmente, são mais de 1.000 locadoras e 8.000 usuários que confiam na tecnologia da Sisloc para fazer a sua gestão. ",
			"industry": "Software Development",
			"location": null,
			"headcount": "152"
		},
		{
			"type": "COMPANY",
			"id": "27326223",
			"name": "HUBCITY SOFTWARES PRIVATE LIMITED",
			"profile_url": "https://www.linkedin.com/sales/company/27326223",
			"summary": "The Hubcity Softwares group has been providing professional services to small businesses all the way up to blue chip companies, since 2006. We have constantly gained reputation for excellent project management and large-scale commercial infrastructure projects. Always focusing on timely and professional project delivery, we became a respected name amongst large companies. Today, we provide Infrastructure services, IT and Office Management tools.",
			"industry": "Software Development",
			"location": null,
			"headcount": "17"
		}
	],
	"config": {
		"params": {
			"api": "sales_navigator",
			"category": "companies",
			"keywords": "softwares",
			"industry": {
				"include": [
					6
				]
			}
		}
	},
	"paging": {
		"start": 0,
		"page_count": 5,
		"total_count": 4886
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOFJma0txU0tSTy1JbXpKT2k4T1I1USIsImxpbWl0Ijo1LCJzdGFydCI6NSwicGFyYW1zIjp7ImFwaSI6InNhbGVzX25hdmlnYXRvciIsImNhdGVnb3J5IjoiY29tcGFuaWVzIiwia2V5d29yZHMiOiJzb2Z0d2FyZXMiLCJpbmR1c3RyeSI6eyJpbmNsdWRlIjpbNl19fX0="
}
```

## Search for People on  Sales Navigator

```json
{
	"object": "LinkedinSearch",
	"items": [
    {
			"type": "PEOPLE",
			"id": "ACwAAASNCJcBS2NERCgi0j_f7_oYqCSbTGsNYBc",
			"industry": null,
			"name": "Luciano Bana",
			"first_name": "Luciano",
			"last_name": "Bana",
			"member_urn": "urn:li:member:76351639",
			"public_identifier": "luciano-bana-b876a021",
			"public_profile_url": "https://www.linkedin.com/in/luciano-bana-b876a021",
			"profile_url": "https://www.linkedin.com/sales/lead/ACwAAASNCJcBS2NERCgi0j_f7_oYqCSbTGsNYBc,NAME_SEARCH,NqOz",
			"profile_picture_url": "https://media.licdn.com/dms/image/v2/C4E03AQF_CASx9NFJ0A/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1595802673106?e=1730332800&v=beta&t=ApvY9fhCIU9Vw2-sMStegG0HzslsyPUfX412zRWvf-M",
			"network_distance": "DISTANCE_3",
			"location": "United States",
			"headline": "Building relationships one Hi-rise at a time\n\nThroughout my career, I have earned industry recognition as a sought out professional in residential and commercial developments, bridging cross-functional teams and forging partnerships with key business decision makers.\n\nMy only endeavor is to continue my success in a business that I love",
			"pending_invitation": false,
			"premium": true,
			"open_profile": true,
			"current_positions": [
				{
					"company": "Hudson Meridian Construction Group",
					"company_id": null,
					"description": "Overall P&L for the execution and success of each project assigned.",
					"location": null,
					"role": "Sr Vice President of Construction",
					"tenure_at_company": {
						"years": 10
					},
					"tenure_at_role": {
						"years": 10
					}
				}
			]
		},
	],
	"config": {
		"params": {
			"api": "sales_navigator",
			"category": "people",
			"keywords": "sales",
			"company": {
				"include": [
					1441
				],
				"exclude": [
					1035
				]
			}
		}
	},
	"paging": {
		"start": 0,
		"page_count": 5,
		"total_count": 25438
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOFJma0txU0tSTy1JbXpKT2k4T1I1USIsImxpbWl0Ijo1LCJzdGFydCI6NSwicGFyYW1zIjp7ImFwaSI6InNhbGVzX25hdmlnYXRvciIsImNhdGVnb3J5IjoicGVvcGxlIiwia2V5d29yZHMiOiJzYWxlcyIsImNvbXBhbnkiOnsiaW5jbHVkZSI6WzE0NDFdLCJleGNsdWRlIjpbMTAzNV19fX0="
}
```

## Search for People on Classic

```json
{
	"object": "LinkedinSearch",
	"items": [
		{
			"type": "PEOPLE",
			"id": "ACoAAAdHsOUBYtAunOfY0wJIbiwgewolov5X55M",
			"name": "Piyush Narwani",
			"member_urn": "urn:li:member:122138853",
			"profile_url": "https://www.linkedin.com/in/piyushnarwani?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAAAdHsOUBYtAunOfY0wJIbiwgewolov5X55M",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Co-Founder, Aerotime (YC W21)"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAACxgkaYBcqySPzUbuxjwSVmdsh6v0LR5QLI",
			"name": "Kamil Debbagh",
			"member_urn": "urn:li:member:744526246",
			"profile_url": "https://www.linkedin.com/in/kamil-debbagh?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAACxgkaYBcqySPzUbuxjwSVmdsh6v0LR5QLI",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Our AI lets app marketers create performing video ads in seconds"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAABjusvEB-KGzd61sw_OGEG8seOgWAy72NiQ",
			"name": "Arshia Moghaddam",
			"member_urn": "urn:li:member:418296561",
			"profile_url": "https://www.linkedin.com/in/arshiamog?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABjusvEB-KGzd61sw_OGEG8seOgWAy72NiQ",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Product Manager"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAABkq1NQBjkF99AF1GVREtVA2opIGjuWXFE4",
			"name": "J.Y Delmotte",
			"member_urn": "urn:li:member:422237396",
			"profile_url": "https://www.linkedin.com/in/jeanyves-delmotte?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABkq1NQBjkF99AF1GVREtVA2opIGjuWXFE4",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Co-founder @ BuddiesHR.com // 5x Startup Founder // YC alum"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAAAyPQZYBchkYpyN0NILTInIOyXtixhzkKc4",
			"name": "Roy N.",
			"member_urn": "urn:li:member:210715030",
			"profile_url": "https://www.linkedin.com/in/roynicolet?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAAAyPQZYBchkYpyN0NILTInIOyXtixhzkKc4",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Roy Nicolet"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAABcW0cMBeN3FC62yRA3-qG90SMqkP4x67So",
			"name": "Nick Fiacco",
			"member_urn": "urn:li:member:387371459",
			"profile_url": "https://www.linkedin.com/in/nfiacco?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABcW0cMBeN3FC62yRA3-qG90SMqkP4x67So",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Co-Founder at Demospace (YC W23)"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAABT_1jMBUFFpMOvZAwTn9srI5NfD-buVuJA",
			"name": "Catherine Wu",
			"member_urn": "urn:li:member:352310835",
			"profile_url": "https://www.linkedin.com/in/cat-wu?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABT_1jMBUFFpMOvZAwTn9srI5NfD-buVuJA",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco, CA",
			"headline": "Partner at Index Ventures"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAACfpuM8BuYJ5kBZTX7uNkrh7NPUUBmRv4Yo",
			"name": "Brandon Tull",
			"member_urn": "urn:li:member:669628623",
			"profile_url": "https://www.linkedin.com/in/brandon-tull?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAACfpuM8BuYJ5kBZTX7uNkrh7NPUUBmRv4Yo",
			"network_distance": "DISTANCE_2",
			"location": "San Francisco Bay Area",
			"headline": "Account Manager at Square"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAACBd-w8BiPlNIddmVWyVhUL1bL0MdIYpyow",
			"name": "Ellen Lucia Sirekanian",
			"member_urn": "urn:li:member:543030031",
			"profile_url": "https://www.linkedin.com/in/ellen-lucia-sirekanian-5a7a39131?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAACBd-w8BiPlNIddmVWyVhUL1bL0MdIYpyow",
			"network_distance": "DISTANCE_2",
			"location": "Los Angeles, CA",
			"headline": "Director Of Revenue Operations @autone"
		},
		{
			"type": "PEOPLE",
			"id": "ACoAACdYQiYBqetYYZ0vv5f2p34QuHdICin9xQE",
			"name": "Nkululeko Mhlongo",
			"member_urn": "urn:li:member:660095526",
			"profile_url": "https://www.linkedin.com/in/nkululeko-mhlongo-886093165?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAACdYQiYBqetYYZ0vv5f2p34QuHdICin9xQE",
			"network_distance": "DISTANCE_2",
			"location": "United States",
			"headline": "Business Strategy | Ex-BCG | Allan Gray Fellow"
		}
	],
	"config": {
		"params": {
			"api": "classic",
			"category": "people",
			"location": [
				102277331,
				102448103
			]
		}
	},
	"paging": {
		"start": 0,
		"page_count": 10,
		"total_count": 1000
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOFJma0txU0tSTy1JbXpKT2k4T1I1USIsImxpbWl0IjoxMCwic3RhcnQiOjEwLCJwYXJhbXMiOnsiYXBpIjoiY2xhc3NpYyIsImNhdGVnb3J5IjoicGVvcGxlIiwibG9jYXRpb24iOlsxMDIyNzczMzEsMTAyNDQ4MTAzXX19"
}
```

## Search for Companies on Classic

```json json
{
	"object": "LinkedinSearch",
	"items": [
		{
			"type": "COMPANY",
			"id": "165158",
			"name": "Netflix",
			"profile_url": "https://www.linkedin.com/company/netflix/",
			"summary": "Where you come to do the best work of your life. Follow @Netflix on Twitter, Instagram, TikTok and Youtube for more",
			"industry": "Entertainment Providers",
			"location": "Los Gatos, CA",
			"followers_count": 11000000,
			"job_offers_count": 427
		},
		{
			"type": "COMPANY",
			"id": "1480",
			"name": "Adobe",
			"profile_url": "https://www.linkedin.com/company/adobe/",
			"summary": "Changing the world through digital experiences.",
			"industry": "Software Development",
			"location": "San Jose, CA",
			"followers_count": 5000000,
			"job_offers_count": 2
		},
		{
			"type": "COMPANY",
			"id": "1586",
			"name": "Amazon",
			"profile_url": "https://www.linkedin.com/company/amazon/",
			"summary": null,
			"industry": "Software Development",
			"location": "Seattle, WA",
			"followers_count": 32000000,
			"job_offers_count": 9
		},
		{
			"type": "COMPANY",
			"id": "3650502",
			"name": "Figma",
			"profile_url": "https://www.linkedin.com/company/figma/",
			"summary": "Meet us at Moscone, June 26-27.",
			"industry": "Design Services",
			"location": "San Francisco, California",
			"followers_count": 1000000,
			"job_offers_count": 1
		},
		{
			"type": "COMPANY",
			"id": "1612748",
			"name": "Slack",
			"profile_url": "https://www.linkedin.com/company/tiny-spec-inc/",
			"summary": null,
			"industry": "Technology, Information and Internet",
			"location": "San Francisco, California",
			"followers_count": 2000000,
			"job_offers_count": 1
		},
		{
			"type": "COMPANY",
			"id": "167251",
			"name": "Dropbox",
			"profile_url": "https://www.linkedin.com/company/dropbox/",
			"summary": "Dropbox is the one place to keep life organized and keep work moving.",
			"industry": "Software Development",
			"location": "San Francisco, California",
			"followers_count": 458000,
			"job_offers_count": 54
		},
		{
			"type": "COMPANY",
			"id": "807257",
			"name": "Asana",
			"profile_url": "https://www.linkedin.com/company/asana/",
			"summary": "The #1 AI work management platform",
			"industry": "Software Development",
			"location": "San Francisco, California",
			"followers_count": 432000,
			"job_offers_count": 1
		},
		{
			"type": "COMPANY",
			"id": "1009",
			"name": "IBM",
			"profile_url": "https://www.linkedin.com/company/ibm/",
			"summary": null,
			"industry": "IT Services and IT Consulting",
			"location": "Armonk, New York, NY",
			"followers_count": 17000000,
			"job_offers_count": 6
		},
		{
			"type": "COMPANY",
			"id": "1441",
			"name": "Google",
			"profile_url": "https://www.linkedin.com/company/google/",
			"summary": null,
			"industry": "Software Development",
			"location": "Mountain View, CA",
			"followers_count": 34000000,
			"job_offers_count": 12
		},
		{
			"type": "COMPANY",
			"id": "1063",
			"name": "Cisco",
			"profile_url": "https://www.linkedin.com/company/cisco/",
			"summary": null,
			"industry": "Software Development",
			"location": "San Jose, CA",
			"followers_count": 7000000,
			"job_offers_count": 2
		}
	],
	"config": {
		"params": {
			"api": "classic",
			"category": "companies",
			"has_job_offers": true,
			"location": [
				102277331,
				102448103
			]
		}
	},
	"paging": {
		"start": 0,
		"page_count": 10,
		"total_count": 1000
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOFJma0txU0tSTy1JbXpKT2k4T1I1USIsImxpbWl0IjoxMCwic3RhcnQiOjEwLCJwYXJhbXMiOnsiYXBpIjoiY2xhc3NpYyIsImNhdGVnb3J5IjoiY29tcGFuaWVzIiwiaGFzX2pvYl9vZmZlcnMiOnRydWUsImxvY2F0aW9uIjpbMTAyMjc3MzMxLDEwMjQ0ODEwM119fQ=="
}
```

## Search for People on Recruiter

```json
{
	"object": "LinkedinSearch",
	"items": [
		{
			"type": "PEOPLE",
			"id": "AEMAAAQMevMBKmy0KNdlNZA1bV_xR06DjBJ47bY",
			"headline": "Software Engineer at LinkedIn",
			"location": "New York, New York, United States",
			"member_urn": null,
			"network_distance": "OUT_OF_NETWORK",
			"can_send_inmail": true,
			"recruiter_candidate_id": "67926771",
			"name": null,
			"public_identifier": null,
			"public_profile_url": null,
			"profile_url": null,
			"profile_picture_url": null,
			"industry": null,
			"current_positions": [
				{
					"company": "LinkedIn",
					"company_id": "1337",
					"description": "Sponsored Content",
					"location": null,
					"role": "Software Engineer",
					"start": {
						"month": 4,
						"year": 2019
					}
				}
			]
		},
		{
			"type": "PEOPLE",
			"id": "AEMAABvbttcBIYQi6vtvYIzu9Ni0tJ3Op4NGub4",
			"headline": "Senior Software Engineer | JavaScript, Typescript, React.js, Node.js, NestJS | Python, Django | AWS",
			"location": "Cary, North Carolina, United States",
			"member_urn": null,
			"network_distance": "OUT_OF_NETWORK",
			"can_send_inmail": true,
			"recruiter_candidate_id": "467384023",
			"name": null,
			"public_identifier": null,
			"public_profile_url": null,
			"profile_url": null,
			"profile_picture_url": null,
			"industry": null,
			"current_positions": [
				{
					"company": "VeliTech",
					"company_id": "95675813",
					"description": "Hoziron project.\n- Developed services for new market core processes, leading to a successful expansion into a new regional market.\n- Reduced heavyweight request response time by 1.3x using gRPC streams.\n- Enhanced service capacity by 5% through core service refactoring.\n- Collaborated on scalable software solutions with cross-functional teams, improving overall project delivery timelines by 10%.\n- Created and supported over 10 services.\n\n\nTrac project (https://trac.co/)\n- Revamped data storage methods, enhancing reliability and fault tolerance, resulting in a 15% reduction in data-related incidents.\n- Optimized Stripe interaction, enabling accurate payment processing with tax calculations, reducing payment errors by 10%.\n- Upgraded third-party API integration resilience by 30%.\n- Integrated 40+ AWS Step Functions for efficient workflows.\n- Increased artist page loading speed by 15%.",
					"location": "Cary, North Carolina, United States",
					"role": "Senior Software Engineer",
					"start": {
						"month": 3,
						"year": 2022
					}
				}
			]
		},
		{
			"type": "PEOPLE",
			"id": "AEMAABAVPdUBfG7q99GG0iC5YbC8zjFFb1iwFhM",
			"headline": "Senior Software Engineer at Intuit",
			"location": "Bengaluru, Karnataka, India",
			"member_urn": null,
			"network_distance": "OUT_OF_NETWORK",
			"can_send_inmail": true,
			"recruiter_candidate_id": "269827541",
			"name": null,
			"public_identifier": null,
			"public_profile_url": null,
			"profile_url": null,
			"profile_picture_url": null,
			"industry": null,
			"current_positions": [
				{
					"company": "Intuit",
					"company_id": "1666",
					"description": "Recurring Tasks Feature on Back-end in QBO\n- Designed and Built the Recurring Tasks Feature to generate multiple tasks with customizable recurrence in Java SpringBoot\n- Also Built Migration Strategy to Modernize this feature via Runtime Sync, One Time and Real-time Data  migration.\n\nTXP migration for QBO Advanced on UI\n- Lead the TXP migration for QBO advanced Invoice page (Dojo to React.js migration)\n- Collaborated with 8+ teams to align multiple features a with new architecture on the new TXP page\n- Drove the complete rollout end to end to ensure smooth transition to TXP invoice page\n\nSmart suggestions Feature for TXP on UI\n- Re-architected the AI powered Smart Suggestions feature on fronted for improved modularity and re-usability and simpler integration.\n- Lead the complete initiative and released the final product with high code quality.\n- Also improved the accessibility for power keyboard users\n\nQBO Backup and Restore App (https://qbo-backup.app.intuit.com)\n - Lead the initiative for a new User experience for the Company Restore flow.\n - Worked closely with Product and Dev Managers, Designers and Junior developers to streamline the overall Effort.\n- Also built the first phase of the new experience from Scratch.\n- Also improved the system efficiency for processing offline jobs with better cron management and computed scheduling.",
					"location": "Bengaluru, Karnataka, India",
					"role": "Senior Software Engineer",
					"start": {
						"month": 2,
						"year": 2022
					}
				}
			]
		}
	],
	"config": {
		"params": {
			"api": "recruiter",
			"category": "people",
			"network_distance": [
				1,
				2,
				3
			],
			"industry": {
				"include": [
					"4"
				]
			},
			"role": [
				{
					"keywords": "developer OR engineer",
					"priority": "MUST_HAVE",
					"scope": "CURRENT_OR_PAST"
				}
			],
			"skills": [
				{
					"id": "261",
					"priority": "DOESNT_HAVE"
				},
				{
					"id": "50517",
					"priority": "MUST_HAVE"
				}
			]
		}
	},
	"paging": {
		"start": 0,
		"page_count": 3,
		"total_count": 4433432
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOXE3bDFVZExUZGkwcEFod2xPUEVNdyIsImxpbWl0IjozLCJzdGFydCI6MywicGFyYW1zIjp7ImFwaSI6InJlY3J1aXRlciIsImNhdGVnb3J5IjoicGVvcGxlIiwibmV0d29ya19kaXN0YW5jZSI6WzEsMiwzLCJHUk9VUCJdLCJpbmR1c3RyeSI6eyJpbmNsdWRlIjpbIjQiXX0sInJvbGUiOlt7ImtleXdvcmRzIjoiZGV2ZWxvcGVyIE9SIGVuZ2luZWVyIiwicHJpb3JpdHkiOiJNVVNUX0hBVkUiLCJzY29wZSI6IkNVUlJFTlRfT1JfUEFTVCJ9XSwic2tpbGxzIjpbeyJpZCI6IjI2MSIsInByaW9yaXR5IjoiRE9FU05UX0hBVkUifSx7ImlkIjoiNTA1MTciLCJwcmlvcml0eSI6Ik1VU1RfSEFWRSJ9XX19"
}
```

## Search for Posts on Classic

```curl
{
	"object": "LinkedinSearch",
	"items": [
		{
			"type": "POST",
			"provider": "LINKEDIN",
			"social_id": "urn:li:activity:7236734771807019010",
			"share_url": "https://www.linkedin.com/posts/beau-atkins-105a273b_top-ten-tuesday-essential-reads-for-activity-7236734771807019010-3qVO?utm_source=combined_share_message&utm_medium=member_desktop",
			"date": "1h",
			"parsed_datetime": "2024-09-03T14:02:20.213Z",
			"comment_counter": 2,
			"impressions_counter": 0,
			"reaction_counter": 2,
			"repost_counter": 0,
			"permissions": {
				"can_post_comments": true,
				"can_react": true,
				"can_share": true
			},
			"text": "📕 📖 Top Ten Tuesday: Essential Reads for Finding Presence 📚 🤓 \n\nOver the past few years, I've found several books that have helped me become more present—something I strongly recommend to anyone experiencing family changes like separation or divorce, one of life's toughest challenges. These are my top 10 recommendations for anyone facing tough times or simply wanting to be more present:\n\nPresence by Amy Cuddy\nCuddy shows how being fully present in high-pressure situations helps bring our boldest, most authentic selves forward, boosting confidence and resilience. Her TedTalk is also a must-watch!\n\nThe Last Lecture by Randy Pausch\nThis memoir teaches us to cherish every moment as Pausch reflects on life's preciousness while facing terminal illness. It's hard not to get emotional with this one.\n\nThe Obstacle is the Way by Ryan Holiday   \nHoliday's modern Stoic philosophy encourages us to embrace challenges and stay grounded in the present. His "Daily Stoic" is another favorite of mine.\n\nFlow: The Psychology of Optimal Experience by Mihaly Csikszentmihalyi\nCsikszentmihalyi explores the "flow" state—where time fades and we're fully immersed. His insights have helped me find focus amid the noise.\n\nDeep Work by Cal Newport\nNewport advocates for deep, focused work by being present and eliminating distractions. His strategies have significantly boosted my productivity.\n\nThe Monk Who Sold His Ferrari by Robin Sharma\nSharma's story of a lawyer-turned-monk highlights living in the moment and finding joy in life's simple pleasures—a story that really resonated with me.\n\nWherever You Go, There You Are by Jon Kabat-Zinn\nKabat-Zinn introduces mindfulness, making it a great read for those, like me, who struggle with meditation.\n\nThe Power of Now by Eckhart Tolle\nTolle stresses the importance of living in the present as the path to peace and enlightenment, even though it was a challenging read for me initially.\n\nFour Thousand Weeks by Oliver Burkeman \nBurkeman's book reminds us of life's finite nature, urging us to make the most of every moment. It's humbling and highlights the value of time.\n\nShine by Gino Wickman  and Rob Dube\nThough aimed at entrepreneurs, this book's insights on looking inward and being present are universally applicable in many aspects of life.\n\nThese books offer invaluable guidance on being more present, no matter the challenges you face.",
			"attachments": [
				{
					"id": "D5622AQGhe9HN1jjc5A",
					"sticker": false,
					"size": {
						"height": 1536,
						"width": 1152
					},
					"unavailable": false,
					"type": "img",
					"url": "https://media.licdn.com/dms/image/v2/D5622AQGhe9HN1jjc5A/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1725108290180?e=1728518400&v=beta&t=w2hJPJ6x5nMzls23wJsUKjx1TyrtfmuK50pjmutjLwo"
				}
			],
			"author": {
				"public_identifier": "beau-atkins-105a273b",
				"name": "Beau Atkins",
				"is_company": false,
				"headline": "CEO at Evolve Family Law"
			},
			"is_repost": false,
			"id": "7236734771807019010"
		},
		{
			"type": "POST",
			"provider": "LINKEDIN",
			"social_id": "urn:li:activity:7236721657753600002",
			"share_url": "https://www.linkedin.com/posts/ginagardinerassociates_%F0%9D%97%9Cm-%F0%9D%97%B2%F0%9D%98%85%F0%9D%97%B0%F0%9D%97%B6%F0%9D%98%81%F0%9D%97%B2%F0%9D%97%B1-%F0%9D%98%81%F0%9D%97%BC-%F0%9D%98%80%F0%9D%97%B5%F0%9D%97%AE%F0%9D%97%BF%F0%9D%97%B2-%F0%9D%97%BC%F0%9D%98%82%F0%9D%97%BF-activity-7236721657753600002-fK2_?utm_source=combined_share_message&utm_medium=member_desktop",
			"date": "1h",
			"parsed_datetime": "2024-09-03T14:02:20.214Z",
			"comment_counter": 0,
			"impressions_counter": 0,
			"reaction_counter": 1,
			"repost_counter": 0,
			"permissions": {
				"can_post_comments": true,
				"can_react": true,
				"can_share": true
			},
			"text": "𝗜'm 𝗲𝘅𝗰𝗶𝘁𝗲𝗱 𝘁𝗼 𝘀𝗵𝗮𝗿𝗲 𝗼𝘂𝗿 𝟭𝘀𝘁 𝗱𝗮𝘆 𝗼𝗳 𝘁𝗵𝗲 𝗦𝗽𝗶𝗿𝗶𝘁𝘂𝗮𝗹 𝗠𝗮𝘀𝘁𝗲𝗿𝗰𝗹𝗮𝘀𝘀 𝘆𝗲𝘀𝘁𝗲𝗿𝗱𝗮𝘆! \n\nThe top 1% of leaders who embrace spiritually conscious leadership know that it's the key to boosting team motivation, productivity, and profitability—all in a supportive and loving environment. \n\nIn our 𝗡𝗘𝗪 𝗩𝗶𝘀𝗶𝗼𝗻𝗮𝗿𝘆 𝗟𝗲𝗮𝗱𝗲𝗿𝘀𝗵𝗶𝗽 𝗠𝗮𝘀𝘁𝗲𝗿𝗰𝗹𝗮𝘀𝘀, we're making spiritual growth a priority for you, your team, and those you serve.\n\n𝗬𝗲𝘀𝘁𝗲𝗿𝗱𝗮𝘆, 𝘄𝗲 𝗲𝘅𝗽𝗹𝗼𝗿𝗲𝗱:\n𝗧𝗼𝗽𝗶𝗰: Unveiling Your True Essence: A Journey to Authentic Self-Discovery\n-Build greater confidence and self-worth\n-Strengthen your relationship with yourself\n-Increase your sense of calm and resilience\n\n𝗝𝗼𝗶𝗻 𝘂𝘀 𝗳𝗼𝗿 𝗗𝗮𝘆 𝟮 𝗼𝗳 𝘁𝗵𝗲 𝗠𝗮𝘀𝘁𝗲𝗿𝗰𝗹𝗮𝘀𝘀 𝘁𝗼𝗱𝗮𝘆 𝗮𝘁 𝟰 𝗣𝗠 𝗨𝗞 𝘁𝗶𝗺𝗲.\n\n𝗦𝗶𝗴𝗻 𝘂𝗽 𝗵𝗲𝗿𝗲: https://lnkd.in/errS7BxA\n\n𝗝𝗼𝗶𝗻 𝘃𝗶𝗮 𝗭𝗼𝗼𝗺 𝗮𝘁 𝟰 𝗣𝗠 𝘁𝗼𝗱𝗮𝘆 𝘁𝗶𝗹𝗹 𝗙𝗿𝗶𝗱𝗮𝘆: https://lnkd.in/ejAxpVpH\n\nIf you'd like the details, come and join us! Or if you'd a like a replay, send me a message or DM me so I can send you the link!\n\nSee you later!\n\nGina xx",
			"attachments": [
				{
					"id": "D4E10AQGgcbcW0l0bcA",
					"sticker": false,
					"size": {
						"height": 353,
						"width": 561
					},
					"unavailable": false,
					"type": "img",
					"url": "https://media.licdn.com/dms/image/v2/D4E10AQGgcbcW0l0bcA/image-shrink_1280/image-shrink_1280/0/1725368894648?e=1725984000&v=beta&t=d_t-StNDDCLMV5alKxSosIK7gviX2TMll3SkFVYebAg"
				}
			],
			"author": {
				"public_identifier": "ginagardinerassociates",
				"name": "GINA GARDINER RADICAL CHANGE CATALYST AND LEADERSHIP ADVISOR",
				"is_company": false,
				"headline": "Radical Change Catalyst & Leadership Speaker, Consultant, Coach & Mentor Igniting Leadership Potential for Lasting, Holistic & Profitable Success #success #leadership #personaldevelopment #mediatraining"
			},
			"is_repost": false,
			"id": "7236721657753600002"
		},
		{
			"type": "POST",
			"provider": "LINKEDIN",
			"social_id": "urn:li:activity:7236447875625295872",
			"share_url": "https://www.linkedin.com/posts/nickunsworth1_september-lifeonfire-goals-activity-7236447875625295872-5mRl?utm_source=combined_share_message&utm_medium=member_desktop",
			"date": "20h",
			"parsed_datetime": "2024-09-02T19:02:20.214Z",
			"comment_counter": 0,
			"impressions_counter": 0,
			"reaction_counter": 0,
			"repost_counter": 0,
			"permissions": {
				"can_post_comments": true,
				"can_react": true,
				"can_share": true
			},
			"text": "What are your #September goals?\n\n\nBy setting clear, SMART goals for this new month, you're giving your life direction and boosting your productivity and personal growth. It's like creating your own personal roadmap, making the journey towards your bigger dreams and aspirations manageable and exciting.\n\nRemember, the key is to choose goals that resonate with you and align with your long-term vision. Let us know what you're planning to crush in the comments!\n\n#lifeonfire #goals #monthlygoals #septembergoals",
			"attachments": [
				{
					"id": "D5622AQEQ3K2BxUMF6w",
					"sticker": false,
					"size": {
						"height": 1080,
						"width": 1080
					},
					"unavailable": false,
					"type": "img",
					"url": "https://media.licdn.com/dms/image/v2/D5622AQEQ3K2BxUMF6w/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1725303619317?e=1728518400&v=beta&t=SvlyIaHjujv_QRq95CnhqZOAdFwb-hC9HL3w9ykVWfU"
				}
			],
			"author": {
				"public_identifier": "nickunsworth1",
				"name": "Nick Unsworth",
				"is_company": false,
				"headline": "High Performance Coach, International Speaker, & Best-Selling Author"
			},
			"is_repost": false,
			"id": "7236447875625295872"
		},
		{
			"type": "POST",
			"provider": "LINKEDIN",
			"social_id": "urn:li:activity:7236064374086340610",
			"share_url": "https://www.linkedin.com/posts/cpududetech_windows11-startmenu-productivity-activity-7236064374086340610-Kvdd?utm_source=combined_share_message&utm_medium=member_desktop",
			"date": "1d",
			"parsed_datetime": "2024-09-02T15:02:20.214Z",
			"comment_counter": 0,
			"impressions_counter": 0,
			"reaction_counter": 0,
			"repost_counter": 0,
			"permissions": {
				"can_post_comments": true,
				"can_react": true,
				"can_share": true
			},
			"text": "Have you upgraded your business to Windows 11 yet? If not, now might be the perfect time to consider it - especially with the exciting new changes coming to the Start menu. Microsoft has been experimenting with different layouts, and the latest updates make navigating your apps even easier.\n\nWindows 11 is introducing a new \"Category\" view in the Start menu's All apps section. This design organizes your apps into neat categories, making it simpler to find what you need without endless scrolling. Imagine quickly locating your tools with just a glance, saving you time and boosting productivity.\n\nPlus, the new Grid layout is smart - it groups apps by their first letter making it easier to find them.\n\nUpgrading to Windows 11 isn't just about a fresh look; it's about enhancing your workflow. With these new Start menu features on the way, there's never been a better time to make the switch. Ready to take the leap? Let my team help - get in touch. #Windows11 #StartMenu #Productivity\r\n\r\nhttps://lnkd.in/en9UQBYx",
			"attachments": [
				{
					"id": "D4E10AQF6RFlDfLbLRw",
					"sticker": false,
					"size": {
						"height": 720,
						"width": 1280
					},
					"unavailable": false,
					"type": "img",
					"url": "https://media.licdn.com/dms/image/v2/D4E10AQF6RFlDfLbLRw/image-shrink_1280/image-shrink_1280/0/1725212184855?e=1725984000&v=beta&t=Mh7XnaTBcGnK_zcEVV7yCtUL3pSKlntc_nCLbEL5n8k"
				}
			],
			"author": {
				"public_identifier": "cpududetech",
				"name": "Ben Emond",
				"is_company": false,
				"headline": "Computer Services Professional helping small businesses and sole proprietors have a worry free computing experience."
			},
			"is_repost": false,
			"id": "7236064374086340610"
		}
	],
	"config": {
		"params": {
			"api": "classic",
			"category": "posts",
			"keywords": "boosting productivity",
			"sort_by": "date",
			"date_posted": "past_week",
			"content_type": "images",
			"author": {
				"keywords": "CEO"
			}
		}
	},
	"paging": {
		"start": 0,
		"page_count": 10,
		"total_count": 6
	},
	"cursor": "eyJhY2NvdW50X2lkIjoiOXE3bDFVZExUZGkwcEFod2xPUEVNdyIsImxpbWl0IjoxMCwic3RhcnQiOjEwLCJwYXJhbXMiOnsiYXBpIjoiY2xhc3NpYyIsImNhdGVnb3J5IjoicG9zdHMiLCJrZXl3b3JkcyI6ImJvb3N0aW5nIHByb2R1Y3Rpdml0eSIsInNvcnRfYnkiOiJkYXRlIiwiZGF0ZV9wb3N0ZWQiOiJwYXN0X3dlZWsiLCJjb250ZW50X3R5cGUiOiJpbWFnZXMiLCJhdXRob3IiOnsia2V5d29yZHMiOiJDRU8ifX19"
}
```
<!-- ===== SOURCE: https://developer.unipile.com/docs/posts-and-comments ===== -->
---

# Posts and Comments

We provide lot of routes to lists posts of a users or a company, retrieve comments of theses posts, retrieve who like this post, you can like the post or a comment or directly comment post. You can use search to search post with some keywords and filters too.

**LinkedIn use multiple id for same post, its important to use "social\_id" of the post on all action  interaction to be 100% reliable, you can get it from list of posts of a user or if you have only an url of a post, you need to take id of post in URL, use retrieve post route with this id and take in result "social\_id" to list or add any comment or reaction**.

# Example from URL

For the following post URL who contain "activity" before id : <https://www.linkedin.com/posts/unipile_nocode-automation-solopreneurs-activity-7332661864792854528-hcGT>

You need to retrieve id part in URL **7332661864792854528** to perform [retrieve post request](https://developer.unipile.com/reference/postscontroller_getpost).

For URL contain ugcPost  (linkedin.com/posts/xxx-ugcPost-7336013677930006817-6jfq) you need to use this format : urn:li:ugcPost:7336013677930006817

For URL contain share (linkedin.com/posts/xxx-share-7336013677930006817-6jfq) your need to use this format urn:li:share:7336013677930006817

<br />

```
curl --request GET \
  --url 'https://apiX.unipile.com:XXXX/api/v1/posts/7332661864792854528/?account_id=7ioiu6zHRO67yQBazvXDuQ' \
  --header 'X-API-KEY: XXXX'
```

```json
{
  "object": "Post",
  "provider": "LINKEDIN",
  "social_id": "urn:li:activity:7332661864792854528",
  "share_url": "https://www.linkedin.com/posts/unipile_nocode-automation-solopreneurs-activity-7332661864792854528-hcGT?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
  "date": "3d",
  "parsed_datetime": "2025-05-26T19:01:02.468Z",
  "comment_counter": 0,
  "impressions_counter": 0,
  "reaction_counter": 6,
  "repost_counter": 0,
  "permissions": {
    "can_post_comments": true,
    "can_react": true,
    "can_share": true
  },
  "text": "What’s the #1 automation you rely on as a solo founder or no-code builder?\n\nWhether you're managing outreach, lead [...]",
  "attachments": [
    {
      "id": "D4D22AQE5ozOIW8_vfQ",
      "sticker": false,
      "size": { "height": 1002, "width": 800 },
      "unavailable": false,
      "type": "img",
      "url": "https://media.licdn.com/dms/image/v2/D4D22AQE5ozOIW8_vfQ/feedshare-shrink_800/B4DZb9tG7dHEAg-/0/1748013186578?e=1751500800&v=beta&t=4h3iZrbqUdd87EYUeISJ9wcw9fea8pMT9ONNId8hC3o"
    }
  ],
  "author": {
    "public_identifier": "unipile",
    "id": null,
    "name": "Unipile",
    "is_company": true
  },
  "is_repost": false,
  "id": "7332661864792854528"
}

```

In result you need to use "social\_id":"urn:li:activity:7332661864792854528" to  add or list comment or reaction
Example post a comment on this post.

```curl
curl --request POST \
  --url https://apiX.unipile.com:XXXX/api/v1/posts/urn:li:activity:7332661864792854528/comments \
  --header 'Content-Type: application/json' \
  --header 'X-API-KEY: XXXX' \
  --data '{
  "account_id": "7ioiu6zHRO67yQBazvXDuQ",
  "text": "Hey",
}'
```

# Mentions & Thread comment

You can reply to a specific comment using "comment\_id" parameter and use mentions with this syntax/

*Please note: to insert a line break in your text, use \n*

```curl
curl --request POST \
  --url https://apiX.unipile.com:XXXX/api/v1/posts/urn:li:activity:7332661864792854528/comments \
  --header 'Content-Type: application/json' \
  --header 'X-API-KEY: XXXX' \
  --data '{  
"account_id": "7ioiu6zHRO67yQBazvXDuQ",  
"text": "Hi {{0}}, thanks",  
"comment_id": "7335000001439513601",  
"mentions": [  
{  
"name": "John Doe",  
"profile_id": "ACoAASss4UBzQV9fDt_ziQ45zzpCVnAhxbW"  
}  
]  
}'
```

# Available actions on Posts :

Create a post : <https://developer.unipile.com/reference/postscontroller_createpost>

Add reaction : <https://developer.unipile.com/reference/postscontroller_addpostreaction>

Comment a post : <https://developer.unipile.com/reference/postscontroller_sendcomment>

List reactions : <https://developer.unipile.com/reference/postscontroller_listallreactions>

List Comments : <https://developer.unipile.com/reference/postscontroller_listallcomments>

List all post of a user or a company : <https://developer.unipile.com/reference/userscontroller_listallposts>

Retrieve a post : <https://developer.unipile.com/reference/postscontroller_getpost>