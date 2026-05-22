// App-wide date/time conventions for zaanvar_vendor.
// See AGENTS.md at the repo root for usage rules.

export function toApiUtcIso(date) {
  if (!(date instanceof Date)) {
    const parsed = date ? new Date(date) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }
  return date.toISOString();
}

export function toApiDateOnly(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseApiToLocal(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === 'null') return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function userTimeZone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.length > 0 ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function withTimeZone(fieldName, date) {
  return {
    [fieldName]: toApiUtcIso(date),
    [`${fieldName}TimeZone`]: userTimeZone(),
  };
}

export function dateOnlyWithTimeZone(fieldName, date) {
  return {
    [fieldName]: toApiDateOnly(date),
    [`${fieldName}TimeZone`]: userTimeZone(),
  };
}

export function parseWallClockDate(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === 'null') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return parseApiToLocal(raw);
}

export function formatDobInputValue(raw) {
  if (raw == null || raw === '') return '';
  const d = parseWallClockDate(raw);
  return d ? toApiDateOnly(d) : String(raw);
}

export function formatInOriginalTz(value, originalIanaTimeZone, options = {}) {
  const date = parseApiToLocal(value);
  if (!date) return '';
  const opts = {
    dateStyle: 'medium',
    ...options,
    timeZone:
      originalIanaTimeZone && String(originalIanaTimeZone).trim()
        ? String(originalIanaTimeZone).trim()
        : undefined,
  };
  try {
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  }
}

export function clientTimeZoneHeaders() {
  const tz = userTimeZone();
  return tz ? { 'X-Client-Timezone': tz } : {};
}
