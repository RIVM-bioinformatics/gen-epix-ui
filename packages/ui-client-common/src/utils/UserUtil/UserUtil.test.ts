import {
  describe,
  expect,
  it,
} from 'vitest';
import { t } from 'i18next';
import type { CommonDbUser } from '@gen-epix/api-commondb';

import { UserUtil } from './UserUtil';

describe('UserUtil.getUserDisplayValue', () => {
  it('returns the user name and key', () => {
    const user: CommonDbUser = {
      key: 'ada-lovelace',
      name: 'Ada Lovelace',
      organization_id: 'org-1',
      roles: [],
    };

    expect(UserUtil.getUserDisplayValue(user, t)).toBe('Ada Lovelace (ada-lovelace)');
  });

  it('returns a translated fallback for a missing user', () => {
    const unknownUserMessage = t`Unknown user`;

    expect(UserUtil.getUserDisplayValue(null, t)).toBe(unknownUserMessage);
  });
});
