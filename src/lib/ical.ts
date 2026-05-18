/** Minimal iCalendar exporter (RFC 5545 subset). Compatible with Apple
 *  Calendar, Google Calendar import, Outlook. */

interface IcalEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
}

const fmtUtc = (d: Date): string => {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
};

const escape = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export const buildIcs = (events: IcalEvent[], calendarName = "Territoire Incarné"): string => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Territoire Incarné//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(calendarName)}`,
  ];

  const now = fmtUtc(new Date());
  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}@territoireincarne.ca`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${fmtUtc(ev.start)}`);
    lines.push(`DTEND:${fmtUtc(ev.end)}`);
    lines.push(`SUMMARY:${escape(ev.summary)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
    if (ev.url) lines.push(`URL:${escape(ev.url)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  // RFC 5545 requires CRLF between content lines.
  return lines.join("\r\n");
};

export const downloadIcs = (filename: string, ics: string): void => {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};
