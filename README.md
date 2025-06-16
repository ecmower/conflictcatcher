# Calendar Conflict Catcher

Automatically detect and email upcoming calendar conflicts from your Google Calendar — especially those involving high-priority or external meetings. This script helps busy professionals surface potential double-bookings before they become a problem.

## 🔍 What It Does

- Scans your next 7 days of calendar events
- Detects overlaps between meetings
- Prioritizes conflicts that include:
  - Meetings with external participants (outside your org)
  - Events titled "HOLD" (treated as high priority)
- Filters out low-priority events (e.g. "fyi", "out of office", "tentative")
- Groups conflicts by urgency:
  - ⏱ Within 24 hours
  - 📆 Within 48 hours
  - 📅 Beyond 48 hours
- Sends an automated email summary of conflicts with links to each event

## 🛠 Setup Instructions

1. **Create a Google Sheet**
   - Add two tabs:
     - `Log` with columns: `First Event ID`, `Second Event ID`, `Date`
     - `Ignore` with columns: `First Event ID`, `Second Event ID`

2. **Copy the Script**
   - Paste the contents of `CalendarConflictCatcher.gs` into a [Google Apps Script project](https://script.google.com)
   - Replace `YOUR_SHEET_ID` with your Google Sheet ID (found in the URL)

3. **Set a Trigger**
   - In Apps Script: go to `Triggers > Add Trigger`
   - Choose `sendCalendarConflictEmail`
   - Set it to run once per day (or more frequently)

4. **Update the Recipient**
   - Replace `elliott.mower@mediacurrent.com` with your own or your assistant’s email

## ✨ Customization Options

You can tweak:
- Internal domains to detect external guests
- Priority keywords like `"hold"`
- Time window for detection
- Message formatting (HTML or plain text)

---

Built for busy people who need eyes on calendar chaos — before it causes real trouble.

