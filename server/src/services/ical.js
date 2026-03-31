const fs = require('fs');
const ICAL = require('ical.js');

/**
 * Parses an iCal (.ics) file and extracts weekly events as available week ranges.
 * Returns an array of { start: Date, end: Date } objects.
 */
async function parseIcalFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseIcalString(raw);
}

function parseIcalString(raw) {
  const jcalData = ICAL.parse(raw);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  const weeks = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const start = event.startDate?.toJSDate();
    const end = event.endDate?.toJSDate();

    if (!start || !end) continue;

    const durationMs = end - start;
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    // Accept events that are between 5 and 9 days (weekly timeshare blocks)
    if (durationDays >= 5 && durationDays <= 9) {
      weeks.push({ start, end });
    }
  }

  // Sort by start date and deduplicate
  weeks.sort((a, b) => a.start - b.start);

  const deduped = [];
  for (const week of weeks) {
    const last = deduped[deduped.length - 1];
    if (!last || week.start.getTime() !== last.start.getTime()) {
      deduped.push(week);
    }
  }

  return deduped;
}

module.exports = { parseIcalFile, parseIcalString };
