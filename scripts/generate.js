const fetch = require("node-fetch");
const ical = require("node-ical");
const fs = require("fs");
const { DateTime } = require("luxon");

(async () => {
  const url = "https://img.opencritic.com/calendar/OpenCritic.ics";

  console.log("Загрузка .ics с OpenCritic...");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Не удалось загрузить .ics: ${res.status}`);
  }

  const rawICS = await res.text();
  const parsed = ical.parseICS(rawICS);
  const cutoff = DateTime.now().minus({ months: 6 });

  let output = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//OpenCritic.com//OpenCritic 2025 Gaming Calendar//EN\r
NAME:OpenCritic Gaming Calendar\r
X-WR-CALNAME:OpenCritic Gaming Calendar\r
`;

  let kept = 0;
  for (const k in parsed) {
    const ev = parsed[k];
    if (ev.type !== "VEVENT") continue;
    if (!ev.start || DateTime.fromJSDate(ev.start) < cutoff) continue;

    output += `BEGIN:VEVENT\r
UID:${ev.uid}\r
SUMMARY:${ev.summary}\r
DTSTART:${DateTime.fromJSDate(ev.start).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}\r
DTEND:${DateTime.fromJSDate(ev.end || ev.start).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}\r
DESCRIPTION:${ev.description || ""}\r
LOCATION:${ev.location || ""}\r
END:VEVENT\r
`;
    kept++;
  }

  output += "END:VCALENDAR\r\n";
  console.log(`Событий после фильтрации: ${kept}`);

  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync("docs/calendar.ics", output);
  console.log("Готово: docs/calendar.ics");
})();
