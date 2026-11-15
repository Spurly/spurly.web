---
updatedAt: 2026-10-01T14:49:36.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
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