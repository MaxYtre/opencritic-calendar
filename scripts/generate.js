import fs from 'fs';
import fetch from 'node-fetch';

const SOURCE_URL = 'https://img.opencritic.com/calendar/OpenCritic.ics';
const OUTPUT_FILE = 'docs/calendar.ics';

const raw = await fetch(SOURCE_URL).then(res => res.text());

const now = new Date();
const minDate = new Date(now);
minDate.setMonth(minDate.getMonth() - 6); // 6 месяцев назад

const lines = raw.split(/\r?\n/);
const result = [];
let insideEvent = false;
let currentEvent = [];

for (let line of lines) {
  if (line.startsWith('BEGIN:VEVENT')) {
    insideEvent = true;
    currentEvent = [line];
  } else if (line.startsWith('END:VEVENT')) {
    currentEvent.push(line);
    const eventText = currentEvent.join('\n');
    const dtStartMatch = eventText.match(/DTSTART.*:(\d{8}T\d{6})/);
    if (dtStartMatch) {
      const dt = dtStartMatch[1];
      const eventDate = new Date(
        dt.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')
      );
      if (eventDate >= minDate) {
        result.push(...currentEvent);
      }
    }
    insideEvent = false;
  } else if (insideEvent) {
    currentEvent.push(line);
  } else {
    result.push(line); // заголовок/мета-данные
  }
}

fs.writeFileSync(OUTPUT_FILE, result.join('\r\n'), 'utf8');
