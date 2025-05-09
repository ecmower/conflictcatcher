# 🧠 Conflict Catcher – Google Calendar Conflict Notifier

Conflict Catcher is a Google Apps Script that scans your Google Calendar for overlapping events over the next 7 days and emails a summary of potential conflicts. It's designed for executives or busy professionals who want to catch conflicts before the day-of, and for EAs who manage complex schedules.

## ✨ Features

- Scans upcoming 7 days for overlapping calendar events
- Skips known "low priority" events like "Hold", "Tentative", or "OOO"
- Ignores events with identical titles (e.g. duplicate invites)
- Logs previously reported conflicts to avoid duplicate alerts
- Includes a manual "Ignore List" for recurring conflicts you want to suppress
- Sends a human-readable email digest of new conflicts

## 📁 Google Sheet Setup

Create a Google Sheet with two tabs:

### Tab 1: `Log`
| First Event ID | Second Event ID | Conflict Date |
|----------------|------------------|----------------|

### Tab 2: `Ignore`
| First Event ID | Second Event ID | Note |
|----------------|------------------|------|

## 🔧 Installation

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project and paste in the code from `Code.gs`
3. Replace `"YOUR_SHEET_ID"` with your actual Sheet ID from the URL
4. Replace the placeholder email with your own
5. Set a time-based trigger to run `sendCalendarConflictEmail` daily

## 🔄 Future Ideas

- Slack integration
- Google Sheets dashboard for heatmapping
- Google Form for managing the ignore list

---

Made with ☕ by a calendar conflict survivor.
