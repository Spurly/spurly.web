# Spurly UI — what's new, what's old, and why

Source of truth: the Claude Design zip (`docs/design/screens/*.dc.html` + `docs/design/spurlyDESIGN.md`).

## New (matches the design)
| Screen | Notes |
|---|---|
| App shell (sidebar, page header, bell) | Design sidebar, nav order, daily-cap meter, account menu |
| Leads | Leads v2: tabs, toolbar, selection band, new columns, New audience modal, lead drawer |
| Campaigns + detail | Stat tiles, status pills, card grid, console detail |
| Sequences + builder | Flow/Enrolled tabs, step cards, inspector |
| Dashboard (Home) | Greeting, stat tiles, attention list, top of list, recently |
| Inbox | List column, thread, bubbles, composer |
| Settings | One frame with tabs: Account, LinkedIn, Sending limits, AI context, Extension, Team, Billing |
| Auth + Onboarding | Split screen with blue panel; segment-bar stepper |
| Shared components | Buttons, inputs, badges, tabs, dialogs, drawer, data table, icons, fonts (Geist + IBM Plex Mono) |

## New, but designed by us (no mockup existed)
Enrichment list + detail, Templates, Import, Notifications. These follow the same system: header on the canvas, one card per region, mono micro-caps labels, 58px rows.

## Old (not restyled) and why
| Area | Why it's still old |
|---|---|
| Admin pages | Internal only, not in the design, and customers don't see them |
| Legacy Insights / analytics chunk | Not in the design and not in the main nav; to be redesigned once the metrics exist |
| Deep sub-dialogs (for example CSV column mapping) | Get the new primitives automatically but keep their old layout; no mockup |

## Features shown as "SOON"
These are drawn in their designed place but are not built yet, so they never show fake numbers. The full list is in `docs/UI_REDESIGN_DEFERRED_FEATURES.md`.
