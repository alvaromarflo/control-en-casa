/** Returns all Mondays within the calendar month of `monthDate`. */
export function mondaysInMonth(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondays: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 1) mondays.push(date);
  }
  return mondays;
}

/** Returns "YYYY-MM" */
export function monthString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns "YYYY-MM-DD" */
export function dateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns "Mayo 2026" (capitalized) */
export function displayMonth(date: Date): string {
  const str = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Returns "5 de mayo" */
export function formatShortDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

/** Returns "5 de mayo de 2026" */
export function formatLongDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Returns the first day of the month for a given Date. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Adds (or subtracts) `count` months, always returning the 1st of the month. */
export function addMonths(date: Date, count: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + count, 1);
  return d;
}

/** Parses a "YYYY-MM-DD" string into a local Date. */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Returns the "YYYY-MM" key for a "YYYY-MM-DD" date string. */
export function monthOfDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Returns the year for a "YYYY-MM" key. */
export function yearOfMonth(monthKey: string): number {
  return parseInt(monthKey.slice(0, 4), 10);
}
