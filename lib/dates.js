// Brisbane time helpers for the Recomp Games. A bug in any of these would
// silently misalign every check-in for the whole challenge, so:
//   1. Every "now-dependent" helper accepts an optional `now` Date so the
//      sanity script can assert at fixed timestamps without monkey-patching
//      Date.now. Don't remove the optional arg — it's the whole reason these
//      can be tested.
//   2. All Brisbane wall-clock reads go through `Intl.DateTimeFormat` rather
//      than hand-rolled UTC+10 math. Brisbane has no DST so the offset is
//      fixed, but we never want to encode that ourselves.

const TZ = 'Australia/Brisbane';
const CHALLENGE_START_YMD = '2026-06-01'; // Monday, week 1

// Read Brisbane Y/M/D/weekday from a Date. Returns plain ints + ISO weekday (1=Mon..7=Sun).
function brisbaneParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(date);
  const get = (t) => parts.find(p => p.type === t).value;
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    year:       Number(get('year')),
    month:      Number(get('month')),
    day:        Number(get('day')),
    isoWeekday: weekdayMap[get('weekday')],
  };
}

export function todayInBrisbaneYMD(now = new Date()) {
  const { year, month, day } = brisbaneParts(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isMondayInBrisbane(now = new Date()) {
  return brisbaneParts(now).isoWeekday === 1;
}

// Monday on or before "today in Brisbane". Returns 'YYYY-MM-DD'.
export function currentWeekStart(now = new Date()) {
  const { year, month, day, isoWeekday } = brisbaneParts(now);
  // Construct a UTC date for today's Brisbane Y-M-D, then subtract (isoWeekday-1) days.
  // We use UTC arithmetic here purely as a calendar — no timezone semantics attached.
  const utc = Date.UTC(year, month - 1, day);
  const monday = new Date(utc - (isoWeekday - 1) * 86400000);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ymdToUTC(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function weekNumber(weekStartYMD) {
  // weekStartYMD and CHALLENGE_START_YMD are both Mondays — diff is a whole number of weeks.
  // Clamp at 1: any week_start at or before the challenge start counts as "Week 1" for display.
  const diffWeeks = Math.round(
    (ymdToUTC(weekStartYMD) - ymdToUTC(CHALLENGE_START_YMD)) / (7 * 86400000)
  );
  return Math.max(1, diffWeeks + 1);
}

// Hand-coded 3-letter month names. We don't use Intl `month: 'short'` because
// it's locale + ICU-version dependent: modern en-AU emits "June"/"Sept" (variable
// length), en-GB emits "Sept" for September. Hand-coding keeps the UI consistent
// across Node/browser versions and matches the design's "Aug" / "Sep" style.
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function weekRangeLabel(weekStartYMD) {
  // "5–11 Aug" when the week stays in one month, "29 Jul–4 Aug" when it crosses.
  const startUTC = ymdToUTC(weekStartYMD);
  const start = new Date(startUTC);
  const end   = new Date(startUTC + 6 * 86400000);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startStr = sameMonth
    ? String(start.getUTCDate())
    : `${start.getUTCDate()} ${MONTH_SHORT[start.getUTCMonth()]}`;
  const endStr = `${end.getUTCDate()} ${MONTH_SHORT[end.getUTCMonth()]}`;
  return `${startStr}–${endStr}`;
}

// Format a 'YYYY-MM-DD' as 'Mon 1 Jun 2026'. Used by the ComingSoon view and
// anywhere a single calendar date needs to render for humans (vs. weekRangeLabel
// which renders a range). Calendar-date semantics only — no timezone shift.
export function formatYMDForDisplay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  // UTC anchor so the day-of-week math matches the calendar date regardless of
  // the runtime's local timezone.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return `${WEEKDAY_SHORT[dt.getUTCDay()]} ${d} ${MONTH_SHORT[m - 1]} ${y}`;
}

export function totalWeeks() { return 26; }

export function isBeforeChallengeStart(now = new Date()) {
  // True while the current Brisbane Monday is strictly earlier than the challenge start.
  // YYYY-MM-DD strings sort lexicographically — no Date math needed.
  return currentWeekStart(now) < CHALLENGE_START_YMD;
}

export { CHALLENGE_START_YMD };
