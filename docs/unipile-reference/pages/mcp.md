---
updatedAt: 2026-10-30T16:38:29.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
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