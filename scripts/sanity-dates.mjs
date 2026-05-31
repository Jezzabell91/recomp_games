// Sanity-check the Brisbane date helpers. A bug in `currentWeekStart` would
// silently misalign every check-in for the whole challenge, so we exercise
// the helpers at a fixed set of timestamps that span the obvious edge cases:
// pre-challenge "today", the launch Monday, late-Monday-Brisbane, the rollover
// into Tuesday Brisbane (relevant because the trigger's grace window lives
// there), Sunday end-of-week, and the second week.
//
// Run: `node scripts/sanity-dates.mjs`
// All helpers accept an optional `now` Date — no Date.now monkey-patching.

import {
  currentWeekStart,
  isMondayInBrisbane,
  pointsForToday,
  todayInBrisbaneYMD,
  isBeforeChallengeStart,
  weekNumber,
  weekRangeLabel,
  formatYMDForDisplay,
  CHALLENGE_START_YMD,
} from '../lib/dates.js';

let failed = 0;

function eq(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed++;
  const mark = ok ? '✓' : '✗';
  console.log(`  ${mark} ${label}`);
  if (!ok) console.log(`      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
}

// Brisbane = UTC+10 year-round (no DST), so `+10:00` is safe.
const mon0001  = new Date('2026-06-01T00:01:00+10:00');
const mon2359  = new Date('2026-06-01T23:59:00+10:00');
const tue0001  = new Date('2026-06-02T00:01:00+10:00');
const sun2359  = new Date('2026-06-07T23:59:00+10:00');
const mon2     = new Date('2026-06-08T00:00:00+10:00');
const today    = new Date('2026-05-24T12:00:00+10:00');

console.log('Mon 2026-06-01 00:01 Brisbane (launch day)');
eq('currentWeekStart',   currentWeekStart(mon0001),   '2026-06-01');
eq('isMondayInBrisbane', isMondayInBrisbane(mon0001), true);
eq('weekNumber(week 1)', weekNumber('2026-06-01'),    1);
eq('todayInBrisbaneYMD', todayInBrisbaneYMD(mon0001), '2026-06-01');
eq('isBeforeChallengeStart', isBeforeChallengeStart(mon0001), false);

console.log('\nMon 2026-06-01 23:59 Brisbane (still Monday)');
eq('currentWeekStart',   currentWeekStart(mon2359),   '2026-06-01');
eq('isMondayInBrisbane', isMondayInBrisbane(mon2359), true);

console.log('\nTue 2026-06-02 00:01 Brisbane (rolled into Tuesday)');
eq('currentWeekStart',   currentWeekStart(tue0001),   '2026-06-01');
eq('isMondayInBrisbane', isMondayInBrisbane(tue0001), false);

console.log('\nSun 2026-06-07 23:59 Brisbane (end of week 1)');
eq('currentWeekStart',   currentWeekStart(sun2359),   '2026-06-01');
eq('isMondayInBrisbane', isMondayInBrisbane(sun2359), false);

console.log('\nMon 2026-06-08 00:00 Brisbane (week 2)');
eq('currentWeekStart',   currentWeekStart(mon2),      '2026-06-08');
eq('weekNumber(week 2)', weekNumber('2026-06-08'),    2);

console.log('\nToday-ish 2026-05-24 12:00 Brisbane (pre-challenge)');
eq('currentWeekStart',      currentWeekStart(today),       '2026-05-18');
eq('isBeforeChallengeStart', isBeforeChallengeStart(today), true);
eq('weekNumber(pre-launch is clamped to 1)', weekNumber('2026-05-18'), 1);

console.log('\npointsForToday (Brisbane day-of-week tiers)');
eq('Mon → 5', pointsForToday(new Date('2026-06-01T12:00:00+10:00')), 5);
eq('Tue → 4', pointsForToday(new Date('2026-06-02T12:00:00+10:00')), 4);
eq('Wed → 3', pointsForToday(new Date('2026-06-03T12:00:00+10:00')), 3);
eq('Thu → 2', pointsForToday(new Date('2026-06-04T12:00:00+10:00')), 2);
eq('Fri → 1', pointsForToday(new Date('2026-06-05T12:00:00+10:00')), 1);
eq('Sat → 0', pointsForToday(new Date('2026-06-06T12:00:00+10:00')), 0);
eq('Sun → 0', pointsForToday(new Date('2026-06-07T12:00:00+10:00')), 0);

console.log('\nweekRangeLabel');
eq("'2026-06-01' → '1–7 Jun'",      weekRangeLabel('2026-06-01'),  '1–7 Jun');
eq("'2026-08-31' → '31 Aug–6 Sep'", weekRangeLabel('2026-08-31'),  '31 Aug–6 Sep');

console.log('\nformatYMDForDisplay');
eq("'2026-06-01' → 'Mon 1 Jun 2026'", formatYMDForDisplay(CHALLENGE_START_YMD), 'Mon 1 Jun 2026');
eq("'2026-09-14' → 'Mon 14 Sep 2026'", formatYMDForDisplay('2026-09-14'),       'Mon 14 Sep 2026');

console.log(`\n${failed === 0 ? '✓ all assertions passed' : `✗ ${failed} assertion(s) failed`}`);
process.exit(failed === 0 ? 0 : 1);
