---
updatedAt: 2026-01-06T09:13:34.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
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