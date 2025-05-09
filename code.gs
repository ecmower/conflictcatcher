function sendCalendarConflictEmail() {
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();

  const startTime = new Date(now);
  const endTime = new Date(now);
  endTime.setDate(now.getDate() + 7);
  endTime.setHours(23, 59, 59, 999);

  const events = calendar.getEvents(startTime, endTime);
  events.sort((a, b) => a.getStartTime() - b.getStartTime());

  const conflicts = [];

  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];

    if (curr.getEndTime() > next.getStartTime()) {
      if (isLowPriority(curr) && isLowPriority(next)) continue;
      if (curr.getTitle().trim().toLowerCase() === next.getTitle().trim().toLowerCase()) continue;

      const conflictDateStr = formatDate(curr.getStartTime());
      const firstId = curr.getId();
      const secondId = next.getId();

      if (!isConflictIgnored(firstId, secondId) && !isConflictLogged(firstId, secondId, conflictDateStr)) {
        logConflict(firstId, secondId, conflictDateStr);
        conflicts.push({ first: curr, second: next });
      }
    }
  }

  if (conflicts.length === 0) return;

  const conflictSummary = conflicts.map(conflict => {
    return [
      `🔔 *${formatDate(conflict.first.getStartTime())}*:`,
      `“${conflict.first.getTitle()}” overlaps with “${conflict.second.getTitle()}”`,
      `---`
    ].join('\n');
  }).join('\n');

  const recipient = "your.email@domain.com"; // 🔁 Replace with your own
  const subject = `Calendar Conflict Alert: ${conflicts.length} Upcoming Double-Bookings`;
  const body = `Hi —\n\nHere are some potential calendar conflicts in the next 7 days:\n\n${conflictSummary}\n\n— Conflict Catcher`;

  MailApp.sendEmail(recipient, subject, body);
}

function isLowPriority(event) {
  const title = event.getTitle().toLowerCase();
  const keywords = ['hold', 'tentative', 'fyi', 'out of office'];
  return keywords.some(word => title.includes(word));
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'EEE, MMM d, h:mm a');
}

function isConflictLogged(firstId, secondId, conflictDateStr) {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Log");
  if (!sheet) throw new Error('Sheet "Log" not found');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === firstId && data[i][1] === secondId && data[i][2] === conflictDateStr) {
      return true;
    }
  }
  return false;
}

function logConflict(firstId, secondId, conflictDateStr) {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Log");
  if (!sheet) throw new Error('Sheet "Log" not found');
  sheet.appendRow([firstId, secondId, conflictDateStr]);
}

function isConflictIgnored(firstId, secondId) {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Ignore");
  if (!sheet) throw new Error('Sheet "Ignore" not found');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === firstId && data[i][1] === secondId) {
      return true;
    }
  }
  return false;
}
