---
updatedAt: 2026-01-06T09:13:34.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
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