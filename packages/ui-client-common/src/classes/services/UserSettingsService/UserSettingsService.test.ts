import {
  describe,
  expect,
  it,
} from 'vitest';

import { UserSettingsService } from './UserSettingsService';

describe('UserSettingsService', () => {
  it('shows the user-feedback tooltip by default', () => {
    expect(new UserSettingsService().showShowUserFeedbackTooltip).toBe(true);
  });

  it('stores tooltip preference changes per service instance', () => {
    const firstService = new UserSettingsService();
    const secondService = new UserSettingsService();

    firstService.showShowUserFeedbackTooltip = false;

    expect(firstService.showShowUserFeedbackTooltip).toBe(false);
    expect(secondService.showShowUserFeedbackTooltip).toBe(true);
  });
});
