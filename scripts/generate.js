import fetch from "node-fetch";
import ical from "node-ical";
import { DateTime } from "luxon";
import fs from "fs";

const SOURCE_URL = "https://img.opencritic.com/calendar/OpenCritic.ics";
const OUTPUT_FILE = "docs/calendar.ics";
const CUT_OFF_DATE = DateTime.now().minus({ months: 6 });

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  throw new Error(`Failed to fetch calendar: ${res.statusText}`);
}

const rawData = await res.text();
const parsed = ical.parseICS(rawData);

const events = Object.values(parsed).filter(
  (e) => e.type === "VEVENT" && e.start && DateTime.fromJSDate(e.start) >= CUT_OFF_DATE
);

let result = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OpenCritic.com//OpenCritic 2025 Gaming Calendar//EN
NAME:OpenCritic Gaming Calendar
X-WR-CALNAME:OpenCritic Gaming Calendar`;

for (const e of events) {
  result += `
BEGIN:VEVENT
UID:${e.uid}
DTSTAMP:${DateTime.fromJSDate(e.dtstamp || new Date()).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${DateTime.fromJSDate(e.start).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}
${e.end ? `DTEND:${DateTime.fromJSDate(e.end).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z')`}` : ""}
SUMMARY:${e.summary || "Untitled Event"}
DESCRIPTION:${e.description || ""}
LOCATION:${e.location || ""}
END:VEVENT`;
}

result += `\nEND:VCALENDAR`;

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(OUTPUT_FILE, result.trim(), "utf8");

console.log(`Generated calendar with ${events.length} events.`);
