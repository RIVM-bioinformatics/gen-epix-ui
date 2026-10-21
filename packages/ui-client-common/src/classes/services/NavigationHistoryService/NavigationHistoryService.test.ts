import {
  describe,
  expect,
  it,
} from 'vitest';

import { NavigationHistoryService } from './NavigationHistoryService';

describe('NavigationHistoryService', () => {
  it('starts with an empty history', () => {
    expect(new NavigationHistoryService().navigationHistory).toEqual([]);
  });

  it('keeps history arrays independent between instances', () => {
    const firstService = new NavigationHistoryService();
    const secondService = new NavigationHistoryService();

    expect(firstService.navigationHistory).not.toBe(secondService.navigationHistory);

    firstService.navigationHistory.push('/home', '/cases', '/home');

    expect(firstService.navigationHistory).toEqual(['/home', '/cases', '/home']);
    expect(secondService.navigationHistory).toEqual([]);
  });
});
