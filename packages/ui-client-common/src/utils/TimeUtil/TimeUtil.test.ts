import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { TimeUtil } from './TimeUtil';

const i18nMocks = vi.hoisted(() => ({
  t: vi.fn((translationKey: string, options?: Record<string, number>) => {
    return translationKey.replace(/\{\{(\w+)\}\}/g, (_placeholder, name: string) => {
      return String(options?.[name] ?? '');
    });
  }),
}));

vi.mock('i18next', () => ({
  t: i18nMocks.t,
}));

const TIME_CASES: Array<[number, boolean, string]> = [
  [-1, false, 'less than a second'],
  [0, false, 'less than a second'],
  [999, false, 'less than a second'],
  [1000, false, '1 seconds'],
  [9000, true, 'a few seconds'],
  [9000, false, '9 seconds'],
  [9999, true, 'less than a minute'],
  [10000, true, 'less than a minute'],
  [10000, false, '10 seconds'],
  [60000, false, '1 minutes'],
  [61000, false, '1 minutes and 1 seconds'],
  [120000, false, '2 minutes'],
  [150000, true, '2 minutes'],
  [3600000, false, '1 hours and 0 minutes'],
  [5400000, false, '1 hours and 30 minutes'],
  [5400000, true, 'more than 1 hours'],
  [91800000, false, '25 hours and 30 minutes'],
];

afterEach(() => {
  i18nMocks.t.mockClear();
});

describe('TimeUtil.getReadableTimeRemaining', () => {
  it.each(TIME_CASES)('formats %s milliseconds with round=%s', (milliseconds, round, expected) => {
    expect(TimeUtil.getReadableTimeRemaining(milliseconds, round)).toBe(expected);
  });
});
