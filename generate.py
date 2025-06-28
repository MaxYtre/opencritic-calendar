from ics import Calendar
from datetime import datetime
import requests

url = "https://img.opencritic.com/calendar/OpenCritic.ics"
r = requests.get(url)
r.raise_for_status()

c = Calendar(r.text)
filtered = Calendar()
now = datetime.utcnow()

for e in c.events:
    if e.begin.datetime >= now:
        filtered.events.add(e)

with open("opencritic_filtered.ics", "w", encoding="utf-8") as f:
    f.writelines(filtered.serialize_iter())
