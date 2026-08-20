/**
 * Utility functions for parsing LMS date/time strings
 * and checking timeframes (24 hours, 7 days).
 */

export function parseTimeToDate(timeStr?: string, baseDate: Date = new Date()): Date | null {
  if (!timeStr) return null;
  const str = timeStr.trim().toLowerCase();

  // Handle relative strings: "2 hours 47 mins ago", "1 day 2 hours ago", "45 mins ago", "yesterday", etc.
  if (str.includes('ago') || str.includes('yesterday') || str.includes('today')) {
    let offsetMs = 0;
    const daysMatch = str.match(/(\d+)\s*day/);
    const hoursMatch = str.match(/(\d+)\s*hour/);
    const minsMatch = str.match(/(\d+)\s*min/);
    const secsMatch = str.match(/(\d+)\s*sec/);

    if (daysMatch) offsetMs += parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000;
    if (hoursMatch) offsetMs += parseInt(hoursMatch[1], 10) * 60 * 60 * 1000;
    if (minsMatch) offsetMs += parseInt(minsMatch[1], 10) * 60 * 1000;
    if (secsMatch) offsetMs += parseInt(secsMatch[1], 10) * 1000;
    if (str.includes('yesterday')) offsetMs += 24 * 60 * 60 * 1000;

    return new Date(baseDate.getTime() - offsetMs);
  }

  // Handle absolute strings: "19 Aug 2026", "2026-08-19T...", etc.
  const parsed = Date.parse(timeStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

export function isWithinTimeframe(
  timeStr: string | undefined,
  timeframe: '24h' | '7d',
  baseDate: Date = new Date()
): boolean {
  if (!timeStr) return false;
  const date = parseTimeToDate(timeStr, baseDate);
  if (!date) return false;

  const diffMs = Math.max(0, baseDate.getTime() - date.getTime());
  const maxMs = timeframe === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  return diffMs <= maxMs;
}
