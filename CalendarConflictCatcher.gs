
const INTERNAL_DOMAINS = ['mediacurrent.com', 'rhythmagency.com', 'codeandtheory.com'];
const recipient = "elliott.mower@mediacurrent.com";

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
      const firstTitle = curr.getTitle().trim().toLowerCase();
      const secondTitle = next.getTitle().trim().toLowerCase();

      const hasHold = firstTitle.includes("hold") || secondTitle.includes("hold");
      const bothLowPriority = isLowPriority(curr) && isLowPriority(next);

      if (!hasHold && bothLowPriority) continue;

      const conflictDateStr = formatDate(curr.getStartTime());
      const firstId = curr.getId();
      const secondId = next.getId();

      if (!isConflictIgnored(firstId, secondId) && !isConflictLogged(firstId, secondId, conflictDateStr)) {
        const externalWeight = hasExternalGuests(curr) || hasExternalGuests(next);
        const isHighPriority = hasHold || externalWeight;

        logConflict(firstId, secondId, conflictDateStr);
        conflicts.push({ first: curr, second: next, isHighPriority });
      }
    }
  }

  if (conflicts.length === 0) return;

  const nowTime = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const twoDays = 2 * oneDay;

  const groupA = [];
  const groupB = [];
  const groupC = [];

  for (const conflict of conflicts) {
    const { first, second, isHighPriority } = conflict;
    const start = first.getStartTime();
    const timeDiff = start.getTime() - nowTime;

    const dayKey = Utilities.formatDate(start, Session.getScriptTimeZone(), 'EEEE, MMM d');
    const time = Utilities.formatDate(start, Session.getScriptTimeZone(), 'h:mm a');

    const firstHasExternal = hasExternalGuests(first);
    const secondHasExternal = hasExternalGuests(second);

    let title1 = `<a href="${makeCalendarLink(first)}">${first.getTitle()}</a>`;
    let title2 = `<a href="${makeCalendarLink(second)}">${second.getTitle()}</a>`;

    if (!firstHasExternal && secondHasExternal) {
      [title1, title2] = [title2, title1];
      title1 = `<b>${title1}</b>`;
    } else if (firstHasExternal && !secondHasExternal) {
      title1 = `<b>${title1}</b>`;
    }

    const line = `${isHighPriority ? '🔴' : '🔔'} ${dayKey}, ${time}: “${title1}” overlaps with “${title2}”`;

    if (timeDiff <= oneDay) {
      groupA.push(line);
    } else if (timeDiff <= twoDays) {
      groupB.push(line);
    } else {
      groupC.push(line);
    }
  }

  let body = `<div style="font-family: Arial, sans-serif; font-size: 14px;">`;

  if (groupA.length > 0) {
    body += `<p><strong>Conflicts in the next 24 hours</strong></p>`;
    groupA.forEach(line => body += `${line}<br>`);
    body += `<br>`;
  }

  if (groupB.length > 0) {
    body += `<p><strong>Conflicts in 24–48 hours</strong></p>`;
    groupB.forEach(line => body += `${line}<br>`);
    body += `<br>`;
  }

  if (groupC.length > 0) {
    body += `<p><strong>Conflicts beyond 48 hours</strong></p>`;
    groupC.forEach(line => body += `${line}<br>`);
    body += `<br>`;
  }

  body += `<p>— Conflict Catcher</p></div>`;

  MailApp.sendEmail({
    to: recipient,
    subject: `Calendar Conflict Alert: ${conflicts.length} Upcoming Double-Bookings`,
    htmlBody: body
  });
}

function isLowPriority(event) {
  const title = event.getTitle().toLowerCase();
  const keywords = ['tentative', 'fyi', 'out of office'];
  return keywords.some(word => title.includes(word));
}

function hasExternalGuests(event) {
  return event.getGuestList().some(guest => {
    const domain = guest.getEmail().split('@')[1];
    return !INTERNAL_DOMAINS.includes(domain);
  });
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'EEE, MMM d, h:mm a');
}

function makeCalendarLink(event) {
  const id = event.getId().replace(/@google.com$/, '').replace(/[^a-zA-Z0-9]/g, '');
  return `https://calendar.google.com/calendar/u/0/r/eventedit/${id}`;
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
