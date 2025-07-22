import fetch from "node-fetch";
import ical from "node-ical";
import { DateTime } from "luxon";
import fs from "fs";

const SOURCE_URL = "https://img.opencritic.com/calendar/OpenCritic.ics";
const OUTPUT_PATH = "docs/calendar.ics";
const NOW = DateTime.utc();
const HALF_YEAR_AGO = NOW.minus({ months: 6 });

const res = await fetch(SOURCE_URL);
if (!res.ok) {
  throw new Error(`Failed to fetch calendar: ${res.statusText}`);
}
const rawData = await res.text();
const parsed = ical.parseICS(rawData);

const events = Object.values(parsed).filter(e =>
  e.type === "VEVENT" &&
  e.start &&
  DateTime.fromJSDate(e.start) >= HALF_YEAR_AGO
);

// RFC 5545 requires CRLF endings and 75-char max line length
function foldLine(line) {
  if (line.length <= 75) return line;
  return line.match(/.{1,73}/g).join("\r\n ");
}

const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//OpenCritic.com//OpenCritic 2025 Gaming Calendar//EN",
  "NAME:OpenCritic Gaming Calendar",
  "X-WR-CALNAME:OpenCritic Gaming Calendar"
];

for (const e of events) {
  lines.push("BEGIN:VEVENT");
  if (e.summary) lines.push(foldLine(`SUMMARY:${e.summary}`));
  lines.push(`DTSTART:${DateTime.fromJSDate(e.start).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`);
  if (e.end) {
    lines.push(`DTEND:${DateTime.fromJSDate(e.end).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`);
  }
  if (e.description) lines.push(foldLine(`DESCRIPTION:${e.description}`));
  if (e.url) lines.push(foldLine(`URL:${e.url}`));
  lines.push("END:VEVENT");
}

lines.push("END:VCALENDAR");

fs.writeFileSync(OUTPUT_PATH, lines.join("\r\n") + "\r\n", "utf8");
console.log(`Generated ${events.length} events into ${OUTPUT_PATH}`);
