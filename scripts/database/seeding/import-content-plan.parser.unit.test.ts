import {
  statusToPriorityBucket,
  statusToProductionStatus,
  calendarStatusToPostStatus,
  parseShortDate,
  parseTimeOfDay,
  combineDateTime,
  splitHashtags,
  normalizeArtist,
  normalizeTitle,
} from './import-content-plan.parser';

describe('statusToPriorityBucket', () => {
  it.each([
    ['✅ DONE', 'done'],
    ['📅 MAY', 'may'],
    ['📅 JUNE', 'june'],
    ['⏳ LATER', 'later'],
    ['⏳ BACKLOG', 'backlog'],
  ])('maps Excel status %s → bucket %s', (raw, expected) => {
    expect(statusToPriorityBucket(raw)).toBe(expected);
  });

  it('returns null for unknown status', () => {
    expect(statusToPriorityBucket('???')).toBeNull();
    expect(statusToPriorityBucket(null)).toBeNull();
  });
});

describe('statusToProductionStatus', () => {
  it('maps DONE → ready', () => {
    expect(statusToProductionStatus('✅ DONE')).toBe('ready');
  });
  it('defaults to idea for unknown / null', () => {
    expect(statusToProductionStatus(null)).toBe('idea');
    expect(statusToProductionStatus('something else')).toBe('idea');
  });
});

describe('calendarStatusToPostStatus', () => {
  it('maps PLAN → planned and POSTED → published', () => {
    expect(calendarStatusToPostStatus('PLAN')).toBe('planned');
    expect(calendarStatusToPostStatus('POSTED')).toBe('published');
  });
  it('handles RECORDED → scheduled', () => {
    expect(calendarStatusToPostStatus('RECORDED')).toBe('scheduled');
  });
});

describe('parseShortDate', () => {
  it('parses M/D into ISO date string in target year', () => {
    expect(parseShortDate('5/1', 2026)).toBe('2026-05-01');
    expect(parseShortDate('12/31', 2025)).toBe('2025-12-31');
  });
  it('returns null for unparseable input', () => {
    expect(parseShortDate('not-a-date', 2026)).toBeNull();
  });
});

describe('parseTimeOfDay', () => {
  it.each([
    ['7PM', '19:00'],
    ['8 PM', '20:00'],
    ['12AM', '00:00'],
    ['12PM', '12:00'],
    ['09:30', '09:30'],
  ])('parses %s → %s', (raw, expected) => {
    expect(parseTimeOfDay(raw)).toBe(expected);
  });

  it('falls back to 19:00 when missing', () => {
    expect(parseTimeOfDay(null)).toBe('19:00');
  });
});

describe('combineDateTime', () => {
  it('combines date + time into ISO timestamp', () => {
    const out = combineDateTime('2026-05-01', '19:00');
    expect(out).toBe('2026-05-01T19:00:00.000Z');
  });
});

describe('splitHashtags', () => {
  it('splits on whitespace and commas, drops empties', () => {
    expect(splitHashtags('#a #b , #c')).toEqual(['#a', '#b', '#c']);
  });
  it('returns [] for null', () => {
    expect(splitHashtags(null)).toEqual([]);
  });
});

describe('normalizeArtist', () => {
  it('strips "the" prefix', () => {
    expect(normalizeArtist('The Beatles')).toBe('beatles');
  });
  it('expands known abbreviations', () => {
    expect(normalizeArtist('RHCP')).toBe('red hot chili peppers');
    expect(normalizeArtist('GnR')).toBe("guns n' roses");
  });
});

describe('normalizeTitle', () => {
  it('lowercases and trims', () => {
    expect(normalizeTitle('  Hotel California  ')).toBe('hotel california');
  });
  it('strips parenthetical and "Solo"/"Acoustic"/"Unplugged" suffix', () => {
    expect(normalizeTitle('Good Riddance (Time of Your Life)')).toBe('good riddance');
    expect(normalizeTitle('Hotel California Solo')).toBe('hotel california');
    expect(normalizeTitle('Wonderwall Acoustic')).toBe('wonderwall');
  });
});
