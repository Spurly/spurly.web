---
title: Connect Spurly to Claude, Claude Code and Cursor
seoTitle: Connect Spurly to Claude (MCP Setup Guide) | Spurly
shortTitle: AI assistant setup
description: Step-by-step setup for connecting Spurly to Claude, Claude Code and Cursor over MCP, with sign-in or a personal token.
path: /product/ai-assistants-setup
template: page
date: 2026-10-10
priority: 0.6
target_query: spurly mcp setup
related: [/product/ai-assistants, /product/safety]
faq:
  - q: What is the server address?
    a: The address is https://api.getspurly.com/mcp. It is also shown in Settings under AI assistants.
  - q: Do I need a token?
    a: Not if your assistant lets you sign in, as Claude does. Tokens are for tools that ask for one, such as Claude Code or Cursor in some setups.
  - q: Why can the assistant read but not send?
    a: Sending needs the Act permission and the account setting "Allow AI assistants to take actions", which is off by default. Turn it on in Settings under AI assistants.
---
You need a Spurly account with a connected LinkedIn account. The server address is `https://api.getspurly.com/mcp`.

## Claude on the web and desktop

1. Open Settings, then Connectors, and choose to add a custom connector.
2. Paste the server address above.
3. Sign in to Spurly when asked and review the permissions on the consent screen.
4. Approve. Spurly appears in your connectors and in Settings under AI assistants.

## Claude Code

1. Run `claude mcp add --transport http spurly https://api.getspurly.com/mcp`.
2. Inside Claude Code, run `/mcp` and choose Spurly to sign in.
3. Or create a personal token in Spurly under Settings, AI assistants, and pass it as an `Authorization: Bearer` header.

## Cursor and other assistants

1. Add a remote MCP server using the address above.
2. If the assistant asks for a token, create one in Settings under AI assistants. The token is shown once, so copy it straight away.

## Permissions

Read lets the assistant look at your data. Draft lets it create drafts. Act lets it start campaigns and send. Act also needs "Allow AI assistants to take actions" turned on in Settings, and it is off by default. See [what assistants can do](/product/ai-assistants).

## If something goes wrong

- A message that your trial has ended means your access has lapsed. Subscribe and try again.
- Disconnect an app or revoke a token from Settings under AI assistants if you no longer want it to have access.
- Spurly is designed to keep sending within LinkedIn's limits, but no tool can guarantee LinkedIn will not restrict an account. The [safety page](/product/safety) has the detail.
