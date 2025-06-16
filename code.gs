const INTERNAL_DOMAINS = ['mediacurrent.com', 'rhythmagency.com', 'codeandtheory.com'];
const recipient = "elliott.mower@mediacurrent.com";
const SPREADSHEET_ID = "1ka8Zt92tZxSnuj4I675Ikyi7lLhoYQitRNHBYnrCXX4"; // <-- extracted spreadsheet ID

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

  // Determine next 3 working days
  const next3WorkingDays = [];
  let day = new Date();
  while (next3WorkingDays.length < 3) {
    if (day.getDay() !== 0 && day.getDay() !== 6) {
      next3WorkingDays.push(day.toDateString());
    }
    day.setDate(day.getDate() + 1);
  }

  const highPriorityLines = [];
  const normalGrouped = {};

  for (const conflict of conflicts) {
    const { first, second, isHighPriority } = conflict;
    const eventDate = first.getStartTime();
    const dayKey = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'EEEE, MMM d');
    const time = Utilities.formatDate(eventDate, Session.getScriptTimeZone(), 'h:mm a');

    const firstHasExternal = hasExternalGuests(first);
    const secondHasExternal = hasExternalGuests(second);

    let title1 = `<a href="${makeCalendarLink(first)}">${first.getTitle()}</a>`;
    let title2 = `<a href="${makeCalendarLink(second)}">${second.getTitle()}</a>`;

    // Order to show external-attendee meeting first
    if (!firstHasExternal && secondHasExternal) {
      [title1, title2] = [title2, title1];
    }

    const line = `${isHighPriority ? '🔴' : '🔔'} ${isHighPriority ? dayKey + ', ' : ''}${time}: “${title1}” overlaps with “${title2}”`;

    if (isHighPriority && next3WorkingDays.includes(eventDate.toDateString())) {
      highPriorityLines.push(line);
    } else {
      if (!normalGrouped[dayKey]) normalGrouped[dayKey] = [];
      normalGrouped[dayKey].push(line);
    }
  }

  let body = `<div style="font-family: Arial, sans-serif; font-size: 14px;">`;

  if (highPriorityLines.length > 0) {
    body += `<p><strong>High Priority Conflicts (Next 3 Working Days)</strong></p>`;
    highPriorityLines.forEach(line => body += `${line}<br>`);
    body += `<br>`;
  }

  if (Object.keys(normalGrouped).length > 0) {
    body += `<p><strong>Other Conflicts</strong></p>`;
    for (const day in normalGrouped) {
      body += `<p>📅 <strong>${day}</strong></p>`;
      normalGrouped[day].forEach(line => body += `${line}<br>`);
      body += `<br>`;
    }
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
  const keywords = ['tentative', 'fyi', 'out of office']; // "hold" is high priority
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
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log");
  if (!sheet) throw new Error('Sheet "Log" not found');
  const data = sheet.getDataRange().getValues();
  return data.slice(1).some(row =>
    row[0] === firstId && row[1] === secondId && row[2] === conflictDateStr
  );
}

function logConflict(firstId, secondId, conflictDateStr) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log");
  if (!sheet) throw new Error('Sheet "Log" not found');
  sheet.appendRow([firstId, secondId, conflictDateStr]);
}

function isConflictIgnored(firstId, secondId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Ignore");
  if (!sheet) throw new Error('Sheet "Ignore" not found');
  const data = sheet.getDataRange().getValues();
  return data.slice(1).some(row =>
    row[0] === firstId && row[1] === secondId
  );
}
