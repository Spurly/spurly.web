---
updatedAt: 2026-01-06T09:13:34.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
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