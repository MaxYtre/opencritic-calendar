import fetch from 'node-fetch';
import ical from 'node-ical';
import { DateTime } from 'luxon';
import fs from 'fs';

const SOURCE_URL  = 'https://img.opencritic.com/calendar/OpenCritic.ics';
const OUTPUT_FILE = 'docs/calendar.ics';
const CUTOFF      = DateTime.now().minus({ months: 6 });   // 6 месяцев назад

/* 1 Загрузка исходного .ics */
const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`HTTP ${res.status} при скачивании ${SOURCE_URL}`);
const rawICS = await res.text();

/* 2 Парсинг  ICS */
const parsed = ical.parseICS(rawICS);

/* 3 Фильтрация событий */
let vc = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OpenCritic.com//OpenCritic 2025 Gaming Calendar//EN
NAME:OpenCritic Gaming Calendar
X-WR-CALNAME:OpenCritic Gaming Calendar`;

let kept = 0;
for (const key in parsed) {
  const ev = parsed[key];
  if (ev.type !== 'VEVENT') continue;
  if (!ev.start || DateTime.fromJSDate(ev.start) < CUTOFF) continue;

  const dtStart = DateTime.fromJSDate(ev.start).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const dtEnd   = ev.end ? DateTime.fromJSDate(ev.end).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'") : null;

  vc += `
BEGIN:VEVENT
UID:${ev.uid}
DTSTAMP:${DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${dtStart}
${dtEnd ? `DTEND:${dtEnd}\n` : ''}SUMMARY:${ev.summary || ''}
DESCRIPTION:${(ev.description || '').replace(/\r?\n/g, '\\n')}
LOCATION:${ev.location || ''}
END:VEVENT`;
  kept++;
}

vc += `
END:VCALENDAR
`;

/* 4 Запись файла */
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(OUTPUT_FILE, vc.trimEnd(), 'utf8');
console.log(`Готово: сохранено ${kept} событий ➜ ${OUTPUT_FILE}`);
